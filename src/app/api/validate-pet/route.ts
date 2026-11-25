import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { isPet: false, reason: "No se proporcionó una imagen válida." },
        { status: 400 },
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey || openaiKey.includes("your_")) {
      return NextResponse.json({
        isPet: true,
        species: "dog",
        reason: "Validación por omisión.",
      });
    }

    const prompt =
      "Eres el validador oficial de fotografías de mascotas para Apolena (tienda de cuadros de bellas artes personalizados para mascotas). " +
      "Analiza la imagen adjunta. Determina si muestra claramente a una mascota o animal real (perro, gato, conejo, ave, caballo, hámster, etc.). " +
      "RECHAZA estrictamente (isPet: false) si la imagen es un objeto inanimado (por ejemplo: bicicleta, vehículo, muebles, herramientas, edificio, comida), paisaje, texto/captura de pantalla, o si es únicamente una persona/humano sin mascota. " +
      "Responde EXCLUSIVAMENTE en formato JSON con la siguiente estructura: " +
      "{\"isPet\": boolean, \"species\": \"dog\" | \"cat\" | \"other\", \"reason\": \"explicación breve y cordial en español de máximo 15 palabras indicando qué aparece y solicitando una foto de mascota\"}";

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
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: image.startsWith("data:")
                    ? image
                    : `data:image/jpeg;base64,${image}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 120,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.warn("[validate-pet] OpenAI vision error status:", res.status);
      return NextResponse.json({
        isPet: true,
        species: "other",
        reason: "Validación no concluyente.",
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");

    return NextResponse.json({
      isPet: Boolean(parsed.isPet),
      species: ["dog", "cat", "other"].includes(parsed.species)
        ? parsed.species
        : "other",
      reason:
        parsed.reason ||
        (parsed.isPet
          ? "Mascota identificada correctamente."
          : "La fotografía no parece mostrar una mascota. Sube una foto de tu engreído."),
    });
  } catch (error) {
    console.error("[validate-pet error]:", error);
    return NextResponse.json({
      isPet: true,
      species: "dog",
      reason: "Error interno de validación.",
    });
  }
}
