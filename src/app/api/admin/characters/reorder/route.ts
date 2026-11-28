import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/auth";
import {
  getAuthoritativeSessionUser,
  reorderWallArtCharacters,
} from "@/lib/db-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const orderedIds = Array.isArray(body?.orderedIds)
      ? body.orderedIds
          .map((id: unknown) => String(id || "").trim())
          .filter(Boolean)
      : [];

    if (orderedIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere una lista válida de personajes para reordenar." },
        { status: 400 },
      );
    }

    const result = await reorderWallArtCharacters(orderedIds);

    try {
      revalidatePath("/");
      revalidatePath("/products/cuadros-personalizados");
    } catch {}

    return NextResponse.json({
      success: true,
      orderedIds: result.orderedIds,
    });
  } catch (err) {
    console.error("[POST /api/admin/characters/reorder] Error:", err);
    return NextResponse.json(
      { error: "No se pudo guardar el orden de los personajes." },
      { status: 500 },
    );
  }
}
