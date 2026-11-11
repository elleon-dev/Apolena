import { NextRequest, NextResponse } from "next/server";
import { updateProfilePassword } from "@/lib/db-service";
import { verifyPasswordResetToken, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "El token de restablecimiento es requerido" },
        { status: 400 },
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "La nueva contraseña debe tener al menos 6 caracteres",
        },
        { status: 400 },
      );
    }

    const payload = await verifyPasswordResetToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El enlace de restablecimiento es inválido o ha expirado. Solicita un nuevo enlace.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const updated = await updateProfilePassword(payload.userId, passwordHash);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "No se pudo actualizar la contraseña. Usuario no encontrado.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error: any) {
    console.error("[reset-password error]:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al restablecer tu contraseña" },
      { status: 500 },
    );
  }
}
