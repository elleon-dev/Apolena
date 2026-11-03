export type JobStatus =
  | "pending"
  | "processing"
  | "inpainting"
  | "upscaling"
  | "completed"
  | "failed";

export type AIProviderId = "openai" | "gemini" | "fal";

export interface AIProviderInfo {
  id: AIProviderId;
  name: string;
  modelName: string;
  badge: string;
  description: string;
  supportsMultiPet: boolean;
  supportsCustomThemeImage: boolean;
  envKeyName: string;
}

export const AI_PROVIDERS: AIProviderInfo[] = [
  {
    id: "openai",
    name: "OpenAI Studio",
    modelName: "gpt-image-1.5 (Medium · ~$0.04)",
    badge: "Recomendado",
    description:
      "Integra 1 o 2 mascotas junto con la imagen de referencia manteniendo el pelaje, manchas y facciones reales a bajo costo.",
    supportsMultiPet: true,
    supportsCustomThemeImage: true,
    envKeyName: "OPENAI_API_KEY",
  },
  {
    id: "gemini",
    name: "Google Gemini Studio",
    modelName: "gemini-2.5-flash-image (~$0.039)",
    badge: "Más Económico",
    description:
      "Composición fotográfica ultrarrápida a partir de múltiples imágenes de referencia con preservación natural de iluminación.",
    supportsMultiPet: true,
    supportsCustomThemeImage: true,
    envKeyName: "GEMINI_API_KEY",
  },
  {
    id: "fal",
    name: "FLUX Kontext Studio",
    modelName: "FLUX.1 Kontext Pro (~$0.04)",
    badge: "Alternativo",
    description:
      "Fusión de referencias fotográficas con acabado de estudio para impresión en lienzo.",
    supportsMultiPet: true,
    supportsCustomThemeImage: true,
    envKeyName: "FAL_KEY",
  },
];

export interface ApiKeysOverride {
  openaiKey?: string;
  geminiKey?: string;
  falKey?: string;
}

export interface GeneratedVariant {
  id: string;
  provider: AIProviderId;
  providerTitle: string;
  modelUsed: string;
  imageUrl: string;
  executionSeconds: number;
}

export interface GenerationJob {
  id: string;
  userId?: string | null;
  templateId: string;
  petName: string;
  species: "dog" | "cat" | "both";
  petImageUrl: string;
  secondPetImageUrl?: string | null;
  customThemeImageUrl?: string | null;
  customPrompt?: string | null;
  provider: AIProviderId;
  modelUsed?: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
  outputImageUrl?: string | null;
  hdOutputImageUrl?: string | null;
  variants?: GeneratedVariant[];
  falRequestId?: string | null;
  falUpscaleRequestId?: string | null;
  errorMessage?: string | null;
  executionSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  estimatedSeconds: number;
  stage: "analyzing" | "lighting" | "inpainting" | "upscaling" | "finishing";
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "step_1",
    label: "Reconocimiento de facciones",
    description:
      "Identificando patrones de pelaje, color de ojos y fisonomía de cada mascota...",
    estimatedSeconds: 3,
    stage: "analyzing",
  },
  {
    id: "step_2",
    label: "Composición de vestuario y escena",
    description:
      "Armonizando atuendo, texturas textiles, fondo escénico e iluminación...",
    estimatedSeconds: 4,
    stage: "lighting",
  },
  {
    id: "step_3",
    label: "Revelado del retrato fotográfico",
    description:
      "Integrando a tus mascotas en la escena con proporción y luz natural...",
    estimatedSeconds: 8,
    stage: "inpainting",
  },
  {
    id: "step_4",
    label: "Acabado de detalle en alta definición",
    description:
      "Refinando textura de pelaje, brillo ocular y profundidad de campo...",
    estimatedSeconds: 4,
    stage: "upscaling",
  },
  {
    id: "step_5",
    label: "Preparación de archivo final",
    description:
      "Generando retrato en alta resolución listo para descarga o impresión...",
    estimatedSeconds: 2,
    stage: "finishing",
  },
];
