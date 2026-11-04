import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getPlatformSettings,
  updatePlatformSettings,
  updateProductCustomizationConfig,
} from "@/lib/db-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }
  const settings = await getPlatformSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }

    const body = await request.json();

    if (body.productUpdate && body.productId) {
      const updatedProduct = await updateProductCustomizationConfig(
        body.productId,
        body.productUpdate,
      );
      return NextResponse.json({ product: updatedProduct });
    }

    const settings = await updatePlatformSettings(body.settings, user.id);
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al guardar la configuración." },
      { status: 500 },
    );
  }
}
