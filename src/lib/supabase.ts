import { createClient } from "@supabase/supabase-js";
import { Prisma } from "@prisma/client";
import {
  AIProviderId,
  GeneratedVariant,
  GenerationJob,
  GenerationJobSettings,
  JobStatus,
} from "./types";
import { prisma } from "./prisma";
import { externalizeBase64Image } from "./image-storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes("your-project") &&
  !supabaseKey.includes("your-"),
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const isDatabaseAvailable = () =>
  Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("your_"));

const isUuid = (val?: string | null): boolean =>
  Boolean(
    val &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val,
      ),
  );

// In-Memory store for fast live polling during generation
class LocalJobStore {
  private jobs = new Map<string, GenerationJob>();

  set(job: GenerationJob) {
    this.jobs.set(job.id, { ...job, updatedAt: new Date().toISOString() });
  }

  get(id: string): GenerationJob | undefined {
    return this.jobs.get(id);
  }

  update(
    id: string,
    updates: Partial<GenerationJob>,
  ): GenerationJob | undefined {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    const updated: GenerationJob = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, updated);
    return updated;
  }

  list(): GenerationJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}

// Global singleton in dev
const globalForJobs = globalThis as unknown as {
  localJobStore?: LocalJobStore;
};
export const localJobs = globalForJobs.localJobStore ?? new LocalJobStore();
if (process.env.NODE_ENV !== "production")
  globalForJobs.localJobStore = localJobs;

function mapDbRowToJob(row: {
  id: string;
  user_id: string | null;
  template_id: string;
  pet_name: string;
  species: string;
  pet_image_url: string;
  second_pet_image_url: string | null;
  custom_theme_image_url: string | null;
  custom_prompt: string | null;
  provider: string;
  model_used: string | null;
  status: string;
  progress: number;
  current_step: string;
  output_image_url: string | null;
  hd_output_image_url: string | null;
  variants: Prisma.JsonValue | null;
  error_message: string | null;
  settings: Prisma.JsonValue;
  execution_seconds: Prisma.Decimal | null;
  created_at: Date;
  updated_at: Date;
}): GenerationJob {
  const parsedVariants = Array.isArray(row.variants)
    ? (row.variants as unknown as GeneratedVariant[])
    : undefined;
  const parsedSettings =
    row.settings && typeof row.settings === "object" && !Array.isArray(row.settings)
      ? (row.settings as unknown as GenerationJobSettings)
      : undefined;

  return {
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    petName: row.pet_name,
    species: (["dog", "cat", "both", "other"].includes(row.species)
      ? row.species
      : "dog") as GenerationJob["species"],
    petImageUrl: row.pet_image_url,
    secondPetImageUrl: row.second_pet_image_url,
    customThemeImageUrl: row.custom_theme_image_url,
    customPrompt: row.custom_prompt,
    provider: (["openai", "gemini", "fal"].includes(row.provider)
      ? row.provider
      : "openai") as AIProviderId,
    modelUsed: row.model_used || undefined,
    status: row.status as JobStatus,
    progress: row.progress,
    currentStep: row.current_step,
    outputImageUrl: row.output_image_url,
    hdOutputImageUrl: row.hd_output_image_url,
    variants: parsedVariants,
    settings: parsedSettings,
    errorMessage: row.error_message,
    executionSeconds: row.execution_seconds
      ? Number(row.execution_seconds)
      : undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/**
 * Saves or updates a generation job in Local Store AND PostgreSQL (Prisma)
 * so completed creations, watermarked variants, and user customizations survive page refreshes.
 */
export async function saveJob(job: GenerationJob): Promise<void> {
  localJobs.set(job);

  if (!isDatabaseAvailable() || !isUuid(job.id)) {
    return;
  }

  try {
    // Externalize base64 pet photos to Supabase Storage once so DB rows stay lightweight
    let persistedPetImageUrl = job.petImageUrl;
    if (persistedPetImageUrl.startsWith("data:image/")) {
      const uploadedUrl = await externalizeBase64Image(
        persistedPetImageUrl,
        "pets",
      );
      if (uploadedUrl) {
        persistedPetImageUrl = uploadedUrl;
        job.petImageUrl = persistedPetImageUrl;
        localJobs.set(job);
      }
    }

    let persistedSecondPetUrl = job.secondPetImageUrl || null;
    if (persistedSecondPetUrl?.startsWith("data:image/")) {
      persistedSecondPetUrl = await externalizeBase64Image(
        persistedSecondPetUrl,
        "pets",
      );
      job.secondPetImageUrl = persistedSecondPetUrl;
    }

    let persistedCustomThemeUrl = job.customThemeImageUrl || null;
    if (persistedCustomThemeUrl?.startsWith("data:image/")) {
      persistedCustomThemeUrl = await externalizeBase64Image(
        persistedCustomThemeUrl,
        "characters",
      );
      job.customThemeImageUrl = persistedCustomThemeUrl;
    }

    const safeUserId = isUuid(job.userId) ? job.userId! : null;
    const variantsJson =
      Array.isArray(job.variants) && job.variants.length > 0
        ? (job.variants as unknown as Prisma.InputJsonValue)
        : undefined;
    const settingsJson =
      job.settings && typeof job.settings === "object"
        ? (job.settings as unknown as Prisma.InputJsonValue)
        : undefined;

    await prisma.generationJob.upsert({
      where: { id: job.id },
      create: {
        id: job.id,
        user_id: safeUserId,
        template_id: job.templateId,
        pet_name: job.petName || "Mi Mascota",
        species: job.species || "dog",
        pet_image_url: persistedPetImageUrl,
        second_pet_image_url: persistedSecondPetUrl,
        custom_theme_image_url: persistedCustomThemeUrl,
        custom_prompt: job.customPrompt || null,
        provider: job.provider || "openai",
        model_used: job.modelUsed || null,
        status: job.status,
        progress: job.progress,
        current_step: job.currentStep,
        output_image_url: job.outputImageUrl || null,
        hd_output_image_url: job.hdOutputImageUrl || null,
        variants: variantsJson ?? Prisma.JsonNull,
        error_message: job.errorMessage || null,
        settings: settingsJson ?? {},
        execution_seconds:
          typeof job.executionSeconds === "number"
            ? new Prisma.Decimal(job.executionSeconds.toFixed(2))
            : null,
      },
      update: {
        ...(safeUserId ? { user_id: safeUserId } : {}),
        template_id: job.templateId,
        pet_name: job.petName || "Mi Mascota",
        species: job.species || "dog",
        pet_image_url: persistedPetImageUrl,
        second_pet_image_url: persistedSecondPetUrl,
        custom_theme_image_url: persistedCustomThemeUrl,
        model_used: job.modelUsed || null,
        status: job.status,
        progress: job.progress,
        current_step: job.currentStep,
        output_image_url: job.outputImageUrl || null,
        hd_output_image_url: job.hdOutputImageUrl || null,
        ...(variantsJson !== undefined ? { variants: variantsJson } : {}),
        ...(settingsJson !== undefined ? { settings: settingsJson } : {}),
        error_message: job.errorMessage || null,
        execution_seconds:
          typeof job.executionSeconds === "number"
            ? new Prisma.Decimal(job.executionSeconds.toFixed(2))
            : null,
      },
    });
  } catch (err) {
    console.warn("Prisma saveJob warning (continuing with in-memory store):", err);
  }
}

/**
 * Retrieves a job by ID (live memory first, then PostgreSQL for full refresh/cross-session persistence)
 */
export async function getJobById(id: string): Promise<GenerationJob | null> {
  const localJob = localJobs.get(id);
  if (localJob) return localJob;

  if (!isDatabaseAvailable() || !isUuid(id)) {
    return null;
  }

  try {
    const row = await prisma.generationJob.findUnique({
      where: { id },
    });
    if (row) {
      return mapDbRowToJob(row);
    }
  } catch (err) {
    console.warn("Prisma getJobById warning:", err);
  }

  return null;
}

/**
 * Updates the saved studio customization settings (selected variant, size, frame, pet inscription,
 * productSlug for future products) on an existing GenerationJob.
 */
export async function updateJobSettings(
  id: string,
  partialSettings: GenerationJobSettings,
  userId?: string | null,
): Promise<GenerationJobSettings | null> {
  const existingLocal = localJobs.get(id);
  const mergedSettings: GenerationJobSettings = {
    ...(existingLocal?.settings || {}),
    ...partialSettings,
    updatedAt: new Date().toISOString(),
  };

  if (existingLocal) {
    localJobs.update(id, {
      settings: mergedSettings,
      ...(userId && !existingLocal.userId ? { userId } : {}),
    });
  }

  if (!isDatabaseAvailable() || !isUuid(id)) {
    return mergedSettings;
  }

  try {
    const current = await prisma.generationJob.findUnique({
      where: { id },
      select: { settings: true, user_id: true },
    });
    if (!current) return null;

    const currentSettings =
      current.settings &&
      typeof current.settings === "object" &&
      !Array.isArray(current.settings)
        ? (current.settings as unknown as GenerationJobSettings)
        : {};

    const nextSettings: GenerationJobSettings = {
      ...currentSettings,
      ...partialSettings,
      updatedAt: new Date().toISOString(),
    };

    const safeUserId =
      !current.user_id && isUuid(userId) ? userId! : undefined;

    await prisma.generationJob.update({
      where: { id },
      data: {
        settings: nextSettings as unknown as Prisma.InputJsonValue,
        ...(safeUserId ? { user_id: safeUserId } : {}),
        ...(typeof partialSettings.petInscriptionName === "string" &&
        partialSettings.petInscriptionName.trim()
          ? { pet_name: partialSettings.petInscriptionName.trim().slice(0, 40) }
          : {}),
      },
    });

    return nextSettings;
  } catch (err) {
    console.warn("Prisma updateJobSettings warning:", err);
    return mergedSettings;
  }
}

/**
 * Lists recent completed creations for an authenticated user (for cross-device cart/draft sync).
 */
export async function getRecentCompletedJobsByUser(
  userId: string,
  limit: number = 8,
): Promise<GenerationJob[]> {
  if (!isDatabaseAvailable() || !isUuid(userId)) {
    return [];
  }

  try {
    const rows = await prisma.generationJob.findMany({
      where: {
        user_id: userId,
        status: "completed",
        output_image_url: { not: null },
        orderItems: { none: {} },
      },
      orderBy: { updated_at: "desc" },
      take: limit,
    });
    return rows.map(mapDbRowToJob);
  } catch (err) {
    console.warn("Prisma getRecentCompletedJobsByUser warning:", err);
    return [];
  }
}
