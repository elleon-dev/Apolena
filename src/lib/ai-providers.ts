import * as fal from "@fal-ai/serverless-client";
import fs from "fs";
import path from "path";
import {
  FamousCharacter,
  getCharacterById,
  FAMOUS_CHARACTERS,
} from "@/data/characters";
import { AIProviderId, ApiKeysOverride, GeneratedVariant } from "./types";
import {
  evaluatePortraitQuality,
  getLearnedCharacterPromptHints,
  QualityBreakdown,
} from "./ai-quality-judge";

export interface PipelineProgressCallback {
  (progress: number, stepLabel: string, stage: string): void;
}

export interface MultiModelFusionInput {
  petImageUrl: string;
  extraPetImageUrls?: string[];
  secondPetImageUrl?: string | null;
  characterInput: FamousCharacter | string;
  customThemeImageUrl?: string | null;
  customPrompt?: string | null;
  provider: AIProviderId;
  apiKeys?: ApiKeysOverride;
  onProgress?: PipelineProgressCallback;
  species?: "dog" | "cat" | "both" | "other";
}

export interface MultiModelFusionOutput {
  outputImageUrl: string;
  hdOutputImageUrl: string;
  executionSeconds: number;
  providerUsed: AIProviderId;
  modelUsed: string;
  variants: GeneratedVariant[];
  isSimulation?: boolean;
  simulationReason?: string;
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
  if (source.startsWith("data:")) {
    const commaIdx = source.indexOf(",");
    const header = source.substring(0, commaIdx);
    const base64 = source.substring(commaIdx + 1);
    const mimeMatch = header.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const ext = mimeType.includes("png")
      ? "png"
      : mimeType.includes("webp")
        ? "webp"
        : "jpg";
    return {
      buffer: Buffer.from(base64, "base64"),
      mimeType,
      base64,
      ext,
    };
  }

  if (source.startsWith("http://") || source.startsWith("https://")) {
    if (!source.includes("localhost") && !source.includes("127.0.0.1")) {
      const res = await fetch(source);
      if (!res.ok)
        throw new Error(`No se pudo descargar la imagen remota: ${source}`);
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const mimeType = res.headers.get("content-type") || "image/jpeg";
      const ext = mimeType.includes("png")
        ? "png"
        : mimeType.includes("webp")
          ? "webp"
          : "jpg";
      return {
        buffer,
        mimeType,
        base64: buffer.toString("base64"),
        ext,
      };
    }
  }

  // Local public directory file
  const cleanPath = source.replace(/^https?:\/\/[^\/]+/, "");
  const localFile = path.join(process.cwd(), "public", cleanPath);
  if (fs.existsSync(localFile)) {
    const buffer = fs.readFileSync(localFile);
    const extName = path.extname(localFile).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };
    const mimeType = mimeMap[extName] || "image/jpeg";
    return {
      buffer,
      mimeType,
      base64: buffer.toString("base64"),
      ext: extName.replace(".", "") || "jpg",
    };
  }

  throw new Error(`No se pudo resolver la imagen: ${source.substring(0, 60)}`);
}

/**
 * Sanitizes any character prompt so it is 100% species-neutral and never forces
 * a hardcoded animal (such as "an orange tabby cat", "a majestic cat", "tabby cat",
 * "feline", "dog", "canine") over the user's actual uploaded pet photo.
 */
export function sanitizeCharacterPromptToSpeciesNeutral(
  rawPrompt: string,
  hasSecondPet: boolean = false,
): string {
  const replacementSubject = hasSecondPet
    ? "the uploaded pets from the reference photos"
    : "the uploaded pet from the reference photo";

  let cleaned = rawPrompt || "";

  // Replace specific multi-word animal subject phrases first
  cleaned = cleaned.replace(
    /\b(?:a|an|the)\s+(?:majestic\s+|regal\s+|noble\s+|cute\s+|adorable\s+|photorealistic\s+)*(?:portrait\s+of\s+(?:a|an|the)\s+)?(?:orange\s+tabby\s+|black\s+and\s+white\s+|tuxedo\s+|siamese\s+|persian\s+|tabby\s+|ginger\s+|golden\s+retriever\s+|french\s+bulldog\s+|pug\s+)*(?:cat|cats|kitten|kittens|feline|felines|dog|dogs|puppy|puppies|canine|canines)\b/gi,
    `a majestic portrait of ${replacementSubject}`,
  );

  // Replace remaining standalone species terms (English & Spanish) that might bias generation
  cleaned = cleaned.replace(
    /\b(?:orange\s+tabby\s+cat|tabby\s+cat|tuxedo\s+cat|siamese\s+cat|feline|cat|kitten|gato|gata|gatito|felino|perro|perra|perrito|canino)\b/gi,
    replacementSubject,
  );

  // Clean up accidental duplicate "of a majestic portrait of"
  cleaned = cleaned.replace(
    /portrait\s+of\s+a\s+majestic\s+portrait\s+of/gi,
    "portrait of",
  );

  return cleaned;
}

/**
 * Extracts a concise, high-precision physical fingerprint of the user's uploaded pet(s)
 * so that every image generation engine prioritizes the user's exact pet as the #1 protagonist.
 */
async function extractPetIdentityFingerprint(
  pet1Data: ResolvedImageData,
  pet2Data: ResolvedImageData | null,
  openaiKey?: string,
  geminiKey?: string,
): Promise<string | null> {
  const promptText = `Inspect the uploaded pet photo(s) at high visual detail. Write a concise, forensic physical identity sheet (max 85 words) of ${pet2Data ? "Pet #1 (first image) and Pet #2 (second image)" : "the pet in the image"} so a master portrait painter reproduces this EXACT individual animal without changing a single marking.
Explicitly state:
1. Exact animal species (DOG, CAT, or other) and specific breed/mix.
2. Exact fur/coat base colors, EVERY distinctive facial marking (stripes, tabby M, white blaze, eye patches, cheek fur, muzzle spots, chin/chest fur), exact fur length/texture (short sleek, smooth, silky, curly, fluffy, wiry), and the matching coat color/texture expected on its neck, chest, and paws.
3. Exact eye color (precise iris hue), exact nose color/shape, exact muzzle/snout length & width, exact ear shape/size/posture (upright, half-folded, floppy), and natural gaze/expression.
Output ONLY the factual physical description, nothing else.`;

  if (openaiKey && !openaiKey.includes("your_")) {
    try {
      const content: any[] = [
        { type: "text", text: promptText },
        {
          type: "image_url",
          image_url: {
            url: `data:${pet1Data.mimeType};base64,${pet1Data.base64}`,
            detail: "high",
          },
        },
      ];
      if (pet2Data) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${pet2Data.mimeType};base64,${pet2Data.base64}`,
            detail: "high",
          },
        });
      }
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content }],
          max_tokens: 180,
          temperature: 0.1,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch (e) {
      console.warn("[extractPetIdentityFingerprint OpenAI warning]:", e);
    }
  }

  if (geminiKey && !geminiKey.includes("your_")) {
    try {
      const parts: any[] = [
        {
          inlineData: {
            mimeType: pet1Data.mimeType,
            data: pet1Data.base64,
          },
        },
      ];
      if (pet2Data) {
        parts.push({
          inlineData: {
            mimeType: pet2Data.mimeType,
            data: pet2Data.base64,
          },
        });
      }
      parts.push({ text: promptText });

      const candidateVisionModels = [
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
      ];
      for (const modelId of candidateVisionModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts }],
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const text = json?.candidates?.[0]?.content?.parts
              ?.map((p: any) => p.text || "")
              .join(" ")
              .trim();
            if (text) return text;
          }
        } catch {}
      }
    } catch (e) {
      console.warn("[extractPetIdentityFingerprint Gemini warning]:", e);
    }
  }

  return null;
}

/**
 * Builds the universal pet portrait fusion prompt where the user's uploaded pet
 * is ALWAYS the #1 protagonist and the selected character's reference image acts
 * strictly as a wardrobe, accessory, lighting, and background guide (no per-character prompt needed).
 */
function buildFusionPrompt(
  character: FamousCharacter,
  hasSecondPet: boolean,
  customPrompt?: string | null,
  extractedWardrobeDescription?: string | null,
  petIdentityFingerprint?: string | null,
  hasCustomReferenceImage: boolean = false,
  hasThemeRefImage: boolean = false,
): string {
  const petCountText = hasSecondPet
    ? "BOTH uploaded pets (Pet #1 from Image 1 and Pet #2 from Image 2) side by side"
    : "the exact uploaded pet shown in Image 1";

  const isCustomRef =
    hasCustomReferenceImage || character.id === "custom-reference";
  const hasVisualRef = isCustomRef || hasThemeRefImage;
  const refImageIndex = hasSecondPet ? 3 : 2;

  const safeCatalogDescription = sanitizeCharacterPromptToSpeciesNeutral(
    character.description || "",
    hasSecondPet,
  );

  const themeGuideText = isCustomRef
    ? extractedWardrobeDescription ||
      customPrompt?.trim() ||
      `Copy 100% of the exact clothing, headwear, accessories, lighting mood, and exact background architecture/scenery shown in Image ${refImageIndex} (the user's custom reference image).`
    : extractedWardrobeDescription ||
      `Theme: ${character.name} (${character.characterTitle || character.universe}). Wardrobe and atmosphere: ${safeCatalogDescription}`;

  const multiImageAssignment = hasVisualRef
    ? `INPUT IMAGES ROLE ASSIGNMENT (STRICT, NON-NEGOTIABLE SEPARATION):
- IMAGE 1${hasSecondPet ? " & IMAGE 2" : ""}: THE PROTAGONIST PET (WHOLE-BODY IDENTITY LOCK). Preserve 100% of this exact animal's species, breed, facial bone structure, muzzle/snout shape, exact fur colors, exact facial markings/spots/stripes, exact eye color, nose color, ear shape/posture, AND its exact coat texture and color across ALL visible body parts (head, neck, chest, shoulders, legs, and paws). NEVER blend or replace any part of this animal with the model from Image ${refImageIndex}.
- IMAGE ${refImageIndex}: THE EXACT COSTUME, HEADWEAR, LIGHTING & BACKGROUND BLUEPRINT ONLY. Replicate 100% of the exact outfit design, fabric textures, embroidery, jewelry, headwear style, color palette, studio lighting, and background scenery from Image ${refImageIndex}, and fit them organically onto the pet from Image 1. COMPLETELY DISCARD AND REPLACE 100% of the original animal in Image ${refImageIndex} — including its face, ears, neck, chest fur, legs, and paws. ZERO fur, paws, or body parts from Image ${refImageIndex}'s original animal may remain in the output.\n\n`
    : "";

  const protagonistSection = `${multiImageAssignment}PRIMARY PROTAGONIST (HIGHEST PRIORITY - THE USER'S PET MUST BE INSTANTLY RECOGNIZABLE):
Create an ultra-realistic 8K fine art portrait of ${petCountText}.${
    petIdentityFingerprint
      ? `\nFORENSIC PET IDENTITY TO LOCK 100% (DO NOT ALTER ANY COLOR, FUR LENGTH, OR MARKING): ${petIdentityFingerprint}`
      : ""
  }`;

  const themeGuideSection = hasVisualRef
    ? `
EXACT COSTUME, ACCESSORIES & BACKGROUND FIDELITY (FROM IMAGE ${refImageIndex}):
Dress the pet from Image 1 in the EXACT outfit, jewelry, headwear, lighting mood, and background environment shown in Image ${refImageIndex} ("${character.name}"):
${themeGuideText}
CRITICAL WHOLE-BODY TRANSFER RULE: Match Image ${refImageIndex}'s exact wardrobe colors, embroidery, props, and background scenery faithfully, while ensuring ZERO facial features, fur textures, fur lengths, paws, legs, or species traits from Image ${refImageIndex}'s original model leak onto the user's pet. Every visible paw, wrist, neck, or chest area MUST strictly match the coat length, texture, and color of Image 1's pet.`
    : `
THEMATIC WARDROBE & SCENE GUIDE (USE "${character.name}" AS COSTUME & ENVIRONMENT GUIDE AROUND THE USER'S PET):
Adapt the following thematic attire, accessories, lighting mood, and background setting onto the user's pet:
${themeGuideText}`;

  const identityRules = `
MANDATORY PET IDENTITY, WHOLE-BODY COAT CONSISTENCY & FULL-BLEED PORTRAIT RULES:
1. 100% FACIAL, COLOR & WHOLE-BODY FUR FIDELITY: The generated portrait MUST unmistakably be the EXACT individual pet from Image 1 across its ENTIRE visible body. Lock its exact species (DOG vs CAT vs OTHER), breed, facial proportions, muzzle/snout geometry, nose color, exact eye iris color, exact fur shades, asymmetric markings, and authentic expression. Any visible paws, legs, chest, or neck fur MUST have the exact same fur length, texture, and coat colors as the pet in Image 1 (never copy fluffy, shaggy, or mismatched paws/limbs from Image ${refImageIndex}).
2. FULL-BLEED EDGE-TO-EDGE ARTWORK ONLY (CRITICAL): Render a flat, full-bleed 2D portrait filling 100% of the image rectangle edge-to-edge. NEVER draw a picture frame, 3D canvas edge, wooden stretcher, white border, margin, mat, wall, or product mockup around the portrait.
3. COMPLETE UNCROPPED HEAD, EARS & 20% HEADROOM: NEVER crop or cut off the top of the pet's head, forehead, ears, crown/hat, or chin! Even if the uploaded pet photo is tightly cropped, reconstruct the COMPLETE head, both complete ears, and upper chest/torso in a balanced medium-wide chest-up portrait shot with 20% to 25% of open background space above the highest point of the head/ears/headwear and 15% breathing room on both sides.
4. UNOBSTRUCTED PET FACE & EARS: Any crown, hat, helmet, or headwear from Image ${refImageIndex} must sit lightly and naturally on top of the head so the pet's eyes, muzzle, forehead markings, and natural ears remain clearly visible and true to Image 1.
5. NATURAL ANATOMICAL PROPORTIONS & COMPLETE COSTUME FIT: Reproduce the FULL torso costume, uniform, collar, badges, jewelry, and props from Image ${refImageIndex} with realistic head-to-shoulder proportions and real fur micro-textures matching Image 1 naturally overlapping the collar, cuffs, and neckline. Never make the portrait look cartoon, 3D-rendered, or plastic.
6. PHOTOGRAPHY SPECS: Medium-wide half-body fine-art portrait (35mm full-frame camera, 50mm portrait lens), museum-grade lighting matching Image ${refImageIndex}, crisp eye catchlights. No watermarks, no text, no borders, no frames.`;

  const extraUserPrompt = customPrompt?.trim()
    ? `\nADDITIONAL STUDIO DIRECTION: ${customPrompt.trim()}`
    : "";

  return `${protagonistSection}\n${themeGuideSection}\n${identityRules}${extraUserPrompt}`;
}

function isVisionRefusal(text?: string | null): boolean {
  if (!text) return true;
  return /\b(i'm sorry|i am sorry|i can't|i cannot|cannot assist|unable to|as an ai)\b/i.test(
    text,
  );
}

/**
 * Extracts a 100% species-neutral wardrobe & background description from any character/theme reference image
 * so the character reference image serves strictly as a visual guide for clothing and background.
 */
async function extractWardrobeFromThemeImage(
  themeData: ResolvedImageData,
  characterName: string,
  characterDescription?: string,
  openaiKey?: string,
  geminiKey?: string,
  isCustomReference: boolean = false,
): Promise<string | null> {
  const promptText = isCustomReference
    ? `You are a costume, prop, and location designer for a portrait studio. Inspect this reference image and describe ONLY in English (90 to 120 words):
1. EXACT ATTIRE & GARMENTS: Every piece of clothing, robe, tunic, coat, suit, cloak, collar, fabric texture, exact colors, trim, and embroidery visible in the image.
2. EXACT HEADWEAR & ACCESSORIES: Describe the exact headwear (for example: white Arab ghutra headscarf with black agal cord, crown, helmet, hat, glasses, necklace, etc.) OR explicitly write "no headwear" if none is worn. Do NOT invent pirate hats or unrelated costumes.
3. EXACT BACKGROUND, LANDMARKS & LIGHTING: Describe the exact background environment, recognizable buildings/architecture (e.g., sail-shaped hotel, beach, ocean, city skyline, palace, landscape), sky, time of day, and lighting mood.
CRITICAL RULE: Do NOT identify any person and do NOT mention any animal species (never write "cat", "dog", "feline", "canine", "tabby", "fur", or "person"). Output ONLY the factual description of the wardrobe, headwear, and background scenery.`
    : `You are a costume and set design analyst. Inspect this reference image for "${characterName}"${characterDescription ? ` (${characterDescription})` : ""} and describe ONLY in English:
1. The exact clothing, tunic, coat, cape, fabrics, colors, and embroidery patterns.
2. The exact headwear, crown, diadem, hat, earrings, necklaces, or props.
3. The background environment, architecture, and lighting atmosphere.
CRITICAL RULE: Completely ignore whatever animal or person is wearing the costume. Do NOT mention any animal species (never write "cat", "dog", "feline", "canine", "tabby", "fur", or "person"). Describe ONLY the wardrobe, accessories, and background in 75 words or less.`;

  if (openaiKey && !openaiKey.includes("your_")) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${themeData.mimeType};base64,${themeData.base64}`,
                    detail: isCustomReference ? "high" : "low",
                  },
                },
              ],
            },
          ],
          max_tokens: 220,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content?.trim();
        const refusal = json?.choices?.[0]?.message?.refusal;
        if (text && !refusal && !isVisionRefusal(text)) {
          return sanitizeCharacterPromptToSpeciesNeutral(text, false);
        }
      }
    } catch (e) {
      console.warn("[extractWardrobeFromThemeImage OpenAI warning]:", e);
    }
  }

  if (geminiKey && !geminiKey.includes("your_")) {
    try {
      const candidateVisionModels = [
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
      ];
      for (const modelId of candidateVisionModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      inlineData: {
                        mimeType: themeData.mimeType,
                        data: themeData.base64,
                      },
                    },
                    { text: promptText },
                  ],
                },
              ],
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const text = json?.candidates?.[0]?.content?.parts
              ?.map((p: any) => p.text || "")
              .join(" ")
              .trim();
            if (text && !isVisionRefusal(text)) {
              return sanitizeCharacterPromptToSpeciesNeutral(text, false);
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn("[extractWardrobeFromThemeImage Gemini warning]:", e);
    }
  }

  return null;
}

/**
 * ============================================================================
 * 1. OPENAI PIPELINE: gpt-image-1.5 (Pet Image Edit) + GPT-4o Vision Fallback
 * ============================================================================
 */
interface PrecomputedFusionAssets {
  pet1Data: ResolvedImageData;
  extraPetImages?: ResolvedImageData[];
  pet2Data: ResolvedImageData | null;
  themeData: ResolvedImageData | null;
}

async function runOpenAIFusion(
  input: MultiModelFusionInput,
  character: FamousCharacter,
  openaiKey: string,
  preferredModels: string[] = [
    "gpt-image-1.5",
    "chatgpt-image-latest",
    "gpt-image-2",
  ],
  precomputedPetFingerprint?: string | null,
  precomputedWardrobeDesc?: string | null,
  precomputedAssets?: PrecomputedFusionAssets,
): Promise<{ imageUrl: string; modelUsed: string }> {
  const {
    petImageUrl,
    secondPetImageUrl,
    customThemeImageUrl,
    customPrompt,
    onProgress,
  } = input;
  const themeSource =
    customThemeImageUrl ||
    character.characterImageUrl ||
    character.fusionSampleUrl;
  const hasSecondPet = Boolean(secondPetImageUrl);
  const isCustomRef =
    Boolean(customThemeImageUrl) || character.id === "custom-reference";

  onProgress?.(
    20,
    "Preparando boceto inicial y paleta de iluminación...",
    "analyzing",
  );

  const pet1Data =
    precomputedAssets?.pet1Data ?? (await resolveImageData(petImageUrl));
  const pet2Data =
    precomputedAssets !== undefined
      ? precomputedAssets.pet2Data
      : secondPetImageUrl
        ? await resolveImageData(secondPetImageUrl)
        : null;
  const themeData =
    precomputedAssets !== undefined
      ? precomputedAssets.themeData
      : themeSource
        ? await resolveImageData(themeSource).catch(() => null)
        : null;

  const petIdentityFingerprint =
    precomputedPetFingerprint ??
    (await extractPetIdentityFingerprint(pet1Data, pet2Data, openaiKey));

  const hasDetailedCatalogDesc =
    !isCustomRef && (character.description?.trim().length ?? 0) >= 40;

  let wardrobeDesc = precomputedWardrobeDesc ?? null;
  if (!wardrobeDesc && themeData && !hasDetailedCatalogDesc) {
    try {
      wardrobeDesc = await extractWardrobeFromThemeImage(
        themeData,
        character.name,
        character.description,
        openaiKey,
        undefined,
        isCustomRef,
      );
    } catch (e) {
      console.warn("[OpenAI theme wardrobe extraction fallback]:", e);
    }
  }

  const extraPetImages =
    precomputedAssets?.extraPetImages !== undefined
      ? precomputedAssets.extraPetImages
      : !hasSecondPet && Array.isArray(input.extraPetImageUrls)
        ? (
            await Promise.all(
              input.extraPetImageUrls
                .slice(0, 2)
                .map((u) => resolveImageData(u).catch(() => null)),
            )
          ).filter((img): img is ResolvedImageData => Boolean(img))
        : [];
  const multiAnglePromptNote =
    !hasSecondPet && extraPetImages.length > 0
      ? `\n\nMULTI-ANGLE REFERENCE NOTE (CRITICAL): The first ${1 + extraPetImages.length} attached pet images all show DIFFERENT ANGLES of the EXACT SAME SINGLE PET (NOT multiple animals). Synthesize all ${1 + extraPetImages.length} angles for 100% accurate facial geometry, snout, eye color, ear shape, and fur markings, and paint STRICTLY ONE single animal in the portrait.`
      : "";

  const fusionPrompt =
    buildFusionPrompt(
      character,
      hasSecondPet,
      customPrompt,
      wardrobeDesc,
      petIdentityFingerprint,
      isCustomRef,
      Boolean(themeData),
    ) + multiAnglePromptNote;

  // Attempt 1: Native Multi-Image Fusion (/v1/images/edits) with High Input Fidelity
  const editModels = preferredModels;

  const buildEditFormData = (editModel: string, withHighFidelity: boolean) => {
    const formData = new FormData();
    formData.append("model", editModel);
    formData.append("prompt", fusionPrompt);
    formData.append("size", hasSecondPet ? "1536x1024" : "1024x1536");
    // Cost-optimized quality tier: 'medium' reduces cost by ~75% ($0.034 vs $0.133) while preserving photorealism
    formData.append("quality", "medium");
    if (withHighFidelity) {
      // High input fidelity locks the pet's exact facial geometry, fur colors, markings, and eye color
      formData.append("input_fidelity", "high");
    }

    // Append Pet 1 (and optional extra angles of Pet 1, or Pet 2) first for #1 identity lock,
    // followed by the character/theme reference image so the model faithfully reproduces the exact outfit & scene.
    formData.append(
      "image[]",
      new Blob([new Uint8Array(pet1Data.buffer)], {
        type: pet1Data.mimeType,
      }),
      `pet1.${pet1Data.ext}`,
    );
    if (!pet2Data && extraPetImages.length > 0) {
      extraPetImages.forEach((extraImg, idx) => {
        formData.append(
          "image[]",
          new Blob([new Uint8Array(extraImg.buffer)], {
            type: extraImg.mimeType,
          }),
          `pet1_angle${idx + 2}.${extraImg.ext}`,
        );
      });
    }
    if (pet2Data) {
      formData.append(
        "image[]",
        new Blob([new Uint8Array(pet2Data.buffer)], {
          type: pet2Data.mimeType,
        }),
        `pet2.${pet2Data.ext}`,
      );
    }
    if (themeData) {
      formData.append(
        "image[]",
        new Blob([new Uint8Array(themeData.buffer)], {
          type: themeData.mimeType,
        }),
        `character_reference.${themeData.ext}`,
      );
    }
    return formData;
  };

  for (const editModel of editModels) {
    try {
      onProgress?.(
        45,
        `Pintando textura y composición del retrato en estilo ${character.name}...`,
        "inpainting",
      );

      let editRes = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
        body: buildEditFormData(editModel, true),
      });

      // If a specific model rejects `input_fidelity`, retry immediately without it
      if (!editRes.ok && editRes.status === 400) {
        const firstErr = await editRes.text();
        if (firstErr.includes("input_fidelity")) {
          console.warn(
            `[OpenAI ${editModel}] input_fidelity not supported, retrying without it.`,
          );
          editRes = await fetch("https://api.openai.com/v1/images/edits", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${openaiKey}`,
            },
            body: buildEditFormData(editModel, false),
          });
        } else {
          console.warn(`[OpenAI ${editModel} fallback notice]:`, firstErr);
          continue;
        }
      }

      if (editRes.ok) {
        const editJson = await editRes.json();
        const b64 = editJson?.data?.[0]?.b64_json;
        const url = editJson?.data?.[0]?.url;
        if (b64) {
          onProgress?.(
            95,
            "Retrato revelado con técnica de óleo fino",
            "finishing",
          );
          return {
            imageUrl: `data:image/png;base64,${b64}`,
            modelUsed: "Técnica Óleo Bellas Artes",
          };
        }
        if (url) {
          onProgress?.(
            95,
            "Retrato revelado con técnica de óleo fino",
            "finishing",
          );
          return {
            imageUrl: url,
            modelUsed: "Técnica Óleo Bellas Artes",
          };
        }
      } else {
        const errBody = await editRes.text();
        console.warn(`[OpenAI ${editModel} fallback notice]:`, errBody);
        if (editRes.status === 401) {
          throw new Error(
            "La clave OPENAI_API_KEY no es válida (Error 401). Verifica tu API Key.",
          );
        }
        if (
          errBody.includes("insufficient_quota") ||
          errBody.includes("billing_hard_limit_reached")
        ) {
          throw new Error(
            "Tu cuenta de OpenAI no tiene saldo disponible (insufficient_quota).",
          );
        }
      }
    } catch (err: any) {
      if (
        err.message?.includes("OPENAI_API_KEY") ||
        err.message?.includes("insufficient_quota")
      ) {
        throw err;
      }
      console.warn(`[OpenAI ${editModel} exception]:`, err);
    }
  }

  // Attempt 2: Cost-optimized Multimodal GPT-4o-mini Vision Analysis of Pet(s) + OpenAI Image Generation
  onProgress?.(
    60,
    "Armonizando facciones naturales y vestimenta de época...",
    "analyzing",
  );

  const wardrobeSpec =
    wardrobeDesc ||
    `${character.name} (${character.characterTitle || character.universe}): ${character.description}`;

  const visionContent: any[] = [
    {
      type: "text",
      text: `You are an expert visual director for photorealistic pet portrait fusion.
Inspect the attached pet photo(s) carefully:
- Image 1 is Pet #1.${pet2Data ? "\n- Image 2 is Pet #2." : ""}

Write a single, detailed English image generation prompt (max 140 words) for a photorealistic 8K fine art portrait showing ${hasSecondPet ? "both uploaded pets side by side" : "this exact uploaded pet"} dressed in the following royal/character attire and setting:
"${wardrobeSpec}"

You MUST explicitly describe:
1. Pet #1's exact animal species (DOG vs CAT), exact breed, snout/muzzle shape, ear shape and position, fur colors, coat texture/markings, eye color, nose color, and facial expression.${pet2Data ? "\n2. Pet #2's exact animal species (DOG vs CAT), exact breed, snout/muzzle shape, ear shape, fur colors, markings, eye color, nose color, and expression." : ""}
3. Every detail of the royal/character garments, crowns/headpieces, necklaces, fabric patterns, and background scenery from the wardrobe specification above, naturally fitted onto ${hasSecondPet ? "these exact pets" : "this exact pet"} without covering or obscuring their ears or faces.
4. FRAMING & HEADROOM (MANDATORY): Medium-wide chest-up portrait shot with at least 20% to 25% of open background headroom above the top of the head/ears/crown and generous space on the sides so the COMPLETE head, forehead, ears, and upper torso are 100% visible inside the frame without any cropping.
${customPrompt ? `5. Also incorporate: ${customPrompt}` : ""}
Output ONLY the raw prompt text, nothing else.`,
    },
    {
      type: "image_url",
      image_url: {
        url: `data:${pet1Data.mimeType};base64,${pet1Data.base64}`,
        detail: "low",
      },
    },
  ];

  if (pet2Data) {
    visionContent.push({
      type: "image_url",
      image_url: {
        url: `data:${pet2Data.mimeType};base64,${pet2Data.base64}`,
        detail: "low",
      },
    });
  }

  let detailedPrompt = fusionPrompt;
  const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: visionContent }],
      max_tokens: 300,
    }),
  });

  if (visionRes.ok) {
    const visionJson = await visionRes.json();
    const synthesized = visionJson?.choices?.[0]?.message?.content?.trim();
    if (synthesized) {
      detailedPrompt = synthesized;
    }
  }

  onProgress?.(
    80,
    "Aplicando técnica de óleo y barniz de estudio...",
    "inpainting",
  );

  const genRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1.5",
      prompt: detailedPrompt,
      n: 1,
      size: hasSecondPet ? "1536x1024" : "1024x1536",
      quality: "medium",
    }),
  });

  if (!genRes.ok) {
    const errText = await genRes.text();
    throw new Error(`Error en atelier artístico: ${errText}`);
  }

  const genJson = await genRes.json();
  const b64 = genJson?.data?.[0]?.b64_json;
  const genUrl = genJson?.data?.[0]?.url;
  if (b64) {
    return {
      imageUrl: `data:image/png;base64,${b64}`,
      modelUsed: "Técnica Óleo Bellas Artes",
    };
  }
  if (genUrl) {
    return {
      imageUrl: genUrl,
      modelUsed: "Técnica Óleo Bellas Artes",
    };
  }
  throw new Error("OpenAI no devolvió una imagen válida.");
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
  openaiKeyFallback?: string,
  precomputedPetFingerprint?: string | null,
  precomputedWardrobeDesc?: string | null,
  precomputedAssets?: PrecomputedFusionAssets,
): Promise<{ imageUrl: string; modelUsed: string }> {
  const {
    petImageUrl,
    secondPetImageUrl,
    customThemeImageUrl,
    customPrompt,
    onProgress,
  } = input;
  const themeSource =
    customThemeImageUrl ||
    character.characterImageUrl ||
    character.fusionSampleUrl;
  const hasSecondPet = Boolean(secondPetImageUrl);
  const isCustomRef =
    Boolean(customThemeImageUrl) || character.id === "custom-reference";

  onProgress?.(
    20,
    "Elaborando propuesta con matices de claroscuro y detalle...",
    "analyzing",
  );

  const pet1Data =
    precomputedAssets?.pet1Data ?? (await resolveImageData(petImageUrl));
  const pet2Data =
    precomputedAssets !== undefined
      ? precomputedAssets.pet2Data
      : secondPetImageUrl
        ? await resolveImageData(secondPetImageUrl)
        : null;
  const themeData =
    precomputedAssets !== undefined
      ? precomputedAssets.themeData
      : themeSource
        ? await resolveImageData(themeSource).catch(() => null)
        : null;

  const petIdentityFingerprint =
    precomputedPetFingerprint ??
    (await extractPetIdentityFingerprint(
      pet1Data,
      pet2Data,
      openaiKeyFallback,
      geminiKey,
    ));

  // Para Gemini multi-imagen (priorizando gemini-3.1-flash-image-preview),
  // enviamos primero la imagen base del personaje (escena, luz, vestuario y encuadre exactos)
  // y luego la foto de la mascota del cliente con instrucción explícita de reemplazo de sujeto
  // manteniendo proporciones anatómicas naturales y el brillo original del personaje.
  let wardrobeDesc = precomputedWardrobeDesc ?? null;
  if (!wardrobeDesc && themeData && !isCustomRef && (character.description?.trim().length ?? 0) < 40) {
    try {
      wardrobeDesc = await extractWardrobeFromThemeImage(
        themeData,
        character.name,
        character.description,
        openaiKeyFallback,
        geminiKey,
        isCustomRef,
      );
    } catch (e) {
      console.warn("[Gemini theme wardrobe extraction fallback]:", e);
    }
  }

  const fusionPrompt = buildFusionPrompt(
    character,
    hasSecondPet,
    customPrompt,
    wardrobeDesc,
    petIdentityFingerprint,
    isCustomRef,
    Boolean(themeData),
  );

  const petParts: any[] = [
    {
      inlineData: {
        mimeType: pet1Data.mimeType,
        data: pet1Data.base64,
      },
    },
  ];

  if (pet2Data) {
    petParts.push({
      inlineData: {
        mimeType: pet2Data.mimeType,
        data: pet2Data.base64,
      },
    });
  }

  const extraPetImages =
    precomputedAssets?.extraPetImages !== undefined
      ? precomputedAssets.extraPetImages
      : !hasSecondPet && Array.isArray(input.extraPetImageUrls)
        ? (
            await Promise.all(
              input.extraPetImageUrls
                .slice(0, 2)
                .map((u) => resolveImageData(u).catch(() => null)),
            )
          ).filter((img): img is ResolvedImageData => Boolean(img))
        : [];

  const parts: any[] = [
    ...(themeData
      ? [
          {
            text: "IMAGE 1 — BASE CHARACTER TEMPLATE TO EDIT (KEEP THIS EXACT COSTUME, ACCESSORIES, POSE, BACKGROUND SCENE, BRIGHTNESS, AND VIBRANT LIGHTING — REPLACE ONLY THE ANIMAL):",
          },
          {
            inlineData: {
              mimeType: themeData.mimeType,
              data: themeData.base64,
            },
          },
        ]
      : []),
    {
      text: hasSecondPet
        ? "IMAGE 2 — CUSTOMER PET 1 (REPLACE THE ANIMAL IN IMAGE 1 WITH THIS EXACT PET AND PET 2 BELOW — COPY 100% OF THIS PET'S REAL FACE, EYES, FUR COLOR/PATTERN, NOSE, AND EARS):"
        : "IMAGE 2 — CUSTOMER PET PHOTO (PRIMARY ANGLE — COMPLETELY REPLACE THE ANIMAL IN IMAGE 1 WITH THIS EXACT PET — COPY 100% OF THIS PET'S REAL SPECIES, FACE, EYES, FUR COLOR/PATTERN, NOSE, EARS, AND PAWS):",
    },
    {
      inlineData: {
        mimeType: pet1Data.mimeType,
        data: pet1Data.base64,
      },
    },
    ...(!hasSecondPet && extraPetImages.length > 0
      ? extraPetImages.flatMap((extraImg, idx) => [
          {
            text: `ADDITIONAL REFERENCE ANGLE #${idx + 2} OF THE EXACT SAME SINGLE PET FROM IMAGE 2 (CRITICAL: THIS IS THE SAME PET — DO NOT DRAW A SECOND ANIMAL; USE ONLY TO MAKE THE FACE, EYES, EARS, AND FUR MARKINGS EVEN MORE ACCURATE):`,
          },
          {
            inlineData: {
              mimeType: extraImg.mimeType,
              data: extraImg.base64,
            },
          },
        ])
      : []),
    ...(pet2Data
      ? [
          {
            text: "IMAGE 3 — CUSTOMER PET 2 (ALSO PLACE THIS EXACT SECOND PET SIDE-BY-SIDE IN THE PORTRAIT, PRESERVING 100% OF ITS REAL FACE, FUR, AND IDENTITY):",
          },
          {
            inlineData: {
              mimeType: pet2Data.mimeType,
              data: pet2Data.base64,
            },
          },
        ]
      : []),
    {
      text: `${fusionPrompt}\n\nSTRICT EDITING & FIDELITY RULES:\n1. Edit IMAGE 1 by COMPLETELY REPLACING its animal with the EXACT customer pet${hasSecondPet ? "s" : ""} from IMAGE 2${hasSecondPet ? " and IMAGE 3" : extraPetImages.length > 0 ? " (using the additional reference angle photos of that SAME single pet — paint STRICTLY ONE animal)" : ""}. Zero trace of the original sample animal's face or fur may remain.\n2. Keep IMAGE 1's exact costume, jewelry/accessories, background, camera framing, brightness, and vibrant natural lighting — DO NOT darken the scene or add gloomy shadows.\n3. Keep 100% realistic, natural head-to-shoulders anatomical proportions (NEVER an oversized bobblehead or pasted-head look) with 20-25% headroom above the ears/hat.\n4. Output a ${hasSecondPet ? "HORIZONTAL 3:2" : "VERTICAL 2:3"} full-bleed painting with NO picture frame, NO border, and NO watermark.`,
    },
  ];

  // Priorizar gemini-3.1-flash-image-preview (mejor edición multi-imagen) con fallback a gemini-2.5-flash-image
  const candidateModels = [
    "gemini-3.1-flash-image-preview",
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
  ];

  let lastError = "";

  for (const modelId of candidateModels) {
    onProgress?.(
      45,
      "Componiendo contrastes de luz y atmósfera escénica...",
      "inpainting",
    );

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: hasSecondPet ? "3:2" : "2:3",
          },
        },
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const responseParts = json?.candidates?.[0]?.content?.parts || [];
      const imgPart = responseParts.find(
        (p: any) => p.inlineData && p.inlineData.data,
      );
      if (imgPart) {
        const mime = imgPart.inlineData.mimeType || "image/png";
        return {
          imageUrl: `data:${mime};base64,${imgPart.inlineData.data}`,
          modelUsed: "Técnica Claroscuro de Estudio",
        };
      }
    } else {
      lastError = await res.text();
      if (res.status === 400 && lastError.includes("API_KEY_INVALID")) {
        throw new Error(
          "La clave GEMINI_API_KEY no es válida. Verifica tu API Key en Google AI Studio.",
        );
      }
    }
  }

  // Fallback for Free-Tier Gemini Keys (where direct image output has limit: 0):
  // Use `gemini-2.5-flash` Vision (free-tier eligible) on the uploaded pet photo(s) + OpenAI medium edit
  onProgress?.(
    60,
    "Calibrando proporciones fisonómicas y microtextura de pelaje...",
    "analyzing",
  );

  const wardrobeSpec =
    wardrobeDesc ||
    `${character.name} (${character.characterTitle || character.universe}): ${character.description}`;

  const visionPrompt = `You are a master pet portrait director. Inspect the attached pet photo(s) carefully.
Write a concise English photographic direction note (max 95 words) specifying:
1. The exact animal species (explicitly state whether it is a DOG or a CAT), exact breed, snout/muzzle structure, ear shape, coat coloration, fur texture, eye color, nose color, and natural head-to-body anatomical proportions of the pet in Image 1${pet2Data ? " and Image 2" : ""}.
2. How this exact ${hasSecondPet ? "pair of pets is" : "pet is"} dressed in the FULL wardrobe, uniform, accessories, and scene with dramatic chiaroscuro lighting and natural fur overlapping the collar: "${wardrobeSpec}".
3. Crucial framing rule: Full-bleed edge-to-edge 2D portrait (NO frames, NO borders, NO 3D canvas edges, NO walls) in a medium-wide chest-up shot with 25% open painted background headroom above the head/ears/hat so the entire head and ears are uncropped.
Output ONLY the direction note, nothing else.`;

  const visionParts = [...petParts, { text: visionPrompt }];

  let geminiDirectionNote = customPrompt || "";
  try {
    const candidateVisionModels = [
      "gemini-flash-lite-latest",
      "gemini-flash-latest",
    ];
    for (const modelId of candidateVisionModels) {
      try {
        const visionUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const visionRes = await fetch(visionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: visionParts }],
          }),
        });

        if (visionRes.ok) {
          const visionJson = await visionRes.json();
          const textOut = visionJson?.candidates?.[0]?.content?.parts
            ?.map((p: any) => p.text || "")
            .join(" ")
            .trim();
          if (textOut) {
            geminiDirectionNote = customPrompt
              ? `${customPrompt}\n${textOut}`
              : textOut;
            break;
          }
        }
      } catch {}
    }
  } catch (e) {
    console.warn("[Gemini Flash vision fallback warning]:", e);
  }

  if (openaiKeyFallback && !openaiKeyFallback.includes("your_")) {
    onProgress?.(
      78,
      "Revelando propuesta de claroscuro con máxima nitidez...",
      "inpainting",
    );
    const openAiResult = await runOpenAIFusion(
      {
        ...input,
        customPrompt: `${geminiDirectionNote}\nCompose a dramatic chiaroscuro medium-wide chest-up 50mm studio portrait angle with at least 20-25% open headroom above the pet's head and ears, rich depth of field, warm golden rim lighting, and deep atmospheric shadows while strictly preserving the uploaded pet's exact species, breed, snout, complete uncropped head, complete ears, and natural proportions.`,
      },
      character,
      openaiKeyFallback,
      ["gpt-image-1.5", "chatgpt-image-latest"],
      petIdentityFingerprint,
      wardrobeDesc,
      { pet1Data, pet2Data, themeData },
    );
    return {
      imageUrl: openAiResult.imageUrl,
      modelUsed: "Técnica Claroscuro de Estudio",
    };
  }

  throw new Error(
    `Tu clave de Google Gemini está en nivel gratuito sin cuota de generación directa de imágenes (Error 429).`,
  );
}

/**
 * ============================================================================
 * 3. FAL.AI PIPELINE: FLUX.1 Kontext Pro ($0.04) / Multi-Image ($0.08)
 * ============================================================================
 */
async function uploadToFalStorage(
  imageData: ResolvedImageData,
): Promise<string> {
  const blob = new Blob([new Uint8Array(imageData.buffer)], {
    type: imageData.mimeType,
  });
  return await fal.storage.upload(blob);
}

async function runFalMultiImageFusion(
  input: MultiModelFusionInput,
  character: FamousCharacter,
  falKey: string,
): Promise<{ imageUrl: string; hdImageUrl: string; modelUsed: string }> {
  const { petImageUrl, secondPetImageUrl, customPrompt, onProgress } = input;
  const hasSecondPet = Boolean(secondPetImageUrl);

  fal.config({ credentials: falKey });

  onProgress?.(20, "Subiendo fotos de mascotas a fal.ai CDN...", "analyzing");

  const pet1Data = await resolveImageData(petImageUrl);
  const pet2Data = secondPetImageUrl
    ? await resolveImageData(secondPetImageUrl)
    : null;

  const [pet1Cdn, pet2Cdn] = await Promise.all([
    uploadToFalStorage(pet1Data),
    pet2Data ? uploadToFalStorage(pet2Data) : Promise.resolve(null),
  ]);

  const imageUrls = [pet1Cdn, ...(pet2Cdn ? [pet2Cdn] : [])];
  const fusionPrompt = buildFusionPrompt(character, hasSecondPet, customPrompt);

  let fusedUrl = "";
  let modelUsed = "FLUX.1 Kontext Pro";

  try {
    if (!hasSecondPet) {
      onProgress?.(
        50,
        "Fusionando retrato con FLUX.1 Kontext Pro...",
        "inpainting",
      );
      const singleResult: any = await fal.subscribe("fal-ai/flux-pro/kontext", {
        input: {
          prompt: fusionPrompt,
          image_url: pet1Cdn,
          guidance_scale: 3.5,
          output_format: "jpeg",
        },
        pollInterval: 1000,
        logs: true,
      });
      fusedUrl =
        singleResult?.images?.[0]?.url || singleResult?.image?.url || "";
    } else {
      modelUsed = "FLUX.1 Kontext Multi-Image";
      onProgress?.(
        50,
        `Fusionando ${imageUrls.length} mascotas con FLUX.1 Kontext Multi-Image...`,
        "inpainting",
      );

      const kontextResult: any = await fal.subscribe(
        "fal-ai/flux-pro/kontext/max/multi",
        {
          input: {
            prompt: fusionPrompt,
            image_urls: imageUrls,
            guidance_scale: 3.5,
            num_images: 1,
            output_format: "jpeg",
            aspect_ratio: "3:2",
          },
          pollInterval: 1000,
          logs: true,
        },
      );

      fusedUrl =
        kontextResult?.images?.[0]?.url || kontextResult?.image?.url || "";
    }
  } catch (multiErr: any) {
    const detail = multiErr?.body?.detail || multiErr?.message || "";
    if (detail.includes("Exhausted balance") || multiErr?.status === 403) {
      throw new Error(
        "Tu cuenta de fal.ai tiene saldo agotado (Exhausted balance). Cambia al modelo OpenAI o Google Gemini, o recarga saldo en fal.ai/dashboard/billing.",
      );
    }

    onProgress?.(
      55,
      "Ejecutando FLUX.1 Kontext Pro con la mascota principal...",
      "inpainting",
    );
    modelUsed = "FLUX.1 Kontext Pro";
    const singleResult: any = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        prompt: fusionPrompt,
        image_url: pet1Cdn,
        guidance_scale: 3.5,
        output_format: "jpeg",
      },
      pollInterval: 1000,
      logs: true,
    });
    fusedUrl = singleResult?.images?.[0]?.url || singleResult?.image?.url || "";
  }

  if (!fusedUrl) {
    throw new Error("No se recibió imagen de salida desde fal.ai.");
  }

  return {
    imageUrl: fusedUrl,
    hdImageUrl: fusedUrl,
    modelUsed,
  };
}

/**
 * ============================================================================
 * UNIFIED COST-OPTIMIZED ORCHESTRATOR (SINGLE ENGINE + AUTOMATIC FAILOVER)
 * ============================================================================
 */
function getLiveEnvVar(key: string): string {
  const fromProcess = (process.env[key] || "").trim();
  if (fromProcess && !fromProcess.includes("your_")) return fromProcess;
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match && match[1]) {
        const val = match[1].trim().replace(/^["']|["']$/g, "");
        if (val && !val.includes("your_")) {
          process.env[key] = val;
          return val;
        }
      }
    }
  } catch (e) {}
  return "";
}

export async function runMultiModelFusionPipeline(
  input: MultiModelFusionInput,
): Promise<MultiModelFusionOutput> {
  const startTime = Date.now();
  const {
    characterInput,
    provider,
    apiKeys,
    onProgress,
    petImageUrl,
    secondPetImageUrl,
    customThemeImageUrl,
  } = input;

  const character =
    typeof characterInput === "string"
      ? getCharacterById(characterInput) || FAMOUS_CHARACTERS[0]
      : characterInput;

  const openaiKey = (
    apiKeys?.openaiKey || getLiveEnvVar("OPENAI_API_KEY")
  ).trim();
  const geminiKey = (
    apiKeys?.geminiKey || getLiveEnvVar("GEMINI_API_KEY")
  ).trim();
  const falKey = (apiKeys?.falKey || getLiveEnvVar("FAL_KEY")).trim();

  const hasValidOpenAI = Boolean(openaiKey && !openaiKey.includes("your_"));
  const hasValidGemini = Boolean(geminiKey && !geminiKey.includes("your_"));
  const hasValidFal = Boolean(falKey && !falKey.includes("your_"));

  const species = input.species || "dog";
  const isCat = species === "cat";

  // Helper to resolve demo sample image when running in pure offline simulation
  const getSampleFallbackUrl = (variantIndex: 1 | 2) => {
    if (
      character.id !== "custom-reference" &&
      character.fusionSampleUrl &&
      character.fusionSampleUrl.startsWith("http")
    ) {
      return character.fusionSampleUrl;
    }

    const knownSamplePrefix = ["jack-sparrow", "joker", "godfather"].includes(
      character.id,
    )
      ? character.id
      : variantIndex === 1
        ? "jack-sparrow"
        : "joker";

    return isCat
      ? `/fusions/${knownSamplePrefix}-cat.jpg`
      : `/fusions/${knownSamplePrefix}-dog.jpg`;
  };

  // DUAL ARTISTIC PROPOSAL GENERATION (OpenAI & Gemini in parallel)
  // Generates 2 distinct options (1 by OpenAI and 1 by Gemini) without technical jargon
  if (hasValidOpenAI || hasValidGemini) {
    onProgress?.(
      18,
      "Analizando facciones de tu mascota y vestuario del personaje...",
      "analyzing",
    );

    let sharedPetFingerprint: string | null = null;
    let sharedWardrobeDesc: string | null = null;
    let learnedCharacterHints: string | null = null;
    let sharedAssets: PrecomputedFusionAssets | undefined = undefined;
    const themeSource =
    customThemeImageUrl ||
    character.characterImageUrl ||
    character.fusionSampleUrl;
    const isCustomRef =
      Boolean(customThemeImageUrl) || character.id === "custom-reference";
    const hasDetailedCatalogDesc =
      !isCustomRef && (character.description?.trim().length ?? 0) >= 40;

    try {
      const [pet1Data, pet2Data, themeData, extraPetRaw] = await Promise.all([
        resolveImageData(petImageUrl),
        secondPetImageUrl
          ? resolveImageData(secondPetImageUrl)
          : Promise.resolve(null),
        themeSource
          ? resolveImageData(themeSource).catch(() => null)
          : Promise.resolve(null),
        !secondPetImageUrl && Array.isArray(input.extraPetImageUrls)
          ? Promise.all(
              input.extraPetImageUrls
                .slice(0, 2)
                .map((u) => resolveImageData(u).catch(() => null)),
            )
          : Promise.resolve([]),
      ]);

      const extraPetImages = extraPetRaw.filter(
        (img): img is ResolvedImageData => Boolean(img),
      );
      sharedAssets = { pet1Data, extraPetImages, pet2Data, themeData };

      // Skip extra Vision API wardrobe extraction for catalog characters that already have a
      // detailed description AND visual themeData attached directly to the image editors.
      const shouldExtractWardrobe = Boolean(
        themeData && (isCustomRef || !hasDetailedCatalogDesc),
      );

      const [fpResult, wardrobeResult, learnedHintsResult] = await Promise.all([
        extractPetIdentityFingerprint(
          pet1Data,
          pet2Data,
          hasValidOpenAI ? openaiKey : undefined,
          hasValidGemini ? geminiKey : undefined,
        ),
        shouldExtractWardrobe && themeData
          ? extractWardrobeFromThemeImage(
              themeData,
              character.name,
              character.description,
              hasValidOpenAI ? openaiKey : undefined,
              hasValidGemini ? geminiKey : undefined,
              isCustomRef,
            )
          : Promise.resolve(null),
        getLearnedCharacterPromptHints(character.id).catch(() => null),
      ]);

      sharedPetFingerprint = fpResult;
      sharedWardrobeDesc = wardrobeResult;
      learnedCharacterHints = learnedHintsResult;
    } catch (fpErr) {
      console.warn("[Pet & wardrobe pre-analysis warning]:", fpErr);
    }

    onProgress?.(
      35,
      "Componiendo propuestas artísticas en el atelier...",
      "lighting",
    );

    const variants: GeneratedVariant[] = [];

    // Run both artistic proposals concurrently using OpenAI (`gpt-image-1.5` with `input_fidelity: "high"`)
    // so both proposals use the exact character blueprint + real customer pet face and preserve the
    // original brightness/colors of the character image (with automatic Gemini fallback if OpenAI fails).
    const proposal1Input: MultiModelFusionInput = {
      ...input,
      customPrompt: [
        input.customPrompt?.trim(),
        learnedCharacterHints,
        "ARTISTIC DIRECTION (PROPOSAL 1 - OIL FINE ART): Preserve the EXACT brightness, vibrant color palette, lighting, costume, and background scene of the character reference image — strictly do NOT darken the image or add heavy shadows. Render with rich classic museum oil-painting brushwork and natural lifelike fur depth.",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const proposal2Input: MultiModelFusionInput = {
      ...input,
      customPrompt: [
        input.customPrompt?.trim(),
        learnedCharacterHints,
        "ARTISTIC DIRECTION (PROPOSAL 2 - CRISP STUDIO DETAIL): Preserve the EXACT brightness, luminous ambient lighting, vibrant color palette, costume, and background scene of the character reference image — strictly NO dark/chiaroscuro mood and NO darkening of the background. Emphasize ultra-crisp fine detail in the eyes, whiskers, and fur texture with a clean, vibrant gallery finish and full-bleed edge-to-edge composition (strictly NO frames, NO canvas borders, NO walls).",
      ]
        .filter(Boolean)
        .join("\n"),
    };

    const runWithQualityGuard = async (
      baseInput: MultiModelFusionInput,
      generator: (
        attemptInput: MultiModelFusionInput,
      ) => Promise<{ imageUrl: string; modelUsed: string }>,
      label: string,
    ): Promise<{
      imageUrl: string;
      modelUsed: string;
      qualityScore?: number;
      qualityBreakdown?: QualityBreakdown;
      wasAutoRetried?: boolean;
    }> => {
      const first = await generator(baseInput);
      if (!hasValidGemini || !sharedAssets?.pet1Data) {
        return first;
      }

      const eval1 = await evaluatePortraitQuality({
        pet1Data: sharedAssets.pet1Data,
        themeData: sharedAssets.themeData,
        generatedDataUrl: first.imageUrl,
        geminiKey,
        characterName: character.name,
      });

      if (!eval1) {
        return first;
      }

      if (eval1.passed || !eval1.correctionNote) {
        return {
          ...first,
          qualityScore: eval1.score,
          qualityBreakdown: eval1.breakdown,
          wasAutoRetried: false,
        };
      }

      // Auto-reintento inteligente (máx. 1 vez) inyectando la corrección exacta del Juez de Calidad
      console.info(
        `[AI Quality Judge] ${label} scored ${eval1.score}/10 — auto-retrying with correction: ${eval1.correctionNote}`,
      );
      onProgress?.(
        78,
        "Perfeccionando fidelidad y detalles finales de tu retrato...",
        "upscaling",
      );

      try {
        const retryInput: MultiModelFusionInput = {
          ...baseInput,
          customPrompt: [
            baseInput.customPrompt?.trim(),
            `CRITICAL QUALITY CORRECTION FROM ART INSPECTOR (FIX THIS IMMEDIATELY): ${eval1.correctionNote}`,
          ]
            .filter(Boolean)
            .join("\n"),
        };

        const second = await generator(retryInput);
        const eval2 = await evaluatePortraitQuality({
          pet1Data: sharedAssets.pet1Data,
          themeData: sharedAssets.themeData,
          generatedDataUrl: second.imageUrl,
          geminiKey,
          characterName: character.name,
        });

        if (!eval2 || eval2.score >= eval1.score) {
          return {
            ...second,
            qualityScore: eval2?.score ?? eval1.score,
            qualityBreakdown: eval2?.breakdown ?? eval1.breakdown,
            wasAutoRetried: true,
          };
        }

        // Si el primer intento tuvo mejor nota que el reintento, conservar el mejor
        return {
          ...first,
          qualityScore: eval1.score,
          qualityBreakdown: eval1.breakdown,
          wasAutoRetried: true,
        };
      } catch (retryErr) {
        console.warn(`[AI Quality Judge] ${label} retry failed, keeping first attempt:`, retryErr);
        return {
          ...first,
          qualityScore: eval1.score,
          qualityBreakdown: eval1.breakdown,
          wasAutoRetried: false,
        };
      }
    };

    // Arquitectura 1 propuesta = 1 proveedor en paralelo:
    // Propuesta 1: OpenAI (gpt-image-1.5) | Propuesta 2: Google Gemini (gemini-3.1-flash-image-preview)
    const [openaiResult, geminiResult] = await Promise.allSettled([
      hasValidOpenAI
        ? runWithQualityGuard(
            proposal1Input,
            (attemptInput) =>
              runOpenAIFusion(
                attemptInput,
                character,
                openaiKey,
                undefined,
                sharedPetFingerprint,
                sharedWardrobeDesc,
                sharedAssets,
              ),
            "Propuesta 1 (OpenAI)",
          )
        : Promise.reject(new Error("OpenAI no configurado")),
      hasValidGemini
        ? runWithQualityGuard(
            proposal2Input,
            (attemptInput) =>
              runGeminiFusion(
                attemptInput,
                character,
                geminiKey,
                openaiKey,
                sharedPetFingerprint,
                sharedWardrobeDesc,
                sharedAssets,
              ),
            "Propuesta 2 (Gemini)",
          )
        : Promise.reject(new Error("Gemini no configurado")),
    ]);

    if (openaiResult.status === "fulfilled") {
      variants.push({
        id: "variant-1",
        provider: "openai",
        providerTitle: "Propuesta 1 · Óleo Fine Art",
        modelUsed: "Técnica Óleo Bellas Artes",
        imageUrl: openaiResult.value.imageUrl,
        executionSeconds: parseFloat(
          ((Date.now() - startTime) / 1000).toFixed(2),
        ),
        qualityScore: openaiResult.value.qualityScore,
        qualityBreakdown: openaiResult.value.qualityBreakdown,
        wasAutoRetried: openaiResult.value.wasAutoRetried,
      });
    } else {
      console.warn(
        "[OpenAI Proposal 1 Error]:",
        (openaiResult as PromiseRejectedResult).reason,
      );
    }

    if (geminiResult.status === "fulfilled") {
      variants.push({
        id: "variant-2",
        provider: "gemini",
        providerTitle: "Propuesta 2 · Detalle y Luminosidad",
        modelUsed: "Técnica Detalle de Estudio",
        imageUrl: geminiResult.value.imageUrl,
        executionSeconds: parseFloat(
          ((Date.now() - startTime) / 1000).toFixed(2),
        ),
        qualityScore: geminiResult.value.qualityScore,
        qualityBreakdown: geminiResult.value.qualityBreakdown,
        wasAutoRetried: geminiResult.value.wasAutoRetried,
      });
    } else {
      console.warn(
        "[Gemini Proposal 2 Error]:",
        (geminiResult as PromiseRejectedResult).reason,
      );
    }

    // Entregar exclusivamente las propuestas reales generadas por los modelos que respondieron
    // (sin duplicar propuestas si un modelo falló o agotó cuota).
    if (variants.length >= 1) {
      const count = variants.length;
      onProgress?.(
        100,
        count > 1
          ? `¡${count} propuestas artísticas listas!`
          : "¡Tu retrato artístico está listo!",
        "finishing",
      );
      const executionSeconds = parseFloat(
        ((Date.now() - startTime) / 1000).toFixed(2),
      );
      return {
        outputImageUrl: variants[0].imageUrl,
        hdOutputImageUrl: variants[0].imageUrl,
        executionSeconds,
        providerUsed: variants[0].provider,
        modelUsed:
          count > 1
            ? `Composición Multi-Modelo (${count} propuestas)`
            : variants[0].modelUsed,
        variants,
      };
    }
  }

  // Fallback Demo Mode when no API keys are configured or both fail
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  onProgress?.(
    30,
    `Analizando facciones de ${secondPetImageUrl ? "las 2 mascotas" : "la mascota"}...`,
    "analyzing",
  );
  await sleep(700);

  onProgress?.(
    65,
    "Elaborando 2 propuestas artísticas en el atelier...",
    "inpainting",
  );
  await sleep(900);

  onProgress?.(100, "¡2 propuestas listas!", "finishing");

  const executionSeconds = parseFloat(
    ((Date.now() - startTime) / 1000).toFixed(2),
  );
  const sample1 = getSampleFallbackUrl(1);
  const sample2 = getSampleFallbackUrl(2);

  const demoVariants: GeneratedVariant[] = [
    {
      id: "variant-1",
      provider: "openai",
      providerTitle: "Propuesta 1 · Óleo Fine Art",
      modelUsed: "Técnica Óleo Bellas Artes",
      imageUrl: sample1,
      executionSeconds,
    },
    {
      id: "variant-2",
      provider: "gemini",
      providerTitle: "Propuesta 2 · Detalle y Luminosidad",
      modelUsed: "Técnica Detalle de Estudio",
      imageUrl: sample2,
      executionSeconds,
    },
  ];

  return {
    outputImageUrl: sample1,
    hdOutputImageUrl: sample1,
    executionSeconds,
    providerUsed: "openai",
    modelUsed: "Muestra Ilustrativa de Atelier",
    variants: demoVariants,
    isSimulation: true,
    simulationReason:
      "Las claves de API alcanzaron el límite de cuota o saldo disponible (Error 429 Quota Exceeded). Se desplegó una muestra ilustrativa.",
  };
}
