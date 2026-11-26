import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth";
import { getAuthoritativeSessionUser } from "@/lib/db-service";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import type { AiProviderHealthState } from "@/app/api/ai-quota-alert/route";

export const dynamic = "force-dynamic";

const DEFAULT_HEALTH: AiProviderHealthState = {
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

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const envStatus = {
      openai: Boolean(
        process.env.OPENAI_API_KEY?.trim() &&
          !process.env.OPENAI_API_KEY.includes("your_"),
      ),
      gemini: Boolean(
        process.env.GEMINI_API_KEY?.trim() &&
          !process.env.GEMINI_API_KEY.includes("your_"),
      ),
      fal: Boolean(process.env.FAL_KEY?.trim()),
    };

    let health: AiProviderHealthState = { ...DEFAULT_HEALTH };
    const providerStats: Record<
      string,
      { total: number; thisMonth: number; lastUsedAt: string | null }
    > = {
      openai: { total: 0, thisMonth: 0, lastUsedAt: null },
      gemini: { total: 0, thisMonth: 0, lastUsedAt: null },
      fal: { total: 0, thisMonth: 0, lastUsedAt: null },
    };

    if (isDatabaseConfigured()) {
      const setting = await prisma.platformSetting
        .findUnique({ where: { key: "AI_PROVIDER_HEALTH" } })
        .catch(() => null);
      if (setting?.value && typeof setting.value === "object") {
        health = {
          ...DEFAULT_HEALTH,
          ...(setting.value as Partial<AiProviderHealthState>),
        };
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const jobs = await prisma.generationJob
        .findMany({
          where: { status: "completed" },
          select: {
            provider: true,
            model_used: true,
            variants: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          take: 5000,
        })
        .catch(() => []);

      const recordUsage = (rawProvider: string, createdAt: Date) => {
        const key = rawProvider.toLowerCase();
        const bucket = key.includes("gemini")
          ? "gemini"
          : key.includes("fal")
            ? "fal"
            : "openai";
        providerStats[bucket].total += 1;
        if (createdAt >= startOfMonth) {
          providerStats[bucket].thisMonth += 1;
        }
        if (!providerStats[bucket].lastUsedAt) {
          providerStats[bucket].lastUsedAt = createdAt.toISOString();
        }
      };

      for (const job of jobs) {
        const variants = Array.isArray(job.variants)
          ? (job.variants as Array<{ provider?: string; modelUsed?: string }>)
          : [];
        if (variants.length > 0) {
          for (const v of variants) {
            recordUsage(
              v.provider || v.modelUsed || job.provider || "openai",
              job.created_at,
            );
          }
        } else {
          recordUsage(
            job.model_used || job.provider || "openai",
            job.created_at,
          );
        }
      }
    }

    return NextResponse.json({
      health,
      envStatus,
      providerStats,
    });
  } catch (err) {
    console.error("[admin/ai-health GET] Error:", err);
    return NextResponse.json(
      { error: "No se pudo consultar el estado de los motores IA." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.action !== "resolve_alert") {
      return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const resolvedState: AiProviderHealthState = {
      ...DEFAULT_HEALTH,
      activeAlert: false,
      alertCount: 0,
      resolvedAt: nowIso,
      resolvedBy: admin.email,
    };

    if (isDatabaseConfigured()) {
      await prisma.platformSetting.upsert({
        where: { key: "AI_PROVIDER_HEALTH" },
        update: { value: resolvedState as any },
        create: {
          key: "AI_PROVIDER_HEALTH",
          value: resolvedState as any,
          category: "notifications",
          description:
            "Estado y alertas de créditos/cuota de los motores de IA (OpenAI / Gemini)",
        },
      });
    }

    return NextResponse.json({ ok: true, health: resolvedState });
  } catch (err) {
    console.error("[admin/ai-health POST] Error:", err);
    return NextResponse.json(
      { error: "No se pudo resolver la alerta." },
      { status: 500 },
    );
  }
}
