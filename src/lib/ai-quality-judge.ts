import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export interface QualityBreakdown {
  petFidelity: number;
  proportions: number;
  characterMatch: number;
  framing: number;
}

export interface PortraitQualityEvaluation {
  score: number;
  passed: boolean;
  breakdown: QualityBreakdown;
  correctionNote: string | null;
}

interface JudgeImageInput {
  mimeType: string;
  base64: string;
}

const FEEDBACK_HINT_MAP: Record<string, string> = {
  no_match_pet:
    "CRITICAL LEARNED RULE: Strictly preserve the customer pet's exact species, snout shape, eye color, ear shape, and fur color/markings from the uploaded photo.",
  bad_proportions:
    "CRITICAL LEARNED RULE: Keep 100% realistic, natural head-to-shoulders anatomical proportions — NEVER generate an oversized bobblehead or shrunk body.",
  too_dark:
    "CRITICAL LEARNED RULE: Preserve the exact bright, vibrant daylight/ambient lighting and colors of the character template — NEVER darken the scene or add gloomy shadows.",
  cropped_ears:
    "CRITICAL LEARNED RULE: Leave 20-25% open painted background headroom above the pet's ears/crown so the head and ears are NEVER cropped.",
};

// In-memory cache (10 min TTL) for learned per-character hints so we don't hit DB on every generation
const learnedHintsCache = new Map<
  string,
  { hint: string | null; expiresAt: number }
>();

function parseDataUrl(dataUrl: string): JudgeImageInput | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function clampScore(value: unknown, fallback = 8): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(10, Math.round(n * 10) / 10));
}

/**
 * Juez Automático de Calidad con Gemini Vision (ultra rápido y <$0.0002/eval).
 * Evalúa la obra generada frente a la foto original de la mascota y la imagen del personaje.
 * Diseño fail-open: si la API falla o excede el timeout, retorna null sin bloquear la generación.
 */
export async function evaluatePortraitQuality(params: {
  pet1Data: JudgeImageInput;
  themeData?: JudgeImageInput | null;
  generatedDataUrl: string;
  geminiKey: string;
  characterName: string;
}): Promise<PortraitQualityEvaluation | null> {
  const { pet1Data, themeData, generatedDataUrl, geminiKey, characterName } =
    params;

  if (!geminiKey || geminiKey.includes("your_")) return null;
  const generatedImg = parseDataUrl(generatedDataUrl);
  if (!generatedImg) return null;

  const parts: any[] = [
    {
      text: "IMAGE A — ORIGINAL CUSTOMER PET PHOTO (ground truth for species, face, eyes, ears, and fur markings):",
    },
    {
      inlineData: {
        mimeType: pet1Data.mimeType,
        data: pet1Data.base64,
      },
    },
    ...(themeData
      ? [
          {
            text: `IMAGE B — CHARACTER TEMPLATE "${characterName}" (ground truth for costume, brightness, colors, and background — IGNORE the sample animal in Image B):`,
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
      text: "IMAGE C — GENERATED PORTRAIT TO EVALUATE:",
    },
    {
      inlineData: {
        mimeType: generatedImg.mimeType,
        data: generatedImg.base64,
      },
    },
    {
      text: `You are a strict art quality inspector for luxury custom pet portraits. Evaluate IMAGE C against IMAGE A${themeData ? " and IMAGE B" : ""}.
Score each metric from 1 (terrible) to 10 (perfect):
1. "petFidelity": Does IMAGE C depict the EXACT same animal species, face, eye color, fur colors/markings, and ears as IMAGE A? (Score <= 5 if it kept the sample animal from Image B or changed fur/species).
2. "proportions": Are the head-to-body and shoulder proportions realistic and natural? (Score <= 5 if bobblehead / oversized head / pasted-head look).
3. "characterMatch": Does IMAGE C match the costume, accessories, brightness, and vibrant colors of "${characterName}"${themeData ? " in IMAGE B" : ""}? (Score <= 5 if overly dark/gloomy or wrong costume).
4. "framing": Is the full head/ears/hat uncropped with clean headroom and NO picture frame, border, or wall?

Return STRICT JSON ONLY:
{
  "petFidelity": number,
  "proportions": number,
  "characterMatch": number,
  "framing": number,
  "correctionNote": string | null
}
If any metric is below 7, write a concise, concrete English "correctionNote" (max 40 words) instructing the image model exactly what to fix on retry. Otherwise set "correctionNote" to null.`,
    },
  ];

  const models = ["gemini-flash-lite-latest", "gemini-flash-latest"];

  for (const modelId of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });
      clearTimeout(timeoutId);

      if (!res.ok) continue;
      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("")
        .trim();
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const breakdown: QualityBreakdown = {
        petFidelity: clampScore(parsed.petFidelity, 8),
        proportions: clampScore(parsed.proportions, 8),
        characterMatch: clampScore(parsed.characterMatch, 8),
        framing: clampScore(parsed.framing, 8),
      };

      // Weighted score: petFidelity (40%) + proportions (25%) + characterMatch (20%) + framing (15%)
      const weighted =
        breakdown.petFidelity * 0.4 +
        breakdown.proportions * 0.25 +
        breakdown.characterMatch * 0.2 +
        breakdown.framing * 0.15;
      const score = Math.round(weighted * 10) / 10;
      const passed =
        score >= 7.0 &&
        breakdown.petFidelity >= 6.5 &&
        breakdown.proportions >= 6.5 &&
        breakdown.characterMatch >= 6.0;

      const correctionNote =
        typeof parsed.correctionNote === "string" &&
        parsed.correctionNote.trim().length > 0
          ? parsed.correctionNote.trim().slice(0, 260)
          : !passed
            ? "Preserve the customer's exact pet face and fur markings from Image A, keep realistic head-to-body proportions, and match the exact bright lighting and costume of the character reference."
            : null;

      return {
        score,
        passed,
        breakdown,
        correctionNote,
      };
    } catch {
      clearTimeout(timeoutId);
      // Fail-open to next model or null
    }
  }

  return null;
}

/**
 * Obtiene reglas de mejora aprendidas automáticamente para un personaje específico
 * a partir del feedback real de clientes y puntajes históricos recientes en `generation_jobs`.
 */
export async function getLearnedCharacterPromptHints(
  characterId: string,
): Promise<string | null> {
  if (!characterId || !isDatabaseConfigured()) return null;

  const cached = learnedHintsCache.get(characterId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.hint;
  }

  try {
    const recentJobs = await prisma.generationJob.findMany({
      where: {
        template_id: characterId,
        status: "completed",
      },
      select: {
        settings: true,
        variants: true,
      },
      orderBy: { created_at: "desc" },
      take: 60,
    });

    const reasonCounts: Record<string, number> = {};
    let lowProportionCount = 0;
    let lowBrightnessCount = 0;
    let lowFidelityCount = 0;

    for (const job of recentJobs) {
      const settings = job.settings as Record<string, any> | null;
      const fbReason = settings?.feedback?.reason;
      if (typeof fbReason === "string" && FEEDBACK_HINT_MAP[fbReason]) {
        reasonCounts[fbReason] = (reasonCounts[fbReason] || 0) + 1;
      }

      const variants = Array.isArray(job.variants)
        ? (job.variants as Array<Record<string, any>>)
        : [];
      for (const v of variants) {
        const bd = v?.qualityBreakdown;
        if (bd && typeof bd === "object") {
          if (Number(bd.proportions) > 0 && Number(bd.proportions) < 7) {
            lowProportionCount += 1;
          }
          if (Number(bd.characterMatch) > 0 && Number(bd.characterMatch) < 7) {
            lowBrightnessCount += 1;
          }
          if (Number(bd.petFidelity) > 0 && Number(bd.petFidelity) < 7) {
            lowFidelityCount += 1;
          }
        }
      }
    }

    const hints: string[] = [];
    const sortedReasons = Object.entries(reasonCounts)
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    for (const [reason] of sortedReasons) {
      if (FEEDBACK_HINT_MAP[reason]) {
        hints.push(FEEDBACK_HINT_MAP[reason]);
      }
    }

    if (lowFidelityCount >= 2 && !reasonCounts.no_match_pet) {
      hints.push(FEEDBACK_HINT_MAP.no_match_pet);
    }
    if (lowProportionCount >= 2 && !reasonCounts.bad_proportions) {
      hints.push(FEEDBACK_HINT_MAP.bad_proportions);
    }
    if (lowBrightnessCount >= 2 && !reasonCounts.too_dark) {
      hints.push(FEEDBACK_HINT_MAP.too_dark);
    }

    const combined = hints.length > 0 ? hints.slice(0, 3).join("\n") : null;
    learnedHintsCache.set(characterId, {
      hint: combined,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return combined;
  } catch {
    return null;
  }
}
