import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { isAdminRole } from "@/lib/auth";
import { getAuthoritativeSessionUser } from "@/lib/db-service";

export const dynamic = "force-dynamic";

const DEFAULT_RETENTION_DAYS = 30;
const MIN_RETENTION_DAYS = 7;
const DEFAULT_BATCH_LIMIT = 100;

/**
 * Extrae { bucket, path } de una URL pública o firmada de Supabase Storage.
 * Ignora URLs externas, data URIs y rutas estáticas de /samples o /images.
 */
function extractSupabaseStorageTarget(
  url?: string | null,
): { bucket: string; path: string } | null {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
  const match = url.match(
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?.*)?$/,
  );
  if (!match) return null;
  const bucket = decodeURIComponent(match[1]);
  const filePath = decodeURIComponent(match[2]);
  if (!bucket || !filePath) return null;
  // Proteger carpetas del catálogo (personajes / marcos) para jamás borrar activos de tienda
  if (
    filePath.startsWith("characters/") ||
    filePath.startsWith("frames/") ||
    filePath.startsWith("catalog/")
  ) {
    return null;
  }
  return { bucket, path: filePath };
}

function collectJobStorageTargets(job: {
  pet_image_url: string | null;
  second_pet_image_url: string | null;
  output_image_url: string | null;
  hd_output_image_url: string | null;
  variants: unknown;
  settings: unknown;
}): Array<{ bucket: string; path: string }> {
  const urls = new Set<string>();
  const addUrl = (val: unknown) => {
    if (typeof val === "string" && val.startsWith("http")) {
      urls.add(val);
    }
  };

  addUrl(job.pet_image_url);
  addUrl(job.second_pet_image_url);
  addUrl(job.output_image_url);
  addUrl(job.hd_output_image_url);

  if (Array.isArray(job.variants)) {
    for (const v of job.variants as Array<{ imageUrl?: string }>) {
      addUrl(v?.imageUrl);
    }
  }

  if (job.settings && typeof job.settings === "object") {
    const settingsObj = job.settings as Record<string, unknown>;
    const masterVariants = settingsObj.master_variants;
    if (masterVariants && typeof masterVariants === "object") {
      for (const val of Object.values(
        masterVariants as Record<string, unknown>,
      )) {
        addUrl(val);
      }
    }
  }

  const targets: Array<{ bucket: string; path: string }> = [];
  for (const url of Array.from(urls)) {
    const parsed = extractSupabaseStorageTarget(url);
    if (parsed) targets.push(parsed);
  }
  return targets;
}

/**
 * Cron de limpieza automática de retratos NO comprados con más de 30 días.
 * - Jamás elimina retratos asociados a una orden (`orderItems: { none: {} }`).
 * - Limpia archivos en Supabase Storage (fotos de mascota, previews y maestros HD)
 *   y luego borra el registro de `generation_jobs`.
 * - Invocable por Vercel Cron (Authorization: Bearer <CRON_SECRET>) o por Admin.
 */
export async function GET(req: Request) {
  return handleCleanup(req);
}

export async function POST(req: Request) {
  return handleCleanup(req);
}

async function handleCleanup(req: Request) {
  try {
    const url = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET?.trim();
    const querySecret = url.searchParams.get("secret");
    const authHeader = req.headers.get("authorization");
    const bearerSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    const hasValidCronSecret = Boolean(
      cronSecret &&
        cronSecret !== "your-cron-secret-change-me" &&
        (bearerSecret === cronSecret || querySecret === cronSecret),
    );

    if (!hasValidCronSecret) {
      const adminUser = await getAuthoritativeSessionUser(req).catch(
        () => null,
      );
      if (!adminUser || !isAdminRole(adminUser.role)) {
        return NextResponse.json(
          { error: "No autorizado. Se requiere CRON_SECRET o sesión Admin." },
          { status: 401 },
        );
      }
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 500 },
      );
    }

    const envDays = Number(process.env.UNPURCHASED_JOB_RETENTION_DAYS);
    const queryDays = Number(url.searchParams.get("days"));
    const requestedDays = Number.isFinite(queryDays) && queryDays > 0
      ? queryDays
      : Number.isFinite(envDays) && envDays > 0
        ? envDays
        : DEFAULT_RETENTION_DAYS;
    const retentionDays = Math.max(MIN_RETENTION_DAYS, Math.floor(requestedDays));

    const limitParam = Number(url.searchParams.get("limit"));
    const batchLimit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(250, Math.floor(limitParam))
        : DEFAULT_BATCH_LIMIT;

    const dryRun = url.searchParams.get("dryRun") === "1";
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    );

    // Seleccionar EXCLUSIVAMENTE jobs antiguos SIN ninguna orden asociada
    const staleJobs = await prisma.generationJob.findMany({
      where: {
        created_at: { lt: cutoffDate },
        orderItems: { none: {} },
      },
      select: {
        id: true,
        pet_image_url: true,
        second_pet_image_url: true,
        output_image_url: true,
        hd_output_image_url: true,
        variants: true,
        settings: true,
      },
      orderBy: { created_at: "asc" },
      take: batchLimit,
    });

    const bucketFilesMap = new Map<string, Set<string>>();
    for (const job of staleJobs) {
      for (const target of collectJobStorageTargets(job)) {
        if (!bucketFilesMap.has(target.bucket)) {
          bucketFilesMap.set(target.bucket, new Set());
        }
        bucketFilesMap.get(target.bucket)!.add(target.path);
      }
    }

    let totalStorageCandidates = 0;
    for (const paths of Array.from(bucketFilesMap.values())) {
      totalStorageCandidates += paths.size;
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        jobsFound: staleJobs.length,
        storageFilesCandidates: totalStorageCandidates,
      });
    }

    // 1. Eliminar archivos en Supabase Storage por bucket
    let storageFilesRemoved = 0;
    const storageErrors: string[] = [];

    if (isSupabaseConfigured && supabase && totalStorageCandidates > 0) {
      for (const [bucket, pathSet] of Array.from(bucketFilesMap.entries())) {
        const paths: string[] = Array.from(pathSet);
        // Borrar en lotes de 100 (límite recomendado por Supabase Storage)
        for (let i = 0; i < paths.length; i += 100) {
          const chunk = paths.slice(i, i + 100);
          const { error } = await supabase.storage.from(bucket).remove(chunk);
          if (error) {
            storageErrors.push(`${bucket}: ${error.message}`);
          } else {
            storageFilesRemoved += chunk.length;
          }
        }
      }
    }

    // 2. Eliminar registros de generation_jobs en PostgreSQL
    let jobsDeleted = 0;
    if (staleJobs.length > 0) {
      const result = await prisma.generationJob.deleteMany({
        where: {
          id: { in: staleJobs.map((j) => j.id) },
          orderItems: { none: {} },
        },
      });
      jobsDeleted = result.count;
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      jobsFound: staleJobs.length,
      jobsDeleted,
      storageFilesRemoved,
      storageErrors: storageErrors.length > 0 ? storageErrors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[cron/cleanup-unpurchased-jobs] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno en limpieza automática." },
      { status: 500 },
    );
  }
}
