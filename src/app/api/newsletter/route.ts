import { NextResponse } from "next/server";
import { subscribeNewsletter } from "@/lib/db-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, source } = body || {};

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El correo electrónico es obligatorio." },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Por favor ingresa un correo electrónico válido." },
        { status: 400 },
      );
    }

    const result = await subscribeNewsletter(cleanEmail, source || "footer");

    return NextResponse.json({
      success: true,
      isNew: result.isNew,
      message: result.isNew
        ? "¡Gracias por suscribirte! Te avisaremos de promociones exclusivas."
        : "¡Tu correo ya se encuentra registrado! Te mantendremos al tanto de novedades.",
    });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar tu suscripción. Intenta nuevamente." },
      { status: 500 },
    );
  }
}
