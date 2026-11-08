import { AIProviderId, ApiKeysOverride, GenerationJob } from "./types";
import { FAMOUS_CHARACTERS } from "@/data/characters";
import { getWallArtCharacterById } from "./db-service";
import { runMultiModelFusionPipeline } from "./ai-providers";
import { saveJob, localJobs } from "./supabase";
import { protectAndStoreJobVariants } from "./server-watermark";

export interface EnqueueJobParams {
  jobId: string;
  characterId: string;
  petImageUrl: string;
  secondPetImageUrl?: string | null;
  customThemeImageUrl?: string | null;
  customPrompt?: string | null;
  provider?: AIProviderId;
  apiKeys?: ApiKeysOverride;
  petName?: string;
  species?: "dog" | "cat" | "both";
}

// Store transient API keys in memory per job (never persisted to database)
const jobApiKeysMap = new Map<string, ApiKeysOverride>();

export async function processGenerationJob(jobId: string): Promise<void> {
  const job = localJobs.get(jobId);
  if (!job) {
    console.error(`[QueueWorker] Job ${jobId} not found`);
    return;
  }

  const character =
    (await getWallArtCharacterById(job.templateId)) || FAMOUS_CHARACTERS[0];
  const apiKeys = jobApiKeysMap.get(jobId);

  try {
    // 1. Processing
    await saveJob({
      ...job,
      status: "processing",
      progress: 10,
      currentStep: `Iniciando composición artística con ${character.name}...`,
    });

    // 2. Execute multi-model pipeline with callbacks
    const result = await runMultiModelFusionPipeline({
      petImageUrl: job.petImageUrl,
      secondPetImageUrl: job.secondPetImageUrl,
      characterInput: character,
      customThemeImageUrl: job.customThemeImageUrl,
      customPrompt: job.customPrompt,
      provider: job.provider,
      apiKeys,
      onProgress: async (progress, stepLabel, stage) => {
        const statusMap: Record<string, GenerationJob["status"]> = {
          analyzing: "processing",
          lighting: "processing",
          inpainting: "inpainting",
          upscaling: "upscaling",
          finishing: "processing",
        };

        const currentJob = localJobs.get(jobId) || job;
        await saveJob({
          ...currentJob,
          status: statusMap[stage] || "processing",
          progress,
          currentStep: stepLabel,
        });
      },
    });

    // 3. Burn server-side Apolena watermark onto client previews and lock clean HD masters in server vault
    const protectedArt = await protectAndStoreJobVariants(
      jobId,
      result.variants,
    );

    // 4. Completed (client receives only watermarked previews; hdOutputImageUrl is stored in DB/vault for workshop & post-payment unlock)
    const currentJob = localJobs.get(jobId) || job;
    await saveJob({
      ...currentJob,
      status: "completed",
      progress: 100,
      currentStep: "¡Retrato revelado con éxito!",
      outputImageUrl: protectedArt.watermarkedOutputUrl,
      hdOutputImageUrl: protectedArt.masterOutputUrl,
      variants: protectedArt.watermarkedVariants,
      modelUsed: result.modelUsed,
      executionSeconds: result.executionSeconds,
    });

    jobApiKeysMap.delete(jobId);
    console.log(
      `[QueueWorker] Job ${jobId} (${result.modelUsed}) finished in ${result.executionSeconds}s`,
    );
  } catch (error: any) {
    jobApiKeysMap.delete(jobId);
    console.error(`[QueueWorker] Job ${jobId} failed:`, error);
    const currentJob = localJobs.get(jobId) || job;
    await saveJob({
      ...currentJob,
      status: "failed",
      progress: 0,
      currentStep: "Error durante la fusión",
      errorMessage:
        error?.message || "Ocurrió un error al fusionar las imágenes",
    });
  }
}

export async function enqueueJob(
  params: EnqueueJobParams,
): Promise<GenerationJob> {
  const newJob: GenerationJob = {
    id: params.jobId,
    templateId: params.characterId,
    petName: params.petName || "Mi Mascota",
    species: params.species || "cat",
    petImageUrl: params.petImageUrl,
    secondPetImageUrl: params.secondPetImageUrl || null,
    customThemeImageUrl: params.customThemeImageUrl || null,
    customPrompt: params.customPrompt || null,
    provider: params.provider || "openai",
    status: "pending",
    progress: 5,
    currentStep: "Encolando fusión multimodal de imágenes...",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (params.apiKeys) {
    jobApiKeysMap.set(params.jobId, params.apiKeys);
  }

  await saveJob(newJob);

  setTimeout(() => {
    processGenerationJob(params.jobId).catch((err) => {
      console.error(`Error processing job ${params.jobId}:`, err);
    });
  }, 100);

  return newJob;
}
