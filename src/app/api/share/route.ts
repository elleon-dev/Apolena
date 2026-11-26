import { NextRequest, NextResponse } from "next/server";
import { saveSharedCreation } from "@/lib/share-storage";
import { getRequestOrigin } from "@/lib/app-url";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cardDataUrl = String(body.cardDataUrl || "").trim();

    if (!cardDataUrl || !cardDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Se requiere la imagen generada de la tarjeta para compartir." },
        { status: 400 },
      );
    }

    const record = await saveSharedCreation({
      cardDataUrl,
      themeName: body.themeName || "Retrato Personalizado",
      characterId: body.characterId || "",
      petName: body.petName || null,
      frameName: body.frameName || null,
      format: body.format === "post" ? "post" : "story",
    });

    const origin = getRequestOrigin(request);
    const shareUrl = `${origin}/share/${record.id}`;

    return NextResponse.json({
      success: true,
      id: record.id,
      shareUrl,
      imageUrl: record.imageUrl,
    });
  } catch (error: any) {
    console.error("Error in POST /api/share:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo crear el enlace compartible." },
      { status: 500 },
    );
  }
}
