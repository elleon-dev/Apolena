import { NextResponse } from "next/server";

interface PetValidationResult {
  isPet: boolean;
  hasClearFace: boolean;
  species: "dog" | "cat" | "other";
  reason: string;
}

const VALIDATION_PROMPT =
  "Eres el validador estricto de fotografías de mascotas para Apolena (retratos personalizados de mascotas). " +
  "Analiza cuidadosamente la imagen adjunta y verifica DOS requisitos obligatorios: " +
  "1) Debe ser una fotografía REAL de un animal/mascota (perro, gato, conejo, ave, hámster, caballo, etc.). " +
  "2) Deben visualizarse claramente las facciones del rostro del animal (ojos, hocico/pico/nariz y cabeza reconocibles para poder retratarlo fielmente). " +
  "RECHAZA ESTRICTAMENTE (isPet: false o hasClearFace: false) si la imagen es: " +
  "- Una persona o humano sin mascota (foto real, selfie, dibujo, ilustración, cómic, anime o avatar). " +
  "- Una ilustración, caricatura, dibujo o imagen generada que no sea una foto real de mascota. " +
  "- Un objeto inanimado (vehículo, mueble, comida, edificio, paisaje, texto o captura de pantalla). " +
  "- Una foto de mascota donde NO se distingan sus facciones faciales (de espaldas, demasiado borrosa, muy oscura o cortada). " +
  "Responde EXCLUSIVAMENTE en JSON válido con esta estructura exacta: " +
  '{"isPet": boolean, "hasClearFace": boolean, "species": "dog" | "cat" | "other", "reason": "explicación breve y cordial en español (máx. 18 palabras) indicando qué se ve y pidiendo una foto clara del rostro de la mascota"}';

function normalizeValidationResult(raw: unknown): PetValidationResult | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Record<string, unknown>;
  if (typeof parsed.isPet !== "boolean") return null;

  const isPet = parsed.isPet;
  const hasClearFace =
    typeof parsed.hasClearFace === "boolean" ? parsed.hasClearFace : isPet;
  const approved = isPet && hasClearFace;
  const species =
    parsed.species === "dog" ||
    parsed.species === "cat" ||
    parsed.species === "other"
      ? parsed.species
      : "other";

  const fallbackReject = !isPet
    ? "La imagen no muestra una mascota real. Sube una fotografía clara del rostro de tu mascota."
    : "No se distinguen bien las facciones de tu mascota. Sube una foto más nítida donde se vea su rostro y ojos.";

  return {
    isPet: approved,
    hasClearFace,
    species,
    reason:
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : approved
          ? "Mascota y facciones identificadas correctamente."
          : fallbackReject,
  };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  }
}

async function validateWithOpenAI(
  dataUrl: string,
  apiKey: string,
): Promise<PetValidationResult | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VALIDATION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "auto",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 160,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    console.warn("[validate-pet] OpenAI vision error status:", res.status);
    return null;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;
  return normalizeValidationResult(extractJsonObject(content));
}

const GEMINI_VISION_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

async function validateWithGemini(
  dataUrl: string,
  apiKey: string,
): Promise<PetValidationResult | null> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match ? match[1] : "image/jpeg";
  const base64Data = match ? match[2] : dataUrl;

  for (const model of GEMINI_VISION_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: VALIDATION_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });

      if (!res.ok) {
        console.warn(`[validate-pet] Gemini (${model}) error status:`, res.status);
        continue;
      }

      const data = await res.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof content !== "string") continue;
      const normalized = normalizeValidationResult(extractJsonObject(content));
      if (normalized) return normalized;
    } catch (err) {
      console.warn(`[validate-pet] Gemini (${model}) exception:`, err);
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { isPet: false, reason: "No se proporcionó una imagen válida." },
        { status: 400 },
      );
    }

    const dataUrl = image.startsWith("data:")
      ? image
      : `data:image/jpeg;base64,${image}`;

    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    // 1. Intento principal con OpenAI Vision
    if (openaiKey && !openaiKey.includes("your_")) {
      try {
        const result = await validateWithOpenAI(dataUrl, openaiKey);
        if (result) {
          return NextResponse.json(result);
        }
      } catch (err) {
        console.warn("[validate-pet] OpenAI exception:", err);
      }
    }

    // 2. Respaldo automático con Gemini Vision
    if (geminiKey && !geminiKey.includes("your_")) {
      try {
        const result = await validateWithGemini(dataUrl, geminiKey);
        if (result) {
          return NextResponse.json(result);
        }
      } catch (err) {
        console.warn("[validate-pet] Gemini exception:", err);
      }
    }

    // 3. Fail-closed: jamás aprobar fotos aleatorias cuando el validador no pudo ejecutarse
    return NextResponse.json(
      {
        isPet: false,
        hasClearFace: false,
        validationUnavailable: true,
        reason:
          "No pudimos verificar que la fotografía muestre el rostro de tu mascota en este momento. Intenta subirla nuevamente.",
      },
      { status: 503 },
    );
  } catch (error) {
    console.error("[validate-pet error]:", error);
    return NextResponse.json(
      {
        isPet: false,
        hasClearFace: false,
        reason:
          "Ocurrió un error al analizar tu fotografía. Por favor intenta nuevamente.",
      },
      { status: 500 },
    );
  }
}
