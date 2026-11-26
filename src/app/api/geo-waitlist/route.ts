import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  buildWaitlistSource,
  extractRequestCountry,
  getCountryNameEs,
  normalizeCountryCode,
} from "@/lib/geo-access";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json(
        { error: "Por favor ingresa un correo electrónico válido." },
        { status: 400 },
      );
    }

    const requestedCountry = normalizeCountryCode(body?.countryCode);
    const headerCountry = extractRequestCountry(request.headers);
    const finalCountry = requestedCountry || headerCountry || "INTL";
    const source = buildWaitlistSource(finalCountry);
    const countryName = getCountryNameEs(finalCountry);

    if (isDatabaseConfigured()) {
      await prisma.newsletterSubscriber.upsert({
        where: { email: rawEmail },
        update: {
          source,
          is_active: true,
        },
        create: {
          email: rawEmail,
          source,
          is_active: true,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      countryCode: finalCountry,
      countryName,
      message: `Listo. Te avisaremos a ${rawEmail} en cuanto Apolena empiece a operar en ${countryName}.`,
    });
  } catch (err) {
    console.error("Error registrando en lista de espera internacional:", err);
    return NextResponse.json(
      { error: "No pudimos registrar tu correo en este momento. Intenta nuevamente." },
      { status: 500 },
    );
  }
}
