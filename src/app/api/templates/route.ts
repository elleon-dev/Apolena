import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { FAMOUS_CHARACTERS } from "@/data/characters";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.characterTemplate.findMany({
        where: { is_available: true },
        orderBy: { position: "asc" },
      });
      if (rows && rows.length > 0) {
        return NextResponse.json({
          success: true,
          count: rows.length,
          templates: rows.map((c) => ({
            id: c.slug,
            name: c.name,
            characterTitle: c.character_title || "",
            universe: c.universe,
            description: c.description || "",
            characterImageUrl: c.character_image_url,
            maskUrl: c.mask_url || "",
            fusionSampleUrl: c.fusion_sample_url || "",
            accentColor: c.accent_color || "bg-terracotta-500",
            tagColor:
              c.tag_color || "bg-white/90 text-stone-800 border-stone-200/80",
            prompt: c.prompt || "",
            negativePrompt: c.negative_prompt || "",
            isAvailable: c.is_available,
          })),
        });
      }
    } catch (e) {
      console.warn("Prisma /api/templates error:", e);
    }
  }

  return NextResponse.json({
    success: true,
    count: FAMOUS_CHARACTERS.length,
    templates: FAMOUS_CHARACTERS,
  });
}
