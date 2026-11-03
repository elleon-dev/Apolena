import { createClient } from "@supabase/supabase-js";
import { GenerationJob } from "./types";

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

// In-Memory store for development and standalone preview
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

/**
 * Saves or updates a generation job in either Supabase or Local Store
 */
export async function saveJob(job: GenerationJob): Promise<void> {
  localJobs.set(job);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("generation_jobs").upsert({
        id: job.id,
        user_id: job.userId || null,
        template_id: job.templateId,
        pet_name: job.petName,
        species: job.species,
        pet_image_url: job.petImageUrl,
        status: job.status,
        progress: job.progress,
        current_step: job.currentStep,
        output_image_url: job.outputImageUrl || null,
        hd_output_image_url: job.hdOutputImageUrl || null,
        fal_request_id: job.falRequestId || null,
        error_message: job.errorMessage || null,
        execution_seconds: job.executionSeconds || null,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
      });
    } catch (err) {
      console.warn("Supabase save error (falling back to memory):", err);
    }
  }
}

/**
 * Retrieves a job by ID
 */
export async function getJobById(id: string): Promise<GenerationJob | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("generation_jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          templateId: data.template_id,
          petName: data.pet_name,
          species: data.species,
          petImageUrl: data.pet_image_url,
          provider: data.provider || "openai",
          status: data.status,
          progress: data.progress,
          currentStep: data.current_step,
          outputImageUrl: data.output_image_url,
          hdOutputImageUrl: data.hd_output_image_url,
          falRequestId: data.fal_request_id,
          errorMessage: data.error_message,
          executionSeconds: data.execution_seconds,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("Supabase fetch error:", err);
    }
  }

  return localJobs.get(id) || null;
}
