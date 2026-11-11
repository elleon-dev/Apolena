import { NextRequest, NextResponse } from "next/server";
import { findProfileByEmail, enqueueEmail } from "@/lib/db-service";
import { signPasswordResetToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Ingresa un correo electrónico válido" },
        { status: 400 },
      );
    }

    const profile = await findProfileByEmail(email);

    if (profile && profile.is_active !== false) {
      const token = await signPasswordResetToken(profile.email, profile.id);
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        req.nextUrl.origin ||
        "http://localhost:3000";
      const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

      await enqueueEmail({
        to_email: profile.email,
        subject: "Recupera tu contraseña en Apolena",
        template: "password_reset",
        data: {
          name: profile.name || "Cliente",
          reset_url: resetUrl,
        },
      });
    }

    // Regla de seguridad: Responder siempre con mensaje genérico para evitar enumeración de cuentas
    return NextResponse.json({
      success: true,
      message:
        "Si tu correo está registrado en Apolena, recibirás un enlace seguro para restablecer tu contraseña en los próximos minutos.",
    });
  } catch (error: any) {
    console.error("[forgot-password error]:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error al procesar tu solicitud" },
      { status: 500 },
    );
  }
}
