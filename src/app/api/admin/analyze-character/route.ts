import { NextResponse } from "next/server";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { sanitizeCharacterPromptToSpeciesNeutral } from "@/lib/ai-providers";
import fs from "fs";
import path from "path";

function sanitizeSpanishDescriptionToSpeciesNeutral(desc: string): string {
  if (!desc) return "";
  return desc
    .replace(/\bun\s+majestuoso\s+(?:felino|gato|canino|perro)\b/gi, "Tu mascota majestuosamente")
    .replace(/\b(?:realeza\s+felina|realeza\s+canina)\b/gi, "realeza de tu mascota")
    .replace(/\b(?:el\s+felino|el\s+gato|el\s+perro|el\s+canino)\b/gi, "tu mascota")
    .replace(/\b(?:felino|gato|perro|canino)\b/gi, "mascota");
}

interface CharacterAnalysisResult {
  name: string;
  characterTitle: string;
  universe: string;
  description: string;
  prompt: string;
  negativePrompt: string;
}

// Heurísticas locales de respaldo inteligente (100% gratuitas, sin llamadas de red)
function getLocalHeuristicAnalysis(fileName?: string): CharacterAnalysisResult {
  const cleanName = (fileName || "").toLowerCase().replace(/[-_.]+/g, " ");

  if (cleanName.includes("inca") || cleanName.includes("cusco") || cleanName.includes("andes") || cleanName.includes("sol")) {
    return {
      name: "Sapa Inca Imperial",
      characterTitle: "Gobernante Supremo del Tahuantinsuyo",
      universe: "Colección Andina · Cusco Imperial",
      description: "Corona solar de oro macizo, túnica unku de alpaca con bordados tocapus sagrados y manto real tejido con hilos ceremoniales.",
      prompt: "Museum-grade oil portrait of the pet dressed in authentic royal Inca emperor regalia, solid gold mascapaicha crown, finely woven alpaca unku tunic with geometric tocapu patterns, bathed in warm Andean sunset light. 8k photorealistic masterpiece.",
      negativePrompt: "human face, human hands, cartoon, 3d render, deformed eyes, extra limbs, modern elements, low quality",
    };
  }

  if (cleanName.includes("militar") || cleanName.includes("general") || cleanName.includes("soldier") || cleanName.includes("capitan") || cleanName.includes("almirante")) {
    return {
      name: "General Libertador",
      characterTitle: "Comandante en Jefe de las Fuerzas Reales",
      universe: "Época Independentista · Siglo XIX",
      description: "Chaqueta militar de paño azul noche con charreteras de oro bruñido, cordones ceremoniales y banda de honor sobre fondo de biblioteca clásica.",
      prompt: "Photorealistic fine art portrait of the pet wearing an authentic 19th-century military general uniform, velvet navy coat, gleaming golden braided epaulettes, brass buttons, and ceremonial sash. Dramatic Rembrandt studio lighting, 8k resolution, oil canvas texture.",
      negativePrompt: "human face, human hands, cartoon, illustration, low quality, blurry, deformed eyes, modern clothing",
    };
  }

  if (cleanName.includes("rey") || cleanName.includes("king") || cleanName.includes("corona") || cleanName.includes("principe") || cleanName.includes("realeza") || cleanName.includes("queen") || cleanName.includes("reina")) {
    return {
      name: "Monarca de la Alta Corte",
      characterTitle: "Soberano de la Corona Real",
      universe: "Realeza Europea Clásica",
      description: "Capa de armiño blanco con motas negras, jubón de terciopelo carmesí con filigranas doradas y corona enjoyada con rubíes y zafiros.",
      prompt: "Majestic regal portrait of the pet as a royal monarch, wearing a crimson velvet coronation robe lined with ermine fur, intricate golden embroidery, and a jeweled crown. Warm palace interior ambient lighting, hyperrealistic 8k oil painting.",
      negativePrompt: "human face, human hands, cartoon, distorted body, blurry, extra ears, plastic texture, low quality",
    };
  }

  if (cleanName.includes("cyber") || cleanName.includes("neon") || cleanName.includes("futuro") || cleanName.includes("robot") || cleanName.includes("sci-fi")) {
    return {
      name: "Comandante Cyberpunk",
      characterTitle: "Operativo Táctico del Año 2099",
      universe: "Neo-Metrópolis Futurista",
      description: "Armadura ligera de fibra de carbono con circuitos luminosos en cian y magenta, cuello alto aerodinámico y reflejos holográficos.",
      prompt: "Cinematic portrait of the pet wearing high-tech sleek cyberpunk carbon armor with glowing cyan and magenta optical fiber accents, high collar, rainy futuristic cityscape neon background, hyper-detailed photorealistic render.",
      negativePrompt: "human face, human hands, cartoon, lowres, blurry, distorted anatomy, ancient clothing",
    };
  }

  if (cleanName.includes("samurai") || cleanName.includes("japon") || cleanName.includes("ninja") || cleanName.includes("bushido")) {
    return {
      name: "Guerrero Samurái",
      characterTitle: "Maestro del Código Bushido",
      universe: "Japón Feudal · Era Edo",
      description: "Armadura tradicional lacada en negro y rojo con cordones de seda, hombreras sode ornamentadas y fondo de cerezos en flor.",
      prompt: "Authentic feudal Japanese portrait of the pet wearing traditional lacquered samurai armor, silk cords, ornamented kabuto details, cherry blossom petals gently floating in background, cinematic warm lighting, photorealistic 8k.",
      negativePrompt: "human face, human hands, cartoon, distorted eyes, blurry, plastic armor, low quality",
    };
  }

  if (cleanName.includes("mago") || cleanName.includes("wizard") || cleanName.includes("brujo") || cleanName.includes("magia") || cleanName.includes("fantasia")) {
    return {
      name: "Archimago del Oráculo",
      characterTitle: "Guardián de los Arcanos Antiguos",
      universe: "Fantasía Arcana & Magia Medieval",
      description: "Túnica de terciopelo azul medianoche bordada con constelaciones plateadas, amuleto rúnico brillante y tomo místico abierto.",
      prompt: "Ethereal mystical fantasy portrait of the pet as a grand sorcerer wearing celestial midnight blue robes embroidered with glowing silver constellations, arcane crystal amulet, magical library background with floating motes of light, 8k masterpiece.",
      negativePrompt: "human face, human hands, cartoon, low quality, deformed, blurry, extra limbs",
    };
  }

  // Fallback elegante universal
  return {
    name: "Retrato Aristócrata Ilustrado",
    characterTitle: "Noble de la Casa de Galería",
    universe: "Colección Clásica Apolena",
    description: "Vestimenta distinguida de época con gorguera de encaje holandés, chaqueta de terciopelo bordada a mano y atmósfera cálida de claroscuro.",
    prompt: "Exquisite fine art oil portrait of the pet dressed in opulent classical aristocratic attire, velvet embroidered coat, intricate lace collar, and antique gold jewelry. Rembrandt chiaroscuro lighting, rich atmospheric tones, museum exhibition quality, 8k photorealistic.",
    negativePrompt: "human face, human hands, cartoon, illustration, low quality, blurry, distorted eyes, modern casual clothes",
  };
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de Administrador." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { image, fileName } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Se requiere la imagen para realizar el análisis." },
        { status: 400 },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const openAiKey = process.env.OPENAI_API_KEY?.trim();

    let mimeType = "image/jpeg";
    let base64Data = "";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      const fetchImg = await fetch(image);
      if (fetchImg.ok) {
        const buffer = await fetchImg.arrayBuffer();
        base64Data = Buffer.from(buffer).toString("base64");
        mimeType = fetchImg.headers.get("content-type") || "image/jpeg";
      }
    } else {
      // Ruta relativa local en public/ (ej. /characters/jack-sparrow.webp, /samples/..., /fusions/...)
      const cleanPath = image.replace(/^https?:\/\/[^\/]+/, "").replace(/^\/+/, "");
      const fullPath = path.join(process.cwd(), "public", cleanPath);
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        base64Data = buffer.toString("base64");
        const ext = path.extname(fullPath).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
        };
        mimeType = mimeMap[ext] || "image/jpeg";
      }
    }

    const systemInstruction = `Eres un experto director de arte para Apolena, un atelier de lujo especializado en transformar mascotas en obras de arte de la realeza, la historia, el cine, la mitología y la cultura mundial.
Examina la imagen de referencia con atención minuciosa al personaje específico, su vestimenta, tocado, accesorios, fondo, iluminación y temática:
- IDENTIFICA EL PERSONAJE O TEMÁTICA EXACTA:
  * Si es un pirata icónico (como el Capitán Jack Sparrow de Piratas del Caribe), identifícalo con su nombre exacto ('Capitán Jack Sparrow' o 'Capitán Pirata del Caribe'), con su sombrero tricornio, bandana roja, melena con rastas y abalorios, casaca desgastada y correajes de cuero.
  * Si es temática incaica/andina (como el Sapa Inca Imperial), identifícalo con exactitud ('Sapa Inca Imperial', 'Realeza Andina'), describiendo su unku de alpaca con tocapus, mascapaicha o corona solar dorada y pectorales ceremoniales.
  * Si es Arthur Fleck / Joker, identifícalo como 'Arthur Fleck (Gala)' con traje bermellón y chaleco mostaza.
  * Si es faraón egipcio, samurái, vikingo, noble renacentista, astronauta, etc., identifícalo con total precisión visual e histórica.
- NUNCA inventes elementos que no estén en la imagen (por ejemplo, NO digas "gorguera de encaje holandés" si la imagen no tiene encaje holandés; describe exactamente lo que se ve en la fotografía).
- REGLA CRÍTICA DE NEUTRALIDAD DE ESPECIE: Aunque la imagen de referencia muestre un animal específico o una persona vistiendo el traje, NUNCA escribas especies específicas ("cat", "tabby cat", "dog", "feline", "canine", "gato", "felino", "perro", "canino", etc.) en los campos "description" ni "prompt". El prompt en inglés DEBE referirse siempre de forma neutra a "the uploaded pet from the reference photo", porque cualquier cliente podrá subir cualquier tipo de mascota para usar este vestuario.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con estas claves:
{
  "name": "Nombre conciso y reconocible en español (ej. 'Capitán Jack Sparrow', 'Sapa Inca Imperial', 'Arthur Fleck (Gala)')",
  "characterTitle": "Subtítulo o rango en español (ej. 'Legendario Capitán de la Perla Negra', 'Soberano del Tahuantinsuyo')",
  "universe": "Universo o colección en español (ej. 'Colección Piratas & Aventuras', 'Imperio Inca · Machu Picchu')",
  "description": "1 o 2 oraciones atractivas y precisas en español describiendo el vestuario, prendas, accesorios y atmósfera exacta de la imagen para el cliente (sin mencionar una especie específica).",
  "prompt": "Master synthesis prompt in English for image generation AI, always starting with 'A majestic portrait of the uploaded pet from the reference photo dressed as...' and describing the exact attire, fabrics, headwear, accessories, pose, background, and studio lighting with 8k photorealistic fine art quality (never mention a specific species).",
  "negativePrompt": "human face, human hands, deformed anatomy, blurry, cartoon, 3d render, watermark, extra limbs, low quality"
}
Devuelve SOLO el JSON sin explicaciones adicionales.`;

    // 1. Intentar con modelos de Google Gemini (Free Tier / Multimodal)
    if (geminiKey && geminiKey.length > 5 && base64Data) {
      const geminiCandidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-flash-lite-latest",
      ];

      for (const modelId of geminiCandidateModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(geminiKey)}`;

          const apiRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                    {
                      text: systemInstruction,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000,
                responseMimeType: "application/json",
              },
            }),
          });

          if (apiRes.ok) {
            const apiJson = await apiRes.json();
            const textResponse =
              apiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (textResponse) {
              const cleanedText = textResponse
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();

              const parsedData: CharacterAnalysisResult =
                JSON.parse(cleanedText);

              if (parsedData.name && parsedData.prompt) {
                return NextResponse.json({
                  success: true,
                  data: {
                    name: parsedData.name,
                    characterTitle:
                      parsedData.characterTitle || "Personaje de Colección",
                    universe: parsedData.universe || "Colección Apolena",
                    description: sanitizeSpanishDescriptionToSpeciesNeutral(
                      parsedData.description || "",
                    ),
                    prompt: sanitizeCharacterPromptToSpeciesNeutral(
                      parsedData.prompt,
                      false,
                    ),
                    negativePrompt:
                      parsedData.negativePrompt ||
                      "human face, human hands, cartoon, illustration, low quality, blurry, deformed eyes",
                  },
                  source: "gemini-flash-free",
                });
              }
            }
          }
        } catch (mErr) {
          console.warn(`Error probando modelo ${modelId}:`, mErr);
        }
      }
    }

    // 2. Si Gemini no responde por spike, probar OpenAI gpt-4o-mini Vision si hay API Key
    if (openAiKey && openAiKey.length > 5 && base64Data) {
      try {
        const oRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: systemInstruction,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analiza esta imagen y responde con el JSON requerido.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Data}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 800,
          }),
        });

        if (oRes.ok) {
          const oJson = await oRes.json();
          const content = oJson.choices?.[0]?.message?.content;
          if (content) {
            const parsedData: CharacterAnalysisResult = JSON.parse(content);
            if (parsedData.name && parsedData.prompt) {
              return NextResponse.json({
                success: true,
                data: {
                  name: parsedData.name,
                  characterTitle:
                    parsedData.characterTitle || "Personaje de Colección",
                  universe: parsedData.universe || "Colección Apolena",
                  description: sanitizeSpanishDescriptionToSpeciesNeutral(
                    parsedData.description || "",
                  ),
                  prompt: sanitizeCharacterPromptToSpeciesNeutral(
                    parsedData.prompt,
                    false,
                  ),
                  negativePrompt:
                    parsedData.negativePrompt ||
                    "human face, human hands, cartoon, illustration, low quality, blurry, deformed eyes",
                },
                source: "openai-mini-vision",
              });
            }
          }
        }
      } catch (oErr) {
        console.warn("Error probando OpenAI fallback:", oErr);
      }
    }

    // 3. Respaldo Inteligente Local (Costo $0 garantizado)
    const fallback = getLocalHeuristicAnalysis(fileName);
    return NextResponse.json({
      success: true,
      data: fallback,
      source: "local-heuristic-zero-cost",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al procesar la imagen." },
      { status: 500 },
    );
  }
}

