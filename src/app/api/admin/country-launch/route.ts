import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth";
import { getAuthoritativeSessionUser } from "@/lib/db-service";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  buildWaitlistSource,
  getActiveCountries,
  getCountryNameEs,
  isCountryAllowed,
  normalizeCountryCode,
  parseCountryFromWaitlistSource,
  WAITLIST_SOURCE_PREFIX,
} from "@/lib/geo-access";
import { dispatchEmailWithResend } from "@/lib/email-service";
import { resolveAppUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/country-launch
 * Devuelve los países activos actualmente y el conteo de usuarios en lista de espera por país.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const activeCountries = getActiveCountries().map((code) => ({
      code,
      name: getCountryNameEs(code),
    }));

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ activeCountries, waitlistByCountry: [] });
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        is_active: true,
        source: { startsWith: WAITLIST_SOURCE_PREFIX },
      },
      select: {
        source: true,
      },
    });

    const counts: Record<string, number> = {};
    for (const sub of subscribers) {
      const code = parseCountryFromWaitlistSource(sub.source) || "INTL";
      counts[code] = (counts[code] || 0) + 1;
    }

    const waitlistByCountry = Object.entries(counts)
      .map(([code, count]) => ({
        code,
        name: getCountryNameEs(code),
        count,
        isActive: isCountryAllowed(code),
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ activeCountries, waitlistByCountry });
  } catch (err) {
    console.error("Error consultando lista de espera por país:", err);
    return NextResponse.json(
      { error: "No se pudo consultar la lista de espera." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/country-launch
 * Body: { countryCode: "CO" }
 * Cuando un nuevo país ya fue agregado a los países activos, notifica por correo
 * a todos los usuarios registrados en la lista de espera de ese país.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const countryCode = normalizeCountryCode(body?.countryCode);
    if (!countryCode) {
      return NextResponse.json(
        { error: "Debes indicar un código de país ISO-2 válido (ej. CO, CL, MX)." },
        { status: 400 },
      );
    }

    if (!isCountryAllowed(countryCode)) {
      return NextResponse.json(
        {
          error: `El país ${countryCode} aún no está habilitado en NEXT_PUBLIC_ACTIVE_COUNTRIES / DEFAULT_ACTIVE_COUNTRIES. Habilítalo primero antes de notificar a los usuarios.`,
        },
        { status: 400 },
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 500 },
      );
    }

    const source = buildWaitlistSource(countryCode);
    const countryName = getCountryNameEs(countryCode);
    const appUrl = resolveAppUrl();

    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        is_active: true,
        source,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({
        ok: true,
        countryCode,
        countryName,
        notified: 0,
        message: `No hay usuarios registrados en lista de espera para ${countryName}.`,
      });
    }

    let sentCount = 0;
    let queuedCount = 0;

    for (const sub of subscribers) {
      const subject = `Ya operamos en ${countryName} — Crea el retrato de tu mascota en Apolena`;
      const emailData = {
        country_code: countryCode,
        country_name: countryName,
        app_url: appUrl,
      };

      const queueRow = await prisma.emailQueue.create({
        data: {
          to_email: sub.email,
          subject,
          template: "country_launch_notification",
          data: emailData,
          status: "pending",
        },
      });
      queuedCount++;

      const dispatch = await dispatchEmailWithResend({
        to: sub.email,
        subject,
        template: "country_launch_notification",
        data: emailData,
      });

      if (dispatch.sent) {
        sentCount++;
        await prisma.emailQueue.update({
          where: { id: queueRow.id },
          data: { status: "sent", attempts: 1 },
        });
      } else {
        await prisma.emailQueue.update({
          where: { id: queueRow.id },
          data: {
            attempts: 1,
            last_error: dispatch.error || "Pendiente de despacho",
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      countryCode,
      countryName,
      queued: queuedCount,
      sent: sentCount,
      message: `Se encolaron ${queuedCount} notificaciones (${sentCount} enviadas) para usuarios de ${countryName}.`,
    });
  } catch (err) {
    console.error("Error enviando notificaciones de lanzamiento por país:", err);
    return NextResponse.json(
      { error: "Ocurrió un error al notificar a los usuarios." },
      { status: 500 },
    );
  }
}
