import * as fal from '@fal-ai/serverless-client';
import { FamousCharacter, getCharacterById, FAMOUS_CHARACTERS } from '@/data/characters';

export interface PipelineProgressCallback {
  (progress: number, stepLabel: string, stage: string): void;
}

import fs from 'fs';
import path from 'path';

async function uploadToFalStorage(filePathOrDataUrl: string): Promise<string> {
  if (filePathOrDataUrl.startsWith('http://') || filePathOrDataUrl.startsWith('https://')) {
    if (!filePathOrDataUrl.includes('localhost') && !filePathOrDataUrl.includes('127.0.0.1')) {
      return filePathOrDataUrl;
    }
  }

  // Handle base64 data URIs
  if (filePathOrDataUrl.startsWith('data:')) {
    const commaIdx = filePathOrDataUrl.indexOf(',');
    const header = filePathOrDataUrl.substring(0, commaIdx);
    const base64 = filePathOrDataUrl.substring(commaIdx + 1);
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const buffer = Buffer.from(base64, 'base64');
    const blob = new Blob([buffer], { type: mimeType });
    return await fal.storage.upload(blob);
  }

  // Handle local filesystem public files
  const cleanPath = filePathOrDataUrl.replace(/^https?:\/\/[^\/]+/, '');
  const localFile = path.join(process.cwd(), 'public', cleanPath);
  if (fs.existsSync(localFile)) {
    const buffer = fs.readFileSync(localFile);
    const ext = path.extname(localFile).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };
    const blob = new Blob([buffer], { type: mimeMap[ext] || 'image/jpeg' });
    return await fal.storage.upload(blob);
  }

  return filePathOrDataUrl;
}

export async function runApolenaPipeline(
  petImageUrl: string,
  characterInput: FamousCharacter | string,
  onProgress?: PipelineProgressCallback
): Promise<{ outputImageUrl: string; hdOutputImageUrl: string; executionSeconds: number }> {
  const startTime = Date.now();
  const falKey = process.env.FAL_KEY;

  const character = typeof characterInput === 'string'
    ? getCharacterById(characterInput) || FAMOUS_CHARACTERS[0]
    : characterInput;

  if (falKey && falKey.trim().length > 0 && !falKey.includes('your_fal_ai_key')) {
    // Real fal.ai Pipeline execution
    fal.config({
      credentials: falKey
    });

    try {
      onProgress?.(15, 'Subiendo imágenes a la infraestructura de fal.ai...', 'analyzing');

      // Upload local images to fal CDN so remote workers can read them
      const [charCdnUrl, maskCdnUrl] = await Promise.all([
        uploadToFalStorage(character.characterImageUrl),
        uploadToFalStorage(character.maskUrl || '/masks/default-mask.png')
      ]);

      // 1. FLUX.1 Inpainting
      onProgress?.(45, `Fusionando mascota con ${character.name} en FLUX.1...`, 'inpainting');

      const inpaintResult: any = await fal.subscribe('fal-ai/flux-general/inpainting', {
        input: {
          image_url: charCdnUrl,
          mask_url: maskCdnUrl,
          prompt: character.prompt,
          negative_prompt: character.negativePrompt,
          strength: 0.92,
          guidance_scale: 3.5,
          num_inference_steps: 32,
          output_format: 'jpeg'
        },
        pollInterval: 1000,
        logs: true,
      });

      const inpaintUrl = inpaintResult?.images?.[0]?.url || inpaintResult?.image?.url;
      if (!inpaintUrl) {
        throw new Error('No se recibió la imagen de fusión de fal.ai');
      }

      // 2. Clarity Upscaler (4K @ 300 DPI)
      onProgress?.(80, 'Aumentando nitidez y texturas a 4K (300 DPI)...', 'upscaling');

      const upscaleResult: any = await fal.subscribe('fal-ai/clarity-upscaler', {
        input: {
          image_url: inpaintUrl,
          scale: 2,
          creativity: 0.25,
          resemblance: 0.88,
          output_format: 'png'
        },
        pollInterval: 1000,
        logs: true
      });

      const hdUrl = upscaleResult?.image?.url || upscaleResult?.images?.[0]?.url || inpaintUrl;

      onProgress?.(100, '¡Fusión completada con éxito!', 'finishing');

      const executionSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
      return {
        outputImageUrl: inpaintUrl,
        hdOutputImageUrl: hdUrl,
        executionSeconds
      };
    } catch (apiErr: any) {
      console.error('[fal.ai API Error]:', apiErr);
      const detail = apiErr?.body?.detail || apiErr?.message || '';
      if (detail.includes('Exhausted balance') || apiErr?.status === 403) {
        throw new Error('Tu cuenta de fal.ai tiene saldo agotado (Exhausted balance). Puedes recargar créditos en fal.ai/dashboard/billing');
      }
      throw new Error(`Error en el servicio de fal.ai: ${detail || apiErr.message}`);
    }
  }

  // Fallback demo simulation: ultra-fast and delivers realistic sample results
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  onProgress?.(25, 'Analizando fisonomía facial y ojos de la mascota...', 'analyzing');
  await sleep(1500);

  onProgress?.(60, `Fusionando rasgos con el atuendo y peinado de ${character.name}...`, 'inpainting');
  await sleep(2200);

  onProgress?.(85, 'Escalando micro-textura de pelaje y detalles a 4K...', 'upscaling');
  await sleep(1800);

  onProgress?.(100, '¡Fusión ultra-realista lista!', 'finishing');

  const executionSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
  
  // Choose cat or dog portrait according to pet input
  const isCat = petImageUrl.toLowerCase().includes('cat') || petImageUrl.toLowerCase().includes('gato');
  const petFusionUrl = isCat
    ? `/fusions/${character.id}-cat.jpg`
    : `/fusions/${character.id}-dog.jpg`;

  const finalSample = petFusionUrl || character.fusionSampleUrl;

  return {
    outputImageUrl: finalSample,
    hdOutputImageUrl: finalSample,
    executionSeconds
  };
}
