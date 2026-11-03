import * as fal from '@fal-ai/serverless-client';
import fs from 'fs';
import path from 'path';
import { FamousCharacter, getCharacterById, FAMOUS_CHARACTERS } from '@/data/characters';
import { AIProviderId, ApiKeysOverride, GeneratedVariant } from './types';

export interface PipelineProgressCallback {
  (progress: number, stepLabel: string, stage: string): void;
}

export interface MultiModelFusionInput {
  petImageUrl: string;
  secondPetImageUrl?: string | null;
  characterInput: FamousCharacter | string;
  customThemeImageUrl?: string | null;
  customPrompt?: string | null;
  provider: AIProviderId;
  apiKeys?: ApiKeysOverride;
  onProgress?: PipelineProgressCallback;
}

export interface MultiModelFusionOutput {
  outputImageUrl: string;
  hdOutputImageUrl: string;
  executionSeconds: number;
  providerUsed: AIProviderId;
  modelUsed: string;
  variants: GeneratedVariant[];
  isSimulation?: boolean;
}

interface ResolvedImageData {
  buffer: Buffer;
  mimeType: string;
  base64: string;
  ext: string;
}

/**
 * Resolves a data URI, local public path, or remote URL into Buffer + base64 + mimeType
 */
async function resolveImageData(source: string): Promise<ResolvedImageData> {
  if (source.startsWith('data:')) {
    const commaIdx = source.indexOf(',');
    const header = source.substring(0, commaIdx);
    const base64 = source.substring(commaIdx + 1);
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    return {
      buffer: Buffer.from(base64, 'base64'),
      mimeType,
      base64,
      ext
    };
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    if (!source.includes('localhost') && !source.includes('127.0.0.1')) {
      const res = await fetch(source);
      if (!res.ok) throw new Error(`No se pudo descargar la imagen remota: ${source}`);
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const mimeType = res.headers.get('content-type') || 'image/jpeg';
      const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
      return {
        buffer,
        mimeType,
        base64: buffer.toString('base64'),
        ext
      };
    }
  }

  // Local public directory file
  const cleanPath = source.replace(/^https?:\/\/[^\/]+/, '');
  const localFile = path.join(process.cwd(), 'public', cleanPath);
  if (fs.existsSync(localFile)) {
    const buffer = fs.readFileSync(localFile);
    const extName = path.extname(localFile).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };
    const mimeType = mimeMap[extName] || 'image/jpeg';
    return {
      buffer,
      mimeType,
      base64: buffer.toString('base64'),
      ext: extName.replace('.', '') || 'jpg'
    };
  }

  throw new Error(`No se pudo resolver la imagen: ${source.substring(0, 60)}`);
}

/**
 * Builds the comprehensive multi-image fusion prompt
 */
function buildFusionPrompt(
  character: FamousCharacter,
  hasSecondPet: boolean,
  hasCustomThemeImage: boolean,
  customPrompt?: string | null
): string {
  const petCountText = hasSecondPet
    ? 'BOTH uploaded pets (Pet #1 from the first image and Pet #2 from the second image) side by side'
    : 'the uploaded pet from the first image';

  const baseInstruction = hasCustomThemeImage
    ? `Create an ultra-realistic, cohesive cinematic photograph that fuses ${petCountText} into the exact costume, accessories, cultural theme, lighting, and background environment shown in the last reference image (the theme reference image).`
    : `Create an ultra-realistic, cohesive cinematic photograph of ${petCountText}: ${character.prompt}`;

  const identityRules = `
CRITICAL IDENTITY, PROPORTION & PHOTOREALISM RULES:
1. EXACT PET IDENTITY: Preserve 100% of the uploaded pet's authentic facial identity from the first reference image: exact breed, fur colors, Siamese/tabby/bicolor markings, nose color, eye color, ear shape, and natural expression.
2. NATURAL ANATOMICAL PROPORTIONS: Maintain realistic, natural feline/canine head-to-shoulder and neck proportions. NEVER make the head oversized, bobble-headed, stylized, 3D-rendered, or smooth plastic.
3. ORGANIC WARDROBE INTEGRATION: Dress the pet naturally in the exact garments, collar, lapel, headwear, and accessories from the theme reference image, with real fur micro-textures overlapping the fabric collar naturally.
4. PHOTOGRAPHY SPECS: Shot on 35mm full-frame camera, 85mm f/1.8 prime lens, natural studio or golden-hour lighting matching the reference scene, authentic film grain and sharp eye catchlights. No watermarks, no text.`;

  const extraUserPrompt = customPrompt?.trim()
    ? `\nADDITIONAL USER INSTRUCTIONS: ${customPrompt.trim()}`
    : '';

  return `${baseInstruction}\n${identityRules}${extraUserPrompt}`;
}

/**
 * ============================================================================
 * 1. OPENAI PIPELINE: gpt-image-1 (Multi-Image Edit) + GPT-4o Vision Fallback
 * ============================================================================
 */
async function runOpenAIFusion(
  input: MultiModelFusionInput,
  character: FamousCharacter,
  openaiKey: string,
  preferredModels: string[] = ['gpt-image-1.5', 'chatgpt-image-latest', 'gpt-image-2']
): Promise<{ imageUrl: string; modelUsed: string }> {
  const { petImageUrl, secondPetImageUrl, customThemeImageUrl, customPrompt, onProgress } = input;
  const themeSource = customThemeImageUrl || character.characterImageUrl;
  const hasSecondPet = Boolean(secondPetImageUrl);

  onProgress?.(20, 'Preparando imágenes de referencia para OpenAI...', 'analyzing');

  const pet1Data = await resolveImageData(petImageUrl);
  const pet2Data = secondPetImageUrl ? await resolveImageData(secondPetImageUrl) : null;
  const themeData = await resolveImageData(themeSource);

  const fusionPrompt = buildFusionPrompt(
    character,
    hasSecondPet,
    Boolean(customThemeImageUrl),
    customPrompt
  );

  // Attempt 1: Native Multi-Image Fusion with preferred models (/v1/images/edits)
  const editModels = preferredModels;

  for (const editModel of editModels) {
    try {
      onProgress?.(
        45,
        `Fusionando ${hasSecondPet ? 'las 2 mascotas' : 'tu mascota'} + temática en OpenAI (${editModel})...`,
        'inpainting'
      );

      const formData = new FormData();
      formData.append('model', editModel);
      formData.append('prompt', fusionPrompt);
      formData.append('size', hasSecondPet ? '1536x1024' : '1024x1024');
      // Cost-optimized quality tier: 'medium' reduces cost by ~75% ($0.034 vs $0.133) while preserving photorealism
      formData.append('quality', 'medium');

      // Append Pet 1, optional Pet 2, and Theme Reference Image
      formData.append(
        'image[]',
        new Blob([new Uint8Array(pet1Data.buffer)], { type: pet1Data.mimeType }),
        `pet1.${pet1Data.ext}`
      );
      if (pet2Data) {
        formData.append(
          'image[]',
          new Blob([new Uint8Array(pet2Data.buffer)], { type: pet2Data.mimeType }),
          `pet2.${pet2Data.ext}`
        );
      }
      formData.append(
        'image[]',
        new Blob([new Uint8Array(themeData.buffer)], { type: themeData.mimeType }),
        `theme.${themeData.ext}`
      );

      const editRes = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`
        },
        body: formData
      });

      if (editRes.ok) {
        const editJson = await editRes.json();
        const b64 = editJson?.data?.[0]?.b64_json;
        const url = editJson?.data?.[0]?.url;
        if (b64) {
          onProgress?.(95, `Retrato revelado con OpenAI ${editModel}`, 'finishing');
          return {
            imageUrl: `data:image/png;base64,${b64}`,
            modelUsed: `OpenAI ${editModel}`
          };
        }
        if (url) {
          onProgress?.(95, `Retrato revelado con OpenAI ${editModel}`, 'finishing');
          return {
            imageUrl: url,
            modelUsed: `OpenAI ${editModel}`
          };
        }
      } else {
        const errBody = await editRes.text();
        console.warn(`[OpenAI ${editModel} fallback notice]:`, errBody);
        if (editRes.status === 401) {
          throw new Error('La clave OPENAI_API_KEY no es válida (Error 401). Verifica tu API Key.');
        }
        if (errBody.includes('insufficient_quota') || errBody.includes('billing_hard_limit_reached')) {
          throw new Error('Tu cuenta de OpenAI no tiene saldo disponible (insufficient_quota).');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('OPENAI_API_KEY') || err.message?.includes('insufficient_quota')) {
        throw err;
      }
      console.warn(`[OpenAI ${editModel} exception]:`, err);
    }
  }

  // Attempt 2: Cost-optimized Multimodal GPT-4o-mini Vision Analysis + OpenAI Image Generation (medium quality)
  onProgress?.(
    60,
    'Analizando fisonomía y vestimenta con GPT-4o-mini Vision...',
    'analyzing'
  );

  const visionContent: any[] = [
    {
      type: 'text',
      text: `You are an expert visual director for photorealistic pet portrait fusion.
Inspect the attached images carefully:
- Image 1 is Pet #1.${pet2Data ? '\n- Image 2 is Pet #2.' : ''}
- The last image is the Theme/Costume Reference (${character.name}).

Write a single, detailed English image generation prompt (max 140 words) for a photorealistic 8K photograph showing ${hasSecondPet ? 'both pets side by side' : 'this exact pet'} dressed in the exact costume, headpieces, jewelry, and setting of the theme reference image.
You MUST explicitly describe:
1. Pet #1's exact species, breed, fur colors, tabby stripes or patches, eye color, nose color/markings, and facial expression.${pet2Data ? "\n2. Pet #2's exact species, breed, fur colors, bicolor/tuxedo patches or markings, eye color, nose markings, and expression." : ''}
3. Every detail of the royal/character garments, golden crowns/diadems, necklaces, fabric patterns, and background scenery from the theme image.
${customPrompt ? `4. Also incorporate: ${customPrompt}` : ''}
Output ONLY the raw prompt text, nothing else.`
    },
    {
      type: 'image_url',
      image_url: { url: `data:${pet1Data.mimeType};base64,${pet1Data.base64}`, detail: 'low' }
    }
  ];

  if (pet2Data) {
    visionContent.push({
      type: 'image_url',
      image_url: { url: `data:${pet2Data.mimeType};base64,${pet2Data.base64}`, detail: 'low' }
    });
  }

  visionContent.push({
    type: 'image_url',
    image_url: { url: `data:${themeData.mimeType};base64,${themeData.base64}`, detail: 'low' }
  });

  let detailedPrompt = fusionPrompt;
  const visionRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: visionContent }],
      max_tokens: 300
    })
  });

  if (visionRes.ok) {
    const visionJson = await visionRes.json();
    const synthesized = visionJson?.choices?.[0]?.message?.content?.trim();
    if (synthesized) {
      detailedPrompt = synthesized;
    }
  }

  onProgress?.(80, 'Renderizando fotografía de estudio con OpenAI gpt-image-1.5...', 'inpainting');

  const genRes = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-image-1.5',
      prompt: detailedPrompt,
      n: 1,
      size: hasSecondPet ? '1536x1024' : '1024x1024',
      quality: 'medium'
    })
  });

  if (!genRes.ok) {
    const errText = await genRes.text();
    throw new Error(`Error en OpenAI API: ${errText}`);
  }

  const genJson = await genRes.json();
  const b64 = genJson?.data?.[0]?.b64_json;
  const genUrl = genJson?.data?.[0]?.url;
  if (b64) {
    return {
      imageUrl: `data:image/png;base64,${b64}`,
      modelUsed: 'OpenAI gpt-image-1.5 (Medium)'
    };
  }
  if (genUrl) {
    return {
      imageUrl: genUrl,
      modelUsed: 'OpenAI gpt-image-1.5 (Medium)'
    };
  }
  throw new Error('OpenAI no devolvió una imagen válida.');
}

/**
 * ============================================================================
 * 2. GOOGLE GEMINI PIPELINE: gemini-2.5-flash-image / gemini-3.1-flash-image
 * ============================================================================
 */
async function runGeminiFusion(
  input: MultiModelFusionInput,
  character: FamousCharacter,
  geminiKey: string,
  openaiKeyFallback?: string
): Promise<{ imageUrl: string; modelUsed: string }> {
  const { petImageUrl, secondPetImageUrl, customThemeImageUrl, customPrompt, onProgress } = input;
  const themeSource = customThemeImageUrl || character.characterImageUrl;
  const hasSecondPet = Boolean(secondPetImageUrl);

  onProgress?.(20, 'Codificando imágenes de referencia para Google Gemini...', 'analyzing');

  const pet1Data = await resolveImageData(petImageUrl);
  const pet2Data = secondPetImageUrl ? await resolveImageData(secondPetImageUrl) : null;
  const themeData = await resolveImageData(themeSource);

  const fusionPrompt = buildFusionPrompt(
    character,
    hasSecondPet,
    Boolean(customThemeImageUrl),
    customPrompt
  );

  const parts: any[] = [
    {
      inlineData: {
        mimeType: pet1Data.mimeType,
        data: pet1Data.base64
      }
    }
  ];

  if (pet2Data) {
    parts.push({
      inlineData: {
        mimeType: pet2Data.mimeType,
        data: pet2Data.base64
      }
    });
  }

  parts.push({
    inlineData: {
      mimeType: themeData.mimeType,
      data: themeData.base64
    }
  });

  parts.push({ text: fusionPrompt });

  // Ordered from lowest cost ($0.039/img) to standard ($0.067/img), avoiding expensive pro tier ($0.134/img)
  const candidateModels = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image'
  ];

  let lastError = '';

  for (const modelId of candidateModels) {
    onProgress?.(
      45,
      `Fusionando imágenes con Google ${modelId}...`,
      'inpainting'
    );

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      })
    });

    if (res.ok) {
      const json = await res.json();
      const responseParts = json?.candidates?.[0]?.content?.parts || [];
      const imgPart = responseParts.find((p: any) => p.inlineData && p.inlineData.data);
      if (imgPart) {
        const mime = imgPart.inlineData.mimeType || 'image/png';
        return {
          imageUrl: `data:${mime};base64,${imgPart.inlineData.data}`,
          modelUsed: `Google ${modelId}`
        };
      }
    } else {
      lastError = await res.text();
      if (res.status === 400 && lastError.includes('API_KEY_INVALID')) {
        throw new Error('La clave GEMINI_API_KEY no es válida. Verifica tu API Key en Google AI Studio.');
      }
    }
  }

  // Fallback for Free-Tier Gemini Keys (where direct image output has limit: 0):
  // Use `gemini-2.5-flash` Vision (free-tier eligible) + cost-optimized OpenAI medium edit
  onProgress?.(
    60,
    'Analizando fisonomía exacta y proporciones con Google Gemini Flash Vision...',
    'analyzing'
  );

  const visionPrompt = `You are a master pet portrait director. Inspect Image 1 (the Pet) and Image 2 (the Theme Reference: ${character.name}).
Write a concise English photographic direction note (max 90 words) specifying:
1. The pet's exact breed, coat coloration, point/tabby markings, eye color, ear shape, and natural head-to-body anatomical proportions.
2. How the pet is dressed in the exact wardrobe, collar, and accessories of Image 2 with realistic studio lighting and natural fur overlapping the collar.
Output ONLY the direction note, nothing else.`;

  const visionParts = [
    ...parts.slice(0, -1),
    { text: visionPrompt }
  ];

  let geminiDirectionNote = customPrompt || '';
  try {
    const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const visionRes = await fetch(visionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: visionParts }]
      })
    });

    if (visionRes.ok) {
      const visionJson = await visionRes.json();
      const textOut = visionJson?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || '')
        .join(' ')
        .trim();
      if (textOut) {
        geminiDirectionNote = customPrompt ? `${customPrompt}\n${textOut}` : textOut;
      }
    }
  } catch (e) {
    console.warn('[Gemini Flash vision fallback warning]:', e);
  }

  if (openaiKeyFallback && !openaiKeyFallback.includes('your_')) {
    onProgress?.(
      78,
      'Revelando retrato con dirección de Gemini Vision + gpt-image-1.5 (Medium)...',
      'inpainting'
    );
    const openAiResult = await runOpenAIFusion(
      {
        ...input,
        customPrompt: `${geminiDirectionNote}\nCompose a medium-closeup 85mm studio portrait angle with rich cinematic depth of field while strictly preserving natural head and body proportions.`
      },
      character,
      openaiKeyFallback,
      ['gpt-image-1.5', 'chatgpt-image-latest']
    );
    return {
      imageUrl: openAiResult.imageUrl,
      modelUsed: `Gemini Flash Vision + ${openAiResult.modelUsed.replace('OpenAI ', '')}`
    };
  }

  throw new Error(
    `Tu clave de Google Gemini está en nivel gratuito sin cuota de generación directa de imágenes (Error 429).`
  );
}

/**
 * ============================================================================
 * 3. FAL.AI PIPELINE: FLUX.1 Kontext Pro ($0.04) / Multi-Image ($0.08)
 * ============================================================================
 */
async function uploadToFalStorage(imageData: ResolvedImageData): Promise<string> {
  const blob = new Blob([new Uint8Array(imageData.buffer)], { type: imageData.mimeType });
  return await fal.storage.upload(blob);
}

async function runFalMultiImageFusion(
  input: MultiModelFusionInput,
  character: FamousCharacter,
  falKey: string
): Promise<{ imageUrl: string; hdImageUrl: string; modelUsed: string }> {
  const { petImageUrl, secondPetImageUrl, customThemeImageUrl, customPrompt, onProgress } = input;
  const themeSource = customThemeImageUrl || character.characterImageUrl;
  const hasSecondPet = Boolean(secondPetImageUrl);

  fal.config({ credentials: falKey });

  onProgress?.(20, 'Subiendo fotos de mascotas y referencia a fal.ai CDN...', 'analyzing');

  const pet1Data = await resolveImageData(petImageUrl);
  const pet2Data = secondPetImageUrl ? await resolveImageData(secondPetImageUrl) : null;
  const themeData = await resolveImageData(themeSource);

  const [pet1Cdn, pet2Cdn, themeCdn] = await Promise.all([
    uploadToFalStorage(pet1Data),
    pet2Data ? uploadToFalStorage(pet2Data) : Promise.resolve(null),
    uploadToFalStorage(themeData)
  ]);

  const imageUrls = [pet1Cdn, ...(pet2Cdn ? [pet2Cdn] : []), themeCdn];
  const fusionPrompt = buildFusionPrompt(
    character,
    hasSecondPet,
    Boolean(customThemeImageUrl),
    customPrompt
  );

  let fusedUrl = '';
  let modelUsed = 'FLUX.1 Kontext Pro';

  try {
    // Cost-optimized: use standard FLUX.1 Kontext Pro ($0.04/img) for 1 pet with catalog theme,
    // and only use Kontext Max Multi ($0.08/img) when combining 2 pets or custom theme reference
    if (!hasSecondPet && !customThemeImageUrl) {
      onProgress?.(50, 'Fusionando retrato con FLUX.1 Kontext Pro ($0.04)...', 'inpainting');
      const singleResult: any = await fal.subscribe('fal-ai/flux-pro/kontext', {
        input: {
          prompt: fusionPrompt,
          image_url: pet1Cdn,
          guidance_scale: 3.5,
          output_format: 'jpeg'
        },
        pollInterval: 1000,
        logs: true
      });
      fusedUrl = singleResult?.images?.[0]?.url || singleResult?.image?.url || '';
    } else {
      modelUsed = 'FLUX.1 Kontext Multi-Image';
      onProgress?.(
        50,
        `Fusionando ${imageUrls.length} imágenes con FLUX.1 Kontext Multi-Image...`,
        'inpainting'
      );

      const kontextResult: any = await fal.subscribe('fal-ai/flux-pro/kontext/max/multi', {
        input: {
          prompt: fusionPrompt,
          image_urls: imageUrls,
          guidance_scale: 3.5,
          num_images: 1,
          output_format: 'jpeg',
          aspect_ratio: hasSecondPet ? '3:2' : '1:1'
        },
        pollInterval: 1000,
        logs: true
      });

      fusedUrl = kontextResult?.images?.[0]?.url || kontextResult?.image?.url || '';
    }
  } catch (multiErr: any) {
    const detail = multiErr?.body?.detail || multiErr?.message || '';
    if (detail.includes('Exhausted balance') || multiErr?.status === 403) {
      throw new Error(
        'Tu cuenta de fal.ai tiene saldo agotado (Exhausted balance). Cambia al modelo OpenAI o Google Gemini, o recarga saldo en fal.ai/dashboard/billing.'
      );
    }

    onProgress?.(55, 'Ejecutando FLUX.1 Kontext Pro con la mascota principal...', 'inpainting');
    modelUsed = 'FLUX.1 Kontext Pro';
    const singleResult: any = await fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt: fusionPrompt,
        image_url: pet1Cdn,
        guidance_scale: 3.5,
        output_format: 'jpeg'
      },
      pollInterval: 1000,
      logs: true
    });
    fusedUrl = singleResult?.images?.[0]?.url || singleResult?.image?.url || '';
  }

  if (!fusedUrl) {
    throw new Error('No se recibió imagen de salida desde fal.ai.');
  }

  return {
    imageUrl: fusedUrl,
    hdImageUrl: fusedUrl,
    modelUsed
  };
}

/**
 * ============================================================================
 * UNIFIED COST-OPTIMIZED ORCHESTRATOR (SINGLE ENGINE + AUTOMATIC FAILOVER)
 * ============================================================================
 */
function getLiveEnvVar(key: string): string {
  const fromProcess = (process.env[key] || '').trim();
  if (fromProcess && !fromProcess.includes('your_')) return fromProcess;
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
      if (match && match[1]) {
        const val = match[1].trim().replace(/^["']|["']$/g, '');
        if (val && !val.includes('your_')) {
          process.env[key] = val;
          return val;
        }
      }
    }
  } catch (e) {}
  return '';
}

export async function runMultiModelFusionPipeline(
  input: MultiModelFusionInput
): Promise<MultiModelFusionOutput> {
  const startTime = Date.now();
  const { characterInput, provider, apiKeys, onProgress, petImageUrl, secondPetImageUrl } = input;

  const character =
    typeof characterInput === 'string'
      ? getCharacterById(characterInput) || FAMOUS_CHARACTERS[0]
      : characterInput;

  const openaiKey = (apiKeys?.openaiKey || getLiveEnvVar('OPENAI_API_KEY')).trim();
  const geminiKey = (apiKeys?.geminiKey || getLiveEnvVar('GEMINI_API_KEY')).trim();
  const falKey = (apiKeys?.falKey || getLiveEnvVar('FAL_KEY')).trim();

  const hasValidOpenAI = Boolean(openaiKey && !openaiKey.includes('your_'));
  const hasValidGemini = Boolean(geminiKey && !geminiKey.includes('your_'));
  const hasValidFal = Boolean(falKey && !falKey.includes('your_'));

  // Helper to resolve demo sample image
  const getSampleFallbackUrl = (variantIndex: 1 | 2) => {
    if (character.id === 'inca-empire') {
      return '/fusions/inca-empire-cats.jpg';
    }
    const isCat =
      petImageUrl.toLowerCase().includes('cat') || petImageUrl.toLowerCase().includes('gato');
    if (variantIndex === 1) {
      return isCat ? `/fusions/${character.id}-cat.jpg` : `/fusions/${character.id}-dog.jpg`;
    }
    return isCat ? `/fusions/${character.id}-dog.jpg` : `/fusions/${character.id}-cat.jpg`;
  };

  // Cost-optimized single-provider execution order:
  // Runs ONLY the user's selected provider first (paying for 1 single image per generation),
  // and only triggers another provider if the selected one is unconfigured or errors out.
  if (hasValidOpenAI || hasValidGemini || hasValidFal) {
    const providerOrder: AIProviderId[] = [
      provider,
      ...(['openai', 'gemini', 'fal'] as AIProviderId[]).filter((p) => p !== provider)
    ];

    let lastErrMessage = '';

    for (const candidateProvider of providerOrder) {
      const candidateStart = Date.now();

      if (candidateProvider === 'openai' && hasValidOpenAI) {
        try {
          const res = await runOpenAIFusion(input, character, openaiKey);
          const executionSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
          const variant: GeneratedVariant = {
            id: 'variant-openai',
            provider: 'openai',
            providerTitle: 'OpenAI Studio (Optimizado)',
            modelUsed: res.modelUsed,
            imageUrl: res.imageUrl,
            executionSeconds: parseFloat(((Date.now() - candidateStart) / 1000).toFixed(2))
          };
          onProgress?.(100, '¡Retrato revelado con éxito!', 'finishing');
          return {
            outputImageUrl: res.imageUrl,
            hdOutputImageUrl: res.imageUrl,
            executionSeconds,
            providerUsed: 'openai',
            modelUsed: res.modelUsed,
            variants: [variant]
          };
        } catch (err: any) {
          lastErrMessage = err?.message || 'Error en OpenAI Studio';
          console.warn('[Failover from OpenAI]:', lastErrMessage);
        }
      }

      if (candidateProvider === 'gemini' && hasValidGemini) {
        try {
          const res = await runGeminiFusion(input, character, geminiKey, openaiKey);
          const executionSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
          const variant: GeneratedVariant = {
            id: 'variant-gemini',
            provider: 'gemini',
            providerTitle: 'Google Gemini Studio',
            modelUsed: res.modelUsed,
            imageUrl: res.imageUrl,
            executionSeconds: parseFloat(((Date.now() - candidateStart) / 1000).toFixed(2))
          };
          onProgress?.(100, '¡Retrato revelado con éxito!', 'finishing');
          return {
            outputImageUrl: res.imageUrl,
            hdOutputImageUrl: res.imageUrl,
            executionSeconds,
            providerUsed: 'gemini',
            modelUsed: res.modelUsed,
            variants: [variant]
          };
        } catch (err: any) {
          lastErrMessage = err?.message || 'Error en Google Gemini Studio';
          console.warn('[Failover from Gemini]:', lastErrMessage);
        }
      }

      if (candidateProvider === 'fal' && hasValidFal) {
        try {
          const res = await runFalMultiImageFusion(input, character, falKey);
          const executionSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
          const variant: GeneratedVariant = {
            id: 'variant-fal',
            provider: 'fal',
            providerTitle: 'FLUX Kontext Studio',
            modelUsed: res.modelUsed,
            imageUrl: res.hdImageUrl || res.imageUrl,
            executionSeconds: parseFloat(((Date.now() - candidateStart) / 1000).toFixed(2))
          };
          onProgress?.(100, '¡Retrato revelado con éxito!', 'finishing');
          return {
            outputImageUrl: res.imageUrl,
            hdOutputImageUrl: res.hdImageUrl || res.imageUrl,
            executionSeconds,
            providerUsed: 'fal',
            modelUsed: res.modelUsed,
            variants: [variant]
          };
        } catch (err: any) {
          lastErrMessage = err?.message || 'Error en FLUX Kontext Studio';
          console.warn('[Failover from fal.ai]:', lastErrMessage);
        }
      }
    }

    throw new Error(lastErrMessage || 'No se pudo generar el retrato con los motores configurados.');
  }

  // Fallback Demo Mode when no API keys are configured
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  onProgress?.(
    30,
    `Analizando facciones de ${secondPetImageUrl ? 'las 2 mascotas' : 'la mascota'}...`,
    'analyzing'
  );
  await sleep(800);

  onProgress?.(
    65,
    `Generando retrato en ${provider === 'gemini' ? 'Google Gemini Studio' : 'OpenAI Studio'}...`,
    'inpainting'
  );
  await sleep(1000);

  onProgress?.(100, '¡Retrato listo!', 'finishing');

  const executionSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
  const sample1 = getSampleFallbackUrl(1);

  const demoVariants: GeneratedVariant[] = [
    {
      id: `variant-${provider}`,
      provider,
      providerTitle: provider === 'gemini' ? 'Google Gemini Studio' : 'OpenAI Studio (Optimizado)',
      modelUsed: provider === 'gemini' ? 'Google gemini-2.5-flash-image (Demo)' : 'OpenAI gpt-image-1.5 Medium (Demo)',
      imageUrl: sample1,
      executionSeconds
    }
  ];

  return {
    outputImageUrl: sample1,
    hdOutputImageUrl: sample1,
    executionSeconds,
    providerUsed: provider,
    modelUsed: demoVariants[0].modelUsed,
    variants: demoVariants,
    isSimulation: true
  };
}
