"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { FAMOUS_CHARACTERS, FamousCharacter } from "@/data/characters";
import {
  AIProviderId,
  AI_PROVIDERS,
  ApiKeysOverride,
  GeneratedVariant,
} from "@/lib/types";
import {
  PRINT_PRESETS,
  PrintPreset,
  PrintFinishMode,
  exportPrintReadyImage,
} from "@/lib/print-export";
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  Download,
  ZoomIn,
  Columns,
  ShieldCheck,
  Maximize2,
  AlertCircle,
  Plus,
  Trash2,
  KeyRound,
  SlidersHorizontal,
  ImagePlus,
  X,
  ExternalLink,
  FileText,
  Dog,
  Cat,
  PawPrint,
  Camera,
  CheckCircle2,
  MoveHorizontal,
  Layers,
  Loader2,
  Printer,
  Frame,
} from "lucide-react";

export default function Home() {
  // 3-step state: 1 = Upload Pet(s), 2 = Choose Theme & Studio Engine, 3 = Result Portrait
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Pet Images (1 mandatory, 2nd optional for duo portrait)
  const [petImage, setPetImage] = useState<string | null>(null);
  const [secondPetImage, setSecondPetImage] = useState<string | null>(null);

  // Theme selection (Catalog or Custom uploaded reference image)
  const [selectedCharacter, setSelectedCharacter] = useState<FamousCharacter>(
    FAMOUS_CHARACTERS[0],
  );
  const [customThemeImage, setCustomThemeImage] = useState<string | null>(null);
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // Multi-Model Provider selection
  const [selectedProvider, setSelectedProvider] =
    useState<AIProviderId>("openai");
  const [apiKeys, setApiKeys] = useState<ApiKeysOverride>({
    openaiKey: "",
    geminiKey: "",
    falKey: "",
  });
  const [envStatus, setEnvStatus] = useState<{
    openai: boolean;
    gemini: boolean;
    fal: boolean;
  }>({
    openai: false,
    gemini: false,
    fal: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Generation / Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStepMessage, setGenerationStepMessage] = useState("");
  const [fusedResultUrl, setFusedResultUrl] = useState<string>("");
  const [generatedVariants, setGeneratedVariants] = useState<
    GeneratedVariant[]
  >([]);
  const [selectedVariantId, setSelectedVariantId] =
    useState<string>("variant-openai");
  const [modelUsedLabel, setModelUsedLabel] = useState<string>(
    "OpenAI Studio & Gemini Studio",
  );
  const [executionSeconds, setExecutionSeconds] = useState(12.4);
  const [fusionError, setFusionError] = useState<string | null>(null);

  // Result Viewer state
  const [viewMode, setViewMode] = useState<"fusion" | "compare">("fusion");
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Print Size & Finish Export state (ordered from Largest XL to Smallest S)
  const [selectedPrintPreset, setSelectedPrintPreset] = useState<PrintPreset>(
    PRINT_PRESETS[0],
  );
  const [printFinishMode, setPrintFinishMode] =
    useState<PrintFinishMode>("full-bleed");
  const [isExportingPrint, setIsExportingPrint] = useState(false);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved API keys from localStorage & check server .env status
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apolena_api_keys");
      if (saved) {
        const parsed = JSON.parse(saved);
        setApiKeys(parsed);
      }
      const savedProvider = localStorage.getItem(
        "apolena_provider",
      ) as AIProviderId | null;
      if (
        savedProvider &&
        ["openai", "gemini", "fal"].includes(savedProvider)
      ) {
        setSelectedProvider(savedProvider);
      }
    } catch (e) {}

    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => {
        if (data?.envConfigured) {
          setEnvStatus(data.envConfigured);
        }
      })
      .catch(() => {});
  }, []);

  const saveApiKeysToStorage = (updated: ApiKeysOverride) => {
    setApiKeys(updated);
    try {
      localStorage.setItem("apolena_api_keys", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSelectProvider = (provider: AIProviderId) => {
    setSelectedProvider(provider);
    setFusionError(null);
    try {
      localStorage.setItem("apolena_provider", provider);
    } catch (e) {}
  };

  const isProviderConfigured = (provider: AIProviderId): boolean => {
    if (provider === "openai")
      return Boolean(apiKeys.openaiKey?.trim() || envStatus.openai);
    if (provider === "gemini")
      return Boolean(apiKeys.geminiKey?.trim() || envStatus.gemini);
    if (provider === "fal")
      return Boolean(apiKeys.falKey?.trim() || envStatus.fal);
    return false;
  };

  // Compress & read uploaded image file into base64 data URL
  const readAndCompressImage = useCallback(
    (file: File, onDone: (dataUrl: string) => void) => {
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona una imagen válida (JPG, PNG o WEBP).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          // 1024px matches the native single-tile resolution of OpenAI/Gemini vision encoders, avoiding 4x multi-tile token charges
          const maxDim = 1024;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
            onDone(dataUrl);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  // Quick Demo Presets
  const loadDemoIncaTwoCats = () => {
    setPetImage("/samples/cat-sample.jpg");
    setSecondPetImage("/samples/cat-suit.jpg");
    setSelectedCharacter(FAMOUS_CHARACTERS[0]);
    setUseCustomTheme(false);
  };

  const loadDemoDog = () => {
    setPetImage("/samples/dog-sample.jpg");
    setSecondPetImage(null);
  };

  const loadDemoCat = () => {
    setPetImage("/samples/cat-sample.jpg");
    setSecondPetImage(null);
  };

  // Start Portrait Generation
  const handleStartFusion = async () => {
    if (!petImage) return;

    setIsGenerating(true);
    setFusionError(null);
    setGenerationProgress(10);
    setGenerationStepMessage(
      "Preparando fotografías y referencias de estudio...",
    );

    try {
      const isCat = petImage.includes("cat") || petImage.includes("gato");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          petImageUrl: petImage,
          secondPetImageUrl: secondPetImage,
          customThemeImageUrl: useCustomTheme ? customThemeImage : null,
          customPrompt: customPrompt.trim() || null,
          provider: selectedProvider,
          apiKeys,
          petName: secondPetImage ? "Dúo de Mascotas" : "Mascota",
          species: isCat ? "cat" : "dog",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.jobId) {
        throw new Error(
          data.error || "No se pudo iniciar el revelado del retrato",
        );
      }

      const jobId = data.jobId;

      const handleJobCompletion = (job: any) => {
        if (Array.isArray(job.variants) && job.variants.length > 0) {
          setGeneratedVariants(job.variants);
          setSelectedVariantId(job.variants[0].id);
          setFusedResultUrl(job.variants[0].imageUrl);
          setModelUsedLabel(job.variants[0].modelUsed);
        } else {
          const finalUrl =
            job.hdOutputImageUrl ||
            job.outputImageUrl ||
            selectedCharacter.fusionSampleUrl;
          setFusedResultUrl(finalUrl);
          if (job.modelUsed) setModelUsedLabel(job.modelUsed);
        }
        if (job.executionSeconds) setExecutionSeconds(job.executionSeconds);
        setIsGenerating(false);
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      const runPollingFallback = () => {
        const interval = setInterval(async () => {
          try {
            const res = await fetch(`/api/jobs/${jobId}`);
            const resData = await res.json();
            if (resData.job) {
              setGenerationProgress(resData.job.progress);
              setGenerationStepMessage(resData.job.currentStep);
              if (resData.job.status === "completed") {
                clearInterval(interval);
                handleJobCompletion(resData.job);
              } else if (resData.job.status === "failed") {
                clearInterval(interval);
                setIsGenerating(false);
                setFusionError(
                  resData.job.errorMessage ||
                    "Error en el servicio de generación",
                );
              }
            }
          } catch (err) {
            clearInterval(interval);
            setIsGenerating(false);
            setFusionError(
              "Error de conexión verificando el estado del retrato.",
            );
          }
        }, 1000);
      };

      try {
        const eventSource = new EventSource(`/api/jobs/${jobId}/events`);
        eventSource.onmessage = (event) => {
          const job = JSON.parse(event.data);
          setGenerationProgress(job.progress);
          setGenerationStepMessage(job.currentStep);

          if (job.status === "completed") {
            eventSource.close();
            handleJobCompletion(job);
          } else if (job.status === "failed") {
            eventSource.close();
            setIsGenerating(false);
            setFusionError(
              job.errorMessage || "Error en el servicio de generación",
            );
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          runPollingFallback();
        };
      } catch (e) {
        runPollingFallback();
      }
    } catch (err: any) {
      console.error("Error starting fusion:", err);
      setIsGenerating(false);
      setFusionError(err?.message || "Error al iniciar la composición");
    }
  };

  const handleDownload = async (presetOverride?: PrintPreset) => {
    const targetPreset = presetOverride || selectedPrintPreset;
    const sourceUrl = fusedResultUrl || selectedCharacter.fusionSampleUrl;
    if (!sourceUrl) return;

    setIsExportingPrint(true);
    try {
      const exported = await exportPrintReadyImage(
        sourceUrl,
        targetPreset,
        printFinishMode,
      );
      const cleanSize = targetPreset.label
        .replace(/\s+/g, "")
        .replace("×", "x");
      const link = document.createElement("a");
      link.href = exported.dataUrl;
      link.download = `Apolena-Cuadro-${cleanSize}-${targetPreset.dpi}DPI-${exported.widthPx}x${exported.heightPx}px.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      // Direct fallback download if canvas export fails
      const link = document.createElement("a");
      link.href = sourceUrl;
      link.download = `Apolena-Retrato-${selectedCharacter.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExportingPrint(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPetImage(null);
    setSecondPetImage(null);
    setFusedResultUrl("");
    setFusionError(null);
    setIsGenerating(false);
  };

  const activeThemeImageUrl =
    useCustomTheme && customThemeImage
      ? customThemeImage
      : selectedCharacter.characterImageUrl;
  const activeThemeName =
    useCustomTheme && customThemeImage
      ? "Referencia Personalizada"
      : selectedCharacter.name;

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      {/* App Header */}
      <Header
        currentStep={step}
        onReset={handleReset}
        selectedProvider={selectedProvider}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasActiveKey={isProviderConfigured(selectedProvider)}
      />

      {/* ========================================================================= */}
      {/* MODAL DE CONFIGURACIÓN DE CREDENCIALES (LIGHT MINIMALIST DIALOG) */}
      {/* ========================================================================= */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="bg-white border border-cream-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-cream-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cream-100 border border-cream-200 flex items-center justify-center text-stone-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-stone-900">
                    Credenciales del Estudio
                  </h3>
                  <p className="text-xs text-stone-500">
                    Se guardan localmente y en el archivo{" "}
                    <code className="text-stone-800 font-medium">
                      .env.local
                    </code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-full hover:bg-cream-100 text-stone-400 hover:text-stone-700 transition-colors"
                aria-label="Cerrar configuración"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* OpenAI Key */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 flex items-center gap-2">
                    <span>OpenAI Studio (gpt-image-1 / GPT-4o)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-sage-50 text-sage-700 border border-sage-100 font-medium">
                      Recomendado
                    </span>
                  </span>
                  {envStatus.openai && (
                    <span className="text-[11px] text-sage-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Activa en servidor
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={apiKeys.openaiKey || ""}
                  onChange={(e) =>
                    saveApiKeysToStorage({
                      ...apiKeys,
                      openaiKey: e.target.value,
                    })
                  }
                  placeholder={
                    envStatus.openai
                      ? "Configurada en .env.local (pega otra para reemplazar)"
                      : "sk-proj-..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-stone-900 placeholder:text-stone-400 focus:border-terracotta-500 focus:outline-none font-mono text-xs"
                />
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    Fusión de 1 o 2 mascotas con preservación de rasgos
                  </span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Obtener clave <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Google Gemini Key */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900">
                    Google Gemini Studio (gemini-2.5-flash-image)
                  </span>
                  {envStatus.gemini && (
                    <span className="text-[11px] text-sage-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Activa en servidor
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={apiKeys.geminiKey || ""}
                  onChange={(e) =>
                    saveApiKeysToStorage({
                      ...apiKeys,
                      geminiKey: e.target.value,
                    })
                  }
                  placeholder={
                    envStatus.gemini ? "Configurada en .env.local" : "AIzaSy..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-stone-900 placeholder:text-stone-400 focus:border-terracotta-500 focus:outline-none font-mono text-xs"
                />
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>
                    Motor multimodal con nivel gratuito en Google AI Studio
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Obtener clave <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* fal.ai Key */}
              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900">
                    FLUX Kontext Studio (fal.ai — Opcional)
                  </span>
                  {envStatus.fal && (
                    <span className="text-[11px] text-sage-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Activa en servidor
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={apiKeys.falKey || ""}
                  onChange={(e) =>
                    saveApiKeysToStorage({ ...apiKeys, falKey: e.target.value })
                  }
                  placeholder={
                    envStatus.fal ? "Configurada en .env.local" : "fal_sk_..."
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-stone-900 placeholder:text-stone-400 focus:border-terracotta-500 focus:outline-none font-mono text-xs"
                />
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span>Opcional si ya utilizas OpenAI o Google Gemini</span>
                  <a
                    href="https://fal.ai/dashboard/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terracotta-600 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    Panel fal.ai <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2.5 rounded-full border border-cream-200 text-stone-600 hover:bg-cream-100 text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/providers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(apiKeys),
                    });
                    const data = await res.json();
                    if (data?.envConfigured) {
                      setEnvStatus(data.envConfigured);
                    }
                  } catch (e) {}
                  setIsSettingsOpen(false);
                }}
                className="px-6 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-soft transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 w-full">
        {/* ========================================================================= */}
        {/* PANTALLA DE REVELADO / CARGA (MINIMALIST STUDIO LIGHT VIEW) */}
        {/* ========================================================================= */}
        {isGenerating && (
          <div className="py-16 text-center space-y-8 max-w-xl mx-auto animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-4">
              {petImage && (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-cream-200 bg-white p-1.5 shadow-soft">
                  <img
                    src={petImage}
                    alt="Mascota 1"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
              )}
              {secondPetImage && (
                <>
                  <Plus className="w-4 h-4 text-stone-400" />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-cream-200 bg-white p-1.5 shadow-soft">
                    <img
                      src={secondPetImage}
                      alt="Mascota 2"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                </>
              )}
              <Plus className="w-4 h-4 text-stone-400" />
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-cream-200 bg-white p-1.5 shadow-soft">
                <img
                  src={activeThemeImageUrl}
                  alt={activeThemeName}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>

            <div className="bg-white border border-cream-200 rounded-3xl p-8 shadow-soft space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 text-stone-700 text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-terracotta-500" />
                <span>
                  Motor de estudio activo ·{" "}
                  {AI_PROVIDERS.find((p) => p.id === selectedProvider)?.name ||
                    "OpenAI Studio"}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                Revelando tu Retrato Personalizado
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                {generationStepMessage ||
                  "Integrando fisonomía, pelaje, vestuario e iluminación de estudio..."}
              </p>

              {/* Minimalist Progress Bar */}
              <div className="w-full h-2 rounded-full bg-cream-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-terracotta-500 transition-all duration-300"
                  style={{ width: `${Math.max(generationProgress, 10)}%` }}
                />
              </div>
              <p className="font-mono text-stone-500 text-xs">
                {generationProgress}%
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 1: SUBIR FOTO DE TU MASCOTA (1 MASCOTA) */}
        {/* ========================================================================= */}
        {!isGenerating && step === 1 && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-200 text-stone-600 text-xs font-medium">
                <Camera className="w-3.5 h-3.5 text-terracotta-500" />
                <span>Paso 1 de 3 · Fotografía de Referencia</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-stone-900 tracking-tight">
                Sube la foto de tu mascota
              </h1>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                Selecciona una fotografía clara donde se aprecie bien el rostro,
                los ojos y el pelaje de tu perro o gato.
              </p>
            </div>

            {/* Centered Single Pet Upload Card */}
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-stone-800 flex items-center gap-2">
                    <PawPrint className="w-3.5 h-3.5 text-terracotta-500" />
                    <span>Fotografía de tu Mascota</span>
                  </span>
                  {petImage ? (
                    <span className="text-xs text-sage-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fotografía lista
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400">
                      JPG, PNG o WEBP
                    </span>
                  )}
                </div>

                {!petImage ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        readAndCompressImage(
                          e.dataTransfer.files[0],
                          setPetImage,
                        );
                      }
                    }}
                    onClick={() => fileInput1Ref.current?.click()}
                    className="relative aspect-[4/3] rounded-2xl border border-dashed border-cream-300 hover:border-terracotta-500 bg-cream-50/70 hover:bg-terracotta-50/30 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all group"
                  >
                    <input
                      ref={fileInput1Ref}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        readAndCompressImage(e.target.files[0], setPetImage)
                      }
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-full bg-white border border-cream-200 flex items-center justify-center text-stone-600 group-hover:text-terracotta-600 mb-3.5 shadow-soft transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-stone-900 mb-1">
                      Seleccionar o arrastrar fotografía
                    </p>
                    <p className="text-xs text-stone-500">
                      Haz clic para buscar en tu dispositivo o arrastra el
                      archivo aquí
                    </p>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-cream-200 bg-cream-100">
                    <img
                      src={petImage}
                      alt="Tu Mascota"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => fileInput1Ref.current?.click()}
                      className="absolute bottom-3 right-3 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-xs border border-cream-200 text-stone-800 hover:text-terracotta-600 text-xs font-medium flex items-center gap-1.5 shadow-soft transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Cambiar foto</span>
                    </button>
                    <input
                      ref={fileInput1Ref}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        readAndCompressImage(e.target.files[0], setPetImage)
                      }
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Continue CTA */}
            {petImage && (
              <div className="max-w-sm mx-auto pt-2">
                <button
                  onClick={() => setStep(2)}                  className="w-full py-4 px-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-medium flex items-center justify-center gap-2.5 shadow-soft transition-all"
                >
                  <span>Continuar a Estilo y Escena</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Sample Photographs Bar */}
            <div className="max-w-xl mx-auto pt-6 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <span className="text-stone-500 font-medium">
                Probar con fotografía de muestra:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={loadDemoDog}
                  className="px-4 py-2 rounded-full bg-white border border-cream-200 text-stone-700 hover:border-stone-400 hover:text-stone-900 font-medium flex items-center gap-2 transition-colors shadow-soft"
                >
                  <Dog className="w-3.5 h-3.5 text-stone-500" />
                  <span>Perro (Golden Retriever)</span>
                </button>
                <button
                  type="button"
                  onClick={loadDemoCat}
                  className="px-4 py-2 rounded-full bg-white border border-cream-200 text-stone-700 hover:border-stone-400 hover:text-stone-900 font-medium flex items-center gap-2 transition-colors shadow-soft"
                >
                  <Cat className="w-3.5 h-3.5 text-stone-500" />
                  <span>Gato (Atigrado)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: ELEGIR ESCENA / SUBIR REFERENCIA Y MOTOR DEL ESTUDIO */}
        {/* ========================================================================= */}
        {!isGenerating && step === 2 && (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* Navigation & Step Indicator */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cream-200 text-stone-700 hover:text-stone-900 text-xs font-medium hover:border-stone-300 transition-colors shadow-soft"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a fotografías</span>
              </button>

              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cream-100 border border-cream-200 text-stone-600 text-xs font-medium">
                <span>Paso 2 de 3 · Dirección de Arte</span>
              </div>
            </div>

            {/* SECTION A: SELECT COLLECTION THEME OR UPLOAD CUSTOM REFERENCE */}
            <div className="space-y-6">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
                  Elige el vestuario y escenario
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Selecciona una obra de nuestra colección o sube tu propia
                  fotografía de referencia temática.
                </p>
              </div>

              {/* 4 Curated Collection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {FAMOUS_CHARACTERS.map((char) => {
                  const isSelected =
                    !useCustomTheme && selectedCharacter.id === char.id;

                  return (
                    <div
                      key={char.id}
                      onClick={() => {
                        setSelectedCharacter(char);
                        setUseCustomTheme(false);
                      }}
                      className={`group relative rounded-3xl overflow-hidden border bg-white transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-terracotta-500 ring-2 ring-terracotta-500/20 shadow-card"
                          : "border-cream-200 hover:border-stone-300 shadow-soft"
                      }`}
                    >
                      <div className="relative aspect-[4/4] w-full overflow-hidden bg-cream-100">
                        <img
                          src={char.characterImageUrl}
                          alt={char.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full border backdrop-blur-xs bg-white/90 text-stone-800 border-stone-200/80">
                            {char.universe}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-soft">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta-600">
                            {char.characterTitle}
                          </span>
                          <h3 className="font-serif text-lg font-semibold text-stone-900 mt-0.5">
                            {char.name}
                          </h3>
                          <p className="text-xs text-stone-500 leading-relaxed mt-1.5 line-clamp-3">
                            {char.description}
                          </p>
                        </div>

                        <div className="pt-2">
                          <span
                            className={`w-full py-2 px-3 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                              isSelected
                                ? "bg-terracotta-50 text-terracotta-700 border border-terracotta-100"
                                : "bg-cream-100 text-stone-700 group-hover:bg-cream-200"
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Estilo seleccionado</span>
                              </>
                            ) : (
                              <span>Seleccionar estilo</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Reference Theme Upload Box + Optional Custom Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white border border-cream-200 rounded-3xl p-6 shadow-soft">
                {/* Upload Custom Theme Reference Image */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800 flex items-center gap-2">
                      <ImagePlus className="w-4 h-4 text-terracotta-500" />
                      <span>Referencia temática propia (Opcional)</span>
                    </span>
                    {useCustomTheme && customThemeImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomTheme(false);
                          setCustomThemeImage(null);
                        }}
                        className="text-xs text-stone-500 hover:text-terracotta-600 underline"
                      >
                        Usar colección del estudio
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => themeFileInputRef.current?.click()}
                    className={`p-4 rounded-2xl border border-dashed cursor-pointer transition-all flex items-center gap-4 ${
                      useCustomTheme && customThemeImage
                        ? "border-terracotta-500 bg-terracotta-50/40"
                        : "border-cream-300 hover:border-stone-400 bg-cream-50/60"
                    }`}
                  >
                    <input
                      ref={themeFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          readAndCompressImage(e.target.files[0], (url) => {
                            setCustomThemeImage(url);
                            setUseCustomTheme(true);
                          });
                        }
                      }}
                      className="hidden"
                    />
                    {customThemeImage ? (
                      <img
                        src={customThemeImage}
                        alt="Temática personalizada"
                        className="w-16 h-16 rounded-xl object-cover border border-cream-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white border border-cream-200 flex items-center justify-center text-stone-600 flex-shrink-0 shadow-soft">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    <div className="text-xs">
                      <p className="font-medium text-stone-900">
                        {customThemeImage
                          ? "Imagen de referencia cargada"
                          : "Subir otra imagen de vestuario o época"}
                      </p>
                      <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed">
                        Sube cualquier fotografía de referencia para vestir a
                        tus mascotas con esa temática.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Prompt / Extra Notes */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-stone-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-500" />
                    <span>Notas de dirección fotográfica (Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Detalles específicos: iluminación cálida de atardecer, mantos tejidos andinos, paisaje de Machu Picchu al fondo..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 placeholder:text-stone-400 focus:border-terracotta-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Studio Engine Selector (Single-Model Cost-Optimized Execution) */}
            <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-terracotta-500" />
                  <span>Motor de IA del Estudio (1 retrato optimizado por generación)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-xs text-terracotta-600 hover:underline font-medium"
                >
                  Configurar API Keys
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AI_PROVIDERS.map((prov) => {
                  const isActive = selectedProvider === prov.id;
                  const configured = isProviderConfigured(prov.id);
                  return (
                    <div
                      key={prov.id}
                      onClick={() => handleSelectProvider(prov.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isActive
                          ? "border-terracotta-500 bg-terracotta-50/40 ring-1 ring-terracotta-500/20"
                          : "border-cream-200 bg-cream-50/50 hover:border-stone-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-stone-900">
                          {prov.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-cream-200 text-stone-600 font-medium">
                          {prov.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-stone-500 mt-1">
                        {prov.modelName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            configured ? "bg-sage-600" : "bg-stone-300"
                          }`}
                        />
                        <span className="text-stone-500">
                          {configured ? "Clave activa" : "Usa respaldo automático"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Notification if API call failed */}
            {fusionError && (
              <div className="p-4 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-700 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-2xl mx-auto">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-terracotta-600 flex-shrink-0" />
                  <span>{fusionError}</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium whitespace-nowrap self-end sm:self-auto"
                >
                  Revisar credenciales
                </button>
              </div>
            )}

            {/* Launch Single Optimized Portrait Generation CTA */}
            <div className="pt-2 max-w-md mx-auto text-center space-y-2.5">
              <button
                onClick={handleStartFusion}
                className="w-full py-4 px-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-medium flex items-center justify-center gap-2.5 shadow-soft transition-all"
              >
                <span>Crear Retrato Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-stone-500">
                Se generará{" "}
                <strong className="text-stone-800 font-medium">
                  1 retrato optimizado
                </strong>{" "}
                con{" "}
                <strong className="text-stone-800 font-medium">
                  {AI_PROVIDERS.find((p) => p.id === selectedProvider)?.name}
                </strong>{" "}
                en estilo{" "}
                <strong className="text-stone-800 font-medium">
                  {activeThemeName}
                </strong>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: VER EL RETRATO FINAL */}
        {/* ========================================================================= */}
        {!isGenerating && step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Bar with Re-generate & Download */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-cream-200">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-100 text-sage-700 text-xs font-medium mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Retrato finalizado en {executionSeconds}s · {modelUsedLabel}
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-stone-900">
                  {secondPetImage ? "Retrato Doble" : "Retrato"} ·{" "}
                  <span className="text-terracotta-600">{activeThemeName}</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-cream-200 text-stone-700 hover:text-stone-900 text-xs font-medium transition-colors shadow-soft"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cambiar estilo</span>
                </button>

                <button
                  onClick={() => handleDownload(selectedPrintPreset)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-soft transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Retrato HD</span>
                </button>
              </div>
            </div>

            {/* Reference Summary Strip: [Pet 1] + [Pet 2] + [Theme] = [Portrait] */}
            <div className="p-4 rounded-2xl bg-white border border-cream-200 shadow-soft flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-600">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
                  {petImage && (
                    <img
                      src={petImage}
                      alt="Mascota 1"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="font-medium text-stone-800 hidden sm:inline">
                  Mascota 1
                </span>
              </div>

              {secondPetImage && (
                <>
                  <Plus className="w-3.5 h-3.5 text-stone-400" />
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
                      <img
                        src={secondPetImage}
                        alt="Mascota 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="font-medium text-stone-800 hidden sm:inline">
                      Mascota 2
                    </span>
                  </div>
                </>
              )}

              <Plus className="w-3.5 h-3.5 text-stone-400" />

              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
                  <img
                    src={activeThemeImageUrl}
                    alt={activeThemeName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-medium text-stone-800 hidden sm:inline">
                  {activeThemeName}
                </span>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />

              <div className="flex items-center gap-1.5 text-terracotta-600 font-medium">
                <Layers className="w-4 h-4" />
                <span>Composición Final</span>
              </div>
            </div>

            {/* Main Stage: Gallery Frame & Print Formats Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 8 Columns: Dual Option Selector + Artwork Viewer */}
              <div className="lg:col-span-8 space-y-5">
                {/* GENERATED MODEL OPTIONS SELECTOR (shown when multiple variants exist) */}
                {generatedVariants.length > 1 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-stone-800">
                        Elige entre las 2 versiones generadas (1 de cada
                        modelo):
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Haz clic en una opción para inspeccionarla o descargarla
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {generatedVariants.map((variant) => {
                        const isActiveVariant =
                          selectedVariantId === variant.id;

                        return (
                          <div
                            key={variant.id}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setFusedResultUrl(variant.imageUrl);
                              setModelUsedLabel(variant.modelUsed);
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                              isActiveVariant
                                ? "bg-white border-terracotta-500 ring-2 ring-terracotta-500/20 shadow-card"
                                : "bg-white/70 border-cream-200 hover:bg-white hover:border-stone-300 shadow-soft"
                            }`}
                          >
                            <div className="w-20 h-20 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
                              <img
                                src={variant.imageUrl}
                                alt={variant.providerTitle}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="text-xs font-semibold text-stone-900 truncate">
                                  {variant.providerTitle}
                                </span>
                                {isActiveVariant && (
                                  <span className="w-5 h-5 rounded-full bg-terracotta-500 text-white flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 stroke-[2.5]" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-stone-500 truncate mt-0.5">
                                {variant.modelUsed}
                              </p>
                              <span
                                className={`inline-block mt-2 text-[11px] font-medium ${
                                  isActiveVariant
                                    ? "text-terracotta-600"
                                    : "text-stone-500"
                                }`}
                              >
                                {isActiveVariant
                                  ? "Mostrando en el visor"
                                  : "Ver esta opción"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Viewer Controls Bar */}
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-full bg-white border border-cream-200 shadow-soft">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setViewMode("fusion");
                        setIsZoomActive(false);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        viewMode === "fusion"
                          ? "bg-stone-900 text-white"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Obra Completa</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode("compare");
                        setIsZoomActive(false);
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        viewMode === "compare"
                          ? "bg-stone-900 text-white"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Comparar Original</span>
                    </button>
                  </div>

                  {viewMode === "fusion" && (
                    <button
                      onClick={() => setIsZoomActive(!isZoomActive)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors ${
                        isZoomActive
                          ? "bg-terracotta-50 text-terracotta-600 border border-terracotta-100"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Lupa {isZoomActive ? "Activa" : ""}</span>
                    </button>
                  )}
                </div>

                {/* Gallery Matte Viewport */}
                <div
                  ref={imageContainerRef}
                  onMouseMove={(e) => {
                    if (!imageContainerRef.current) return;
                    const rect =
                      imageContainerRef.current.getBoundingClientRect();
                    const x = Math.max(
                      0,
                      Math.min(
                        100,
                        ((e.clientX - rect.left) / rect.width) * 100,
                      ),
                    );
                    const y = Math.max(
                      0,
                      Math.min(
                        100,
                        ((e.clientY - rect.top) / rect.height) * 100,
                      ),
                    );
                    setLensPos({ x, y });
                    if (isDraggingSlider) setSliderPos(x);
                  }}
                  className="relative rounded-3xl overflow-hidden bg-cream-100 border border-cream-200 min-h-[480px] flex items-center justify-center p-6 sm:p-10 select-none shadow-soft"
                >
                  {/* MODE 1: FULL PORTRAIT IN GALLERY MATTE */}
                  {viewMode === "fusion" && (
                    <div
                      className={`relative bg-white rounded-2xl shadow-card border border-cream-200 transition-all ${
                        printFinishMode === "museum-matte"
                          ? "p-6 sm:p-10"
                          : "p-2.5 sm:p-3.5"
                      }`}
                    >
                      <img
                        src={
                          fusedResultUrl || selectedCharacter.fusionSampleUrl
                        }
                        alt="Retrato finalizado"
                        className="max-h-[560px] w-auto object-contain rounded-xl"
                      />

                      {/* Deep Zoom Magnifier Loupe */}
                      {isZoomActive && (
                        <div
                          className="absolute w-44 h-44 rounded-full border-4 border-white pointer-events-none shadow-card overflow-hidden hidden sm:block"
                          style={{
                            left: `calc(${lensPos.x}% - 88px)`,
                            top: `calc(${lensPos.y}% - 88px)`,
                          }}
                        >
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundImage: `url(${
                                fusedResultUrl ||
                                selectedCharacter.fusionSampleUrl
                              })`,
                              backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                              backgroundSize: "280%",
                              backgroundRepeat: "no-repeat",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE 2: BEFORE / AFTER SLIDER */}
                  {viewMode === "compare" && petImage && (
                    <div
                      className="relative max-h-[560px] aspect-[4/3] w-full max-w-[660px] rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card cursor-ew-resize"
                      onMouseDown={() => setIsDraggingSlider(true)}
                      onMouseUp={() => setIsDraggingSlider(false)}
                      onTouchMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const touchX = e.touches[0].clientX;
                        const x = Math.max(
                          0,
                          Math.min(
                            100,
                            ((touchX - rect.left) / rect.width) * 100,
                          ),
                        );
                        setSliderPos(x);
                      }}
                    >
                      {/* After Fused Image */}
                      <img
                        src={
                          fusedResultUrl || selectedCharacter.fusionSampleUrl
                        }
                        alt="Retrato"
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* Before Pet Image (Clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPos}%` }}
                      >
                        <img
                          src={petImage}
                          alt="Fotografía Original"
                          className="absolute inset-0 w-full h-full object-cover max-w-none"
                          style={{ width: "660px" }}
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-medium text-stone-800 border border-cream-200 shadow-soft">
                          Fotografía original
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-medium text-stone-900 border border-cream-200 shadow-soft">
                        {activeThemeName}
                      </div>

                      {/* Divider Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-soft pointer-events-none"
                        style={{ left: `${sliderPos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-stone-800 border border-cream-200 flex items-center justify-center shadow-card">
                          <MoveHorizontal className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 4 Columns: Predefined Print Sizes (Large XL to Small S at 300 DPI) */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-terracotta-600 text-xs font-semibold uppercase tracking-wider">
                      <Printer className="w-4 h-4" />
                      <span>Impresión en Alta Calidad (300 DPI)</span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-stone-900">
                      Medidas para Cuadros
                    </h3>
                    <p className="text-xs text-stone-500">
                      Selecciona el formato desde tamaño galería (XL) hasta
                      escritorio (S).
                    </p>
                  </div>

                  {/* Size List: XL -> L -> M -> Square -> S */}
                  <div className="space-y-2.5">
                    {PRINT_PRESETS.map((preset) => {
                      const isSelected = selectedPrintPreset.id === preset.id;

                      return (
                        <div
                          key={preset.id}
                          onClick={() => setSelectedPrintPreset(preset)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-terracotta-500 bg-terracotta-50/40 ring-1 ring-terracotta-500/20"
                              : "border-cream-200 bg-cream-50/50 hover:border-stone-300 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Frame
                                className={`w-4 h-4 ${
                                  isSelected
                                    ? "text-terracotta-600"
                                    : "text-stone-400"
                                }`}
                              />
                              <span className="text-xs font-semibold text-stone-900">
                                {preset.tier}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-terracotta-600">
                              {preset.cmDimensions}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-1.5 text-[11px] text-stone-500">
                            <span className="font-mono">
                              {preset.baseWidthPx} × {preset.baseHeightPx} px ·{" "}
                              {preset.dpi} DPI
                            </span>
                            <span>{preset.inchDimensions}</span>
                          </div>

                          <p className="text-[11px] text-stone-500 mt-1">
                            {preset.recommendedUse}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Print Finish Mode: Full Bleed vs Museum Matte */}
                  <div className="pt-2 border-t border-cream-200 space-y-2">
                    <span className="text-xs font-semibold text-stone-800 block">
                      Acabado del borde para enmarcar:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPrintFinishMode("full-bleed")}
                        className={`py-2 px-3 rounded-xl border font-medium transition-all ${
                          printFinishMode === "full-bleed"
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-cream-50 text-stone-600 border-cream-200 hover:text-stone-900"
                        }`}
                      >
                        Lienzo completo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintFinishMode("museum-matte")}
                        className={`py-2 px-3 rounded-xl border font-medium transition-all ${
                          printFinishMode === "museum-matte"
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-cream-50 text-stone-600 border-cream-200 hover:text-stone-900"
                        }`}
                      >
                        Con paspartú
                      </button>
                    </div>
                  </div>

                  {/* Export Print-Ready File CTA */}
                  <button
                    onClick={() => handleDownload(selectedPrintPreset)}
                    disabled={isExportingPrint}
                    className="w-full py-3.5 px-5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-soft transition-all"
                  >
                    {isExportingPrint ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando archivo 300 DPI...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>
                          Descargar Cuadro {selectedPrintPreset.cmDimensions}{" "}
                          (300 DPI)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Reset Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-full bg-white hover:bg-cream-100 text-stone-700 border border-cream-200 text-xs font-medium transition-all shadow-soft"
              >
                Subir nuevas fotografías
              </button>

              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-medium shadow-soft transition-all"
              >
                Probar otro escenario
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
