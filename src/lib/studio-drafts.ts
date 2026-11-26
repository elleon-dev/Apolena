import type { GeneratedVariant, GenerationJob } from "./types";

const SAVED_CREATIONS_KEY = "apolena_saved_creations_v1";
const ACTIVE_CREATION_ID_KEY = "apolena_active_creation_id_v1";
const MAX_SAVED_CREATIONS = 8;

export interface SavedStudioCreation {
  jobId: string;
  characterId: string;
  characterName: string;
  petImageUrl: string;
  secondPetImageUrl?: string | null;
  petSpecies: "dog" | "cat" | "other";
  fusedResultUrl: string;
  variants: GeneratedVariant[];
  selectedVariantId: string | null;
  selectedPrintPresetId?: string | null;
  selectedFrameId?: string | null;
  includePetInscription: boolean;
  petInscriptionName: string;
  dedicationNote?: string;
  productSlug: string;
  updatedAt: string;
}

export function loadSavedCreations(): SavedStudioCreation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_CREATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedStudioCreation =>
        Boolean(item && typeof item.jobId === "string" && item.fusedResultUrl),
    );
  } catch {
    return [];
  }
}

function persistSavedCreations(list: SavedStudioCreation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVED_CREATIONS_KEY, JSON.stringify(list));
  } catch {
    // If localStorage quota is tight (e.g. legacy base64), store lighter entries without large data URLs
    try {
      const compact = list.slice(0, 4).map((item) => ({
        ...item,
        petImageUrl: item.petImageUrl.startsWith("data:")
          ? ""
          : item.petImageUrl,
        secondPetImageUrl: item.secondPetImageUrl?.startsWith("data:")
          ? null
          : item.secondPetImageUrl,
      }));
      window.localStorage.setItem(SAVED_CREATIONS_KEY, JSON.stringify(compact));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
}

export function upsertSavedCreation(
  creation: SavedStudioCreation,
): SavedStudioCreation[] {
  const existing = loadSavedCreations();
  const filtered = existing.filter((c) => c.jobId !== creation.jobId);
  const next = [creation, ...filtered].slice(0, MAX_SAVED_CREATIONS);
  persistSavedCreations(next);
  return next;
}

export function removeSavedCreation(jobId: string): SavedStudioCreation[] {
  const existing = loadSavedCreations();
  const next = existing.filter((c) => c.jobId !== jobId);
  persistSavedCreations(next);
  if (getActiveCreationId() === jobId) {
    setActiveCreationId(next[0]?.jobId || null);
  }
  return next;
}

export function getActiveCreationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_CREATION_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveCreationId(jobId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (jobId) {
      window.localStorage.setItem(ACTIVE_CREATION_ID_KEY, jobId);
    } else {
      window.localStorage.removeItem(ACTIVE_CREATION_ID_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function mapJobToSavedCreation(
  job: GenerationJob,
  resolveCharacterName?: (templateId: string) => string,
): SavedStudioCreation | null {
  if (job.status !== "completed") return null;
  const variants = Array.isArray(job.variants) ? job.variants : [];
  const selectedVariantId =
    job.settings?.selectedVariantId || variants[0]?.id || null;
  const activeVariant =
    variants.find((v) => v.id === selectedVariantId) || variants[0];
  const fusedResultUrl = activeVariant?.imageUrl || job.outputImageUrl || "";
  if (!fusedResultUrl) return null;

  const normalizedSpecies: "dog" | "cat" | "other" =
    job.species === "cat"
      ? "cat"
      : job.species === "other"
        ? "other"
        : "dog";

  const inscriptionName =
    typeof job.settings?.petInscriptionName === "string"
      ? job.settings.petInscriptionName
      : job.petName && job.petName !== "Mi Mascota" && job.petName !== "Mascota"
        ? job.petName
        : "";

  return {
    jobId: job.id,
    characterId: job.templateId,
    characterName: resolveCharacterName
      ? resolveCharacterName(job.templateId)
      : job.templateId,
    petImageUrl: job.petImageUrl || "",
    secondPetImageUrl: job.secondPetImageUrl || null,
    petSpecies: normalizedSpecies,
    fusedResultUrl,
    variants:
      variants.length > 0
        ? variants
        : [
            {
              id: "variant-1",
              provider: job.provider || "openai",
              providerTitle: "Propuesta 1 · Óleo Fine Art",
              modelUsed: job.modelUsed || "Técnica Óleo Bellas Artes",
              imageUrl: fusedResultUrl,
              executionSeconds: job.executionSeconds || 0,
            },
          ],
    selectedVariantId,
    selectedPrintPresetId: job.settings?.selectedPrintPresetId || null,
    selectedFrameId: job.settings?.selectedFrameId || null,
    includePetInscription: Boolean(
      job.settings?.includePetInscription ?? Boolean(inscriptionName),
    ),
    petInscriptionName: inscriptionName,
    dedicationNote: job.settings?.dedicationNote || "",
    productSlug: job.settings?.productSlug || "cuadros-personalizados",
    updatedAt: job.settings?.updatedAt || job.updatedAt || job.createdAt,
  };
}
