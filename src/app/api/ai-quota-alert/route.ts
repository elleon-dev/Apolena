import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  getAuthoritativeSessionUser,
  getPlatformSettings,
} from "@/lib/db-service";
import { dispatchEmailWithResend } from "@/lib/email-service";
import { resolveAppUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export interface AiProviderHealthState {
  activeAlert: boolean;
  alertCount: number;
  lastAlertAt: string | null;
  lastEmailSentAt: string | null;
  lastProvider: string;
  lastReason: string;
  lastReporterEmail: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

const DEFAULT_HEALTH_STATE: AiProviderHealthState = {
  activeAlert: false,
  alertCount: 0,
  lastAlertAt: null,
  lastEmailSentAt: null,
  lastProvider: "openai",
  lastReason: "",
  lastReporterEmail: null,
  resolvedAt: null,
  resolvedBy: null,
};

const EMAIL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos entre correos para evitar spam

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const provider =
      typeof body?.provider === "string" && body.provider.trim()
        ? body.provider.trim()
        : "openai";
    const reason =
      typeof body?.reason === "string" && body.reason.trim()
        ? body.reason.trim().slice(0, 300)
        : "Un usuario reportó que el servicio de generación alcanzó el límite de créditos (Error 429).";

    const sessionUser = await getAuthoritativeSessionUser(request).catch(
      () => null,
    );
    const nowIso = new Date().toISOString();

    let currentState: AiProviderHealthState = { ...DEFAULT_HEALTH_STATE };
    if (isDatabaseConfigured()) {
      const existing = await prisma.platformSetting
        .findUnique({ where: { key: "AI_PROVIDER_HEALTH" } })
        .catch(() => null);
      if (existing?.value && typeof existing.value === "object") {
        currentState = {
          ...DEFAULT_HEALTH_STATE,
          ...(existing.value as Partial<AiProviderHealthState>),
        };
      }
    }

    const lastEmailTime = currentState.lastEmailSentAt
      ? new Date(currentState.lastEmailSentAt).getTime()
      : 0;
    const shouldSendEmail =
      !lastEmailTime || Date.now() - lastEmailTime >= EMAIL_COOLDOWN_MS;

    const nextState: AiProviderHealthState = {
      ...currentState,
      activeAlert: true,
      alertCount: (currentState.alertCount || 0) + 1,
      lastAlertAt: nowIso,
      lastEmailSentAt: shouldSendEmail ? nowIso : currentState.lastEmailSentAt,
      lastProvider: provider,
      lastReason: reason,
      lastReporterEmail: sessionUser?.email || "Visitante anónimo",
    };

    if (isDatabaseConfigured()) {
      await prisma.platformSetting.upsert({
        where: { key: "AI_PROVIDER_HEALTH" },
        update: {
          value: nextState as any,
          category: "notifications",
          description:
            "Estado y alertas de créditos/cuota de los motores de IA (OpenAI / Gemini)",
        },
        create: {
          key: "AI_PROVIDER_HEALTH",
          value: nextState as any,
          category: "notifications",
          description:
            "Estado y alertas de créditos/cuota de los motores de IA (OpenAI / Gemini)",
        },
      });
    }

    let emailDispatched = false;
    if (shouldSendEmail) {
      const settings = await getPlatformSettings();
      const adminEmail =
        settings.ADMIN_NOTIFICATION_EMAILS.emails?.[0] ||
        "apolenaperu@gmail.com";
      const appUrl = resolveAppUrl();
      const subject = `[ALERTA CRÉDITOS IA] Límite alcanzado en ${provider.toUpperCase()} — Apolena`;
      const emailData = {
        provider,
        reason,
        alert_count: nextState.alertCount,
        reporter: nextState.lastReporterEmail,
        reported_at: nowIso,
        app_url: appUrl,
      };

      if (isDatabaseConfigured()) {
        const queueRow = await prisma.emailQueue.create({
          data: {
            to_email: adminEmail,
            subject,
            template: "ai_quota_alert",
            data: emailData,
            status: "pending",
          },
        });

        const dispatch = await dispatchEmailWithResend({
          to: adminEmail,
          subject,
          template: "ai_quota_alert",
          data: emailData,
        });

        emailDispatched = dispatch.sent;
        await prisma.emailQueue.update({
          where: { id: queueRow.id },
          data: dispatch.sent
            ? { status: "sent", attempts: 1 }
            : {
                attempts: 1,
                last_error: dispatch.error || "Pendiente de despacho",
              },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      emailDispatched,
      message:
        "Gracias por avisarnos. Nuestro equipo ya recibió la alerta y recargará el servicio en breve.",
    });
  } catch (err) {
    console.error("[ai-quota-alert] Error:", err);
    return NextResponse.json(
      { error: "No se pudo enviar la alerta en este momento." },
      { status: 500 },
    );
  }
}
