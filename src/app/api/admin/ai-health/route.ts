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

    const qualityAnalytics = {
      winRate: {
        openai: {
          selectedCount: 0,
          purchasedCount: 0,
          avgQualityScore: null as number | null,
          evaluatedCount: 0,
          autoRetriedCount: 0,
        },
        gemini: {
          selectedCount: 0,
          purchasedCount: 0,
          avgQualityScore: null as number | null,
          evaluatedCount: 0,
          autoRetriedCount: 0,
        },
      },
      feedbackSummary: {
        no_match_pet: 0,
        bad_proportions: 0,
        too_dark: 0,
        cropped_ears: 0,
      } as Record<string, number>,
      topCharacters: [] as Array<{
        templateId: string;
        totalJobs: number;
        openaiWins: number;
        geminiWins: number;
        avgScore: number | null;
        feedbackCount: number;
      }>,
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

      const [jobs, purchasedItems] = await Promise.all([
        prisma.generationJob
          .findMany({
            where: { status: "completed" },
            select: {
              id: true,
              template_id: true,
              provider: true,
              model_used: true,
              variants: true,
              settings: true,
              created_at: true,
            },
            orderBy: { created_at: "desc" },
            take: 5000,
          })
          .catch(() => []),
        prisma.orderItem
          .findMany({
            where: { generation_job_id: { not: null } },
            select: { generation_job_id: true },
          })
          .catch(() => []),
      ]);

      const purchasedJobIds = new Set<string>(
        purchasedItems
          .map((i) => i.generation_job_id)
          .filter((id): id is string => Boolean(id)),
      );

      const scoreSums = { openai: 0, gemini: 0 };
      const charMap = new Map<
        string,
        {
          totalJobs: number;
          openaiWins: number;
          geminiWins: number;
          scoreSum: number;
          scoreCount: number;
          feedbackCount: number;
        }
      >();

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
          ? (job.variants as Array<{
              id?: string;
              provider?: string;
              modelUsed?: string;
              qualityScore?: number;
              wasAutoRetried?: boolean;
            }>)
          : [];
        const settings = (job.settings || {}) as Record<string, any>;
        const selectedVariantId = settings?.selectedVariantId || null;
        const tplId = job.template_id || "unknown";

        if (!charMap.has(tplId)) {
          charMap.set(tplId, {
            totalJobs: 0,
            openaiWins: 0,
            geminiWins: 0,
            scoreSum: 0,
            scoreCount: 0,
            feedbackCount: 0,
          });
        }
        const charEntry = charMap.get(tplId)!;
        charEntry.totalJobs += 1;

        const fbReason = settings?.feedback?.reason;
        if (
          typeof fbReason === "string" &&
          fbReason in qualityAnalytics.feedbackSummary
        ) {
          qualityAnalytics.feedbackSummary[fbReason] += 1;
          charEntry.feedbackCount += 1;
        }

        if (variants.length > 0) {
          for (const v of variants) {
            const provRaw = (
              v.provider ||
              v.modelUsed ||
              job.provider ||
              "openai"
            ).toLowerCase();
            recordUsage(provRaw, job.created_at);

            const provKey = provRaw.includes("gemini")
              ? "gemini"
              : provRaw.includes("openai") || provRaw.includes("óleo")
                ? "openai"
                : null;

            if (provKey) {
              if (typeof v.qualityScore === "number" && v.qualityScore > 0) {
                scoreSums[provKey] += v.qualityScore;
                qualityAnalytics.winRate[provKey].evaluatedCount += 1;
                charEntry.scoreSum += v.qualityScore;
                charEntry.scoreCount += 1;
              }
              if (v.wasAutoRetried) {
                qualityAnalytics.winRate[provKey].autoRetriedCount += 1;
              }
              if (selectedVariantId && v.id === selectedVariantId) {
                qualityAnalytics.winRate[provKey].selectedCount += 1;
                if (provKey === "openai") charEntry.openaiWins += 1;
                if (provKey === "gemini") charEntry.geminiWins += 1;
                if (purchasedJobIds.has(job.id)) {
                  qualityAnalytics.winRate[provKey].purchasedCount += 1;
                }
              }
            }
          }
        } else {
          recordUsage(
            job.model_used || job.provider || "openai",
            job.created_at,
          );
        }
      }

      if (qualityAnalytics.winRate.openai.evaluatedCount > 0) {
        qualityAnalytics.winRate.openai.avgQualityScore =
          Math.round(
            (scoreSums.openai /
              qualityAnalytics.winRate.openai.evaluatedCount) *
              10,
          ) / 10;
      }
      if (qualityAnalytics.winRate.gemini.evaluatedCount > 0) {
        qualityAnalytics.winRate.gemini.avgQualityScore =
          Math.round(
            (scoreSums.gemini /
              qualityAnalytics.winRate.gemini.evaluatedCount) *
              10,
          ) / 10;
      }

      qualityAnalytics.topCharacters = Array.from(charMap.entries())
        .map(([templateId, c]) => ({
          templateId,
          totalJobs: c.totalJobs,
          openaiWins: c.openaiWins,
          geminiWins: c.geminiWins,
          avgScore:
            c.scoreCount > 0
              ? Math.round((c.scoreSum / c.scoreCount) * 10) / 10
              : null,
          feedbackCount: c.feedbackCount,
        }))
        .sort((a, b) => b.totalJobs - a.totalJobs)
        .slice(0, 8);
    }

    return NextResponse.json({
      health,
      envStatus,
      providerStats,
      qualityAnalytics,
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
