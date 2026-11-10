"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ProtectedArtworkCanvas } from "@/components/ProtectedArtworkCanvas";
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
  FRAME_OPTIONS,
  FrameOption,
  exportWatermarkedPreviewImage,
} from "@/lib/print-export";
import type { ProductFinishOption, ProductRecord } from "@/lib/db-service";
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
  Sparkles,
  CheckCircle2,
  MoveHorizontal,
  Layers,
  Loader2,
  Printer,
  Frame,
  ShoppingBag,
} from "lucide-react";

export default function personalizedWallArt() {
  const router = useRouter();
  // 3-step state: 1 = Upload Pet(s), 2 = Choose Theme & Studio Engine, 3 = Result Portrait
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Pet Images (1 mandatory, 2nd optional for duo portrait)
  const [petImage, setPetImage] = useState<string | null>(null);
  const [secondPetImage, setSecondPetImage] = useState<string | null>(null);
  const [petSpecies, setPetSpecies] = useState<"dog" | "cat" | "other">("dog");
  const [isSimulationJob, setIsSimulationJob] = useState<boolean>(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Dynamic Catalog from Supabase (products.customization_config)
  const [wallArtProductId, setWallArtProductId] = useState<string>(
    "00000000-0000-4000-8000-000000000101",
  );
  const [catalogCharacters, setCatalogCharacters] = useState<FamousCharacter[]>(
    () => FAMOUS_CHARACTERS.filter((c) => c.isAvailable !== false),
  );
  const [catalogSizes, setCatalogSizes] =
    useState<PrintPreset[]>(PRINT_PRESETS);
  const [catalogFrames, setCatalogFrames] =
    useState<FrameOption[]>(FRAME_OPTIONS);
  const [catalogFinishes, setCatalogFinishes] = useState<ProductFinishOption[]>(
    [
      {
        id: "full-bleed",
        name: "Lienzo completo",
        description: "Arte impreso hasta el borde",
        priceModifierPen: 0,
        isAvailable: true,
      },
      {
        id: "museum-matte",
        name: "Con paspartú",
        description: "Margen blanco de museo",
        priceModifierPen: 0,
        isAvailable: true,
      },
    ],
  );

  // Theme selection (Catalog or Custom uploaded reference image)
  const [selectedCharacter, setSelectedCharacter] = useState<FamousCharacter>(
    FAMOUS_CHARACTERS[0],
  );
  const [customThemeImage, setCustomThemeImage] = useState<string | null>(null);
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // Multi-Model Provider selection (credenciales gestionadas exclusivamente en el servidor .env)
  const [selectedProvider, setSelectedProvider] =
    useState<AIProviderId>("openai");
  const [envStatus, setEnvStatus] = useState<{
    openai: boolean;
    gemini: boolean;
    fal: boolean;
  }>({
    openai: false,
    gemini: false,
    fal: false,
  });

  // Generation / Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStepMessage, setGenerationStepMessage] = useState("");
  const [fusedResultUrl, setFusedResultUrl] = useState<string>("");
  const [generatedVariants, setGeneratedVariants] = useState<
    GeneratedVariant[]
  >([]);
  const [selectedVariantId, setSelectedVariantId] =
    useState<string>("variant-1");
  const [activeGenerationJobId, setActiveGenerationJobId] = useState<
    string | null
  >(null);
  const [modelUsedLabel, setModelUsedLabel] = useState<string>(
    "Propuesta 1 · Óleo Fine Art",
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

  // Print Size, Finish & Extensible Frame state (ordered from Largest XL to Smallest S)
  const [selectedPrintPreset, setSelectedPrintPreset] = useState<PrintPreset>(
    PRINT_PRESETS[1],
  );
  const [printFinishMode, setPrintFinishMode] =
    useState<PrintFinishMode>("full-bleed");
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(
    FRAME_OPTIONS[0],
  );
  const [isExportingPrint, setIsExportingPrint] = useState(false);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved provider preference & check server .env status
  useEffect(() => {
    try {
      localStorage.removeItem("apolena_api_keys");
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

    // Load dynamic characters, frames, sizes, and finishes for cuadros-personalizados
    fetch("/api/products", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const productsList: ProductRecord[] = data?.products || [];
        const wallArt =
          productsList.find(
            (p) =>
              p.slug === "cuadros-personalizados" ||
              p.slug === "personalized-wall-art" ||
              p.category === "wall_art",
          ) || productsList[0];
        if (!wallArt) return;

        setWallArtProductId(wallArt.id);
        const cfg = wallArt.customization_config;

        if (Array.isArray(cfg?.characters)) {
          const activeChars = cfg.characters.filter(
            (c) => c.isAvailable !== false,
          );
          if (activeChars.length > 0) {
            setCatalogCharacters(activeChars);
            setSelectedCharacter((prev) => {
              const found = activeChars.find((c) => c.id === prev.id);
              return found || activeChars[0];
            });
          }
        }

        if (Array.isArray(cfg?.sizes)) {
          const activeSizes = cfg.sizes.filter((s) => s.isAvailable !== false);
          if (activeSizes.length > 0) {
            setCatalogSizes(activeSizes);
            setSelectedPrintPreset((prev) => {
              const found = activeSizes.find((s) => s.id === prev.id);
              return found || activeSizes[1] || activeSizes[0];
            });
          }
        }

        if (Array.isArray(cfg?.frames)) {
          const activeFrames = cfg.frames.filter(
            (f) => f.isAvailable !== false,
          );
          if (activeFrames.length > 0) {
            setCatalogFrames(activeFrames);
            setSelectedFrame((prev) => {
              const found = activeFrames.find((f) => f.id === prev.id);
              return found || activeFrames[0];
            });
          }
        }

        if (Array.isArray(cfg?.finishes)) {
          const activeFinishes = cfg.finishes.filter(
            (fin) => fin.isAvailable !== false,
          );
          if (activeFinishes.length > 0) {
            setCatalogFinishes(activeFinishes);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectProvider = (provider: AIProviderId) => {
    setSelectedProvider(provider);
    setFusionError(null);
    try {
      localStorage.setItem("apolena_provider", provider);
    } catch (e) {}
  };

  const isProviderConfigured = (provider: AIProviderId): boolean => {
    if (provider === "openai") return Boolean(envStatus.openai);
    if (provider === "gemini") return Boolean(envStatus.gemini);
    if (provider === "fal") return Boolean(envStatus.fal);
    return false;
  };

  // Compress & read uploaded image file into base64 data URL
  const readAndCompressImage = useCallback(
    (file: File, onDone: (dataUrl: string) => void) => {
      if (!file.type.startsWith("image/")) {
        setFusionError(
          "Por favor selecciona una imagen válida (JPG, PNG o WEBP).",
        );
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
    setPetSpecies("cat");
  };

  const loadDemoDog = () => {
    setPetImage("/samples/dog-sample.jpg");
    setSecondPetImage(null);
    setPetSpecies("dog");
  };

  const loadDemoCat = () => {
    setPetImage("/samples/cat-sample.jpg");
    setSecondPetImage(null);
    setPetSpecies("cat");
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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId:
            useCustomTheme && customThemeImage
              ? "custom-reference"
              : selectedCharacter.id,
          petImageUrl: petImage,
          secondPetImageUrl: secondPetImage,
          customThemeImageUrl: useCustomTheme ? customThemeImage : null,
          customPrompt: customPrompt.trim() || null,
          provider: selectedProvider,
          petName: secondPetImage ? "Dúo de Mascotas" : "Mascota",
          species: petSpecies,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.jobId) {
        throw new Error(
          data.error || "No se pudo iniciar el revelado del retrato",
        );
      }

      const jobId = data.jobId;
      setActiveGenerationJobId(jobId);

      const handleJobCompletion = (job: any) => {
        setIsSimulationJob(Boolean(job.isSimulation));
        setSimulationNotice(job.simulationReason || null);
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

  const handleDownload = async (_presetOverride?: PrintPreset) => {
    const sourceUrl = fusedResultUrl || selectedCharacter.fusionSampleUrl;
    if (!sourceUrl) return;

    setIsExportingPrint(true);
    try {
      const exported = await exportWatermarkedPreviewImage(
        sourceUrl,
        activeThemeName,
      );
      const link = document.createElement("a");
      link.href = exported.dataUrl;
      link.download = `Apolena-Muestra-Protegida-${selectedCharacter.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn("No se pudo exportar la muestra con marca de agua:", err);
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
    setIsSimulationJob(false);
    setSimulationNotice(null);
  };

  const activeThemeImageUrl =
    useCustomTheme && customThemeImage
      ? customThemeImage
      : selectedCharacter.characterImageUrl;
  const activeThemeName =
    useCustomTheme && customThemeImage
      ? "Referencia Personalizada"
      : selectedCharacter.name;

  const currentUnitPrice = selectedPrintPreset.pricePen;
  const currentAdvance50 = Number((currentUnitPrice * 0.5).toFixed(2));

  const handleProceedToCheckout = () => {
    const finalArtUrl = fusedResultUrl || selectedCharacter.fusionSampleUrl;
    const draft = {
      product_id: wallArtProductId,
      generation_job_id: activeGenerationJobId,
      selected_variant_id: selectedVariantId || "variant-1",
      pet_photo_url: petImage,
      generated_art_url: finalArtUrl,
      unit_price: currentUnitPrice,
      customizations: {
        theme_id: useCustomTheme ? "custom" : selectedCharacter.id,
        theme_name: activeThemeName,
        size_id: selectedPrintPreset.id,
        size_label: `${selectedPrintPreset.tier} · ${selectedPrintPreset.cmDimensions}`,
        cm_dimensions: selectedPrintPreset.cmDimensions,
        dpi: selectedPrintPreset.dpi,
        finish_mode: "full-bleed",
        finish_label: "Lienzo Completo (Full Screen)",
        frame_id: "canvas-bastidor",
        frame_name: "Lienzo en Bastidor de Madera (Full Screen)",
        frame_price_pen: 0,
        pet_count: secondPetImage ? 2 : 1,
        selected_variant_id: selectedVariantId || "variant-1",
        notes: customPrompt.trim() || null,
      },
    };
    try {
      localStorage.setItem("apolena_checkout_draft", JSON.stringify(draft));
    } catch {}
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      {/* App Header */}
      <Header
        currentStep={step}
        onReset={handleReset}
        selectedProvider={selectedProvider}
        hasActiveKey={isProviderConfigured(selectedProvider)}
      />

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
                  Atelier Apolena · Elaborando 2 propuestas artísticas
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
                los ojos y los rasgos de tu mascota.
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

                {/* Pet Type Selector to guarantee 100% facial and species fidelity */}
                <div className="pt-3 border-t border-cream-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <PawPrint className="w-3.5 h-3.5 text-terracotta-500" />
                      <span>Tipo de mascota:</span>
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Garantiza la fidelidad fisonómica
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "dog", label: "Perro", Icon: Dog },
                      { id: "cat", label: "Gato", Icon: Cat },
                      { id: "other", label: "Otra Mascota", Icon: PawPrint },
                    ].map((t) => {
                      const Icon = t.Icon;
                      const isSelected = petSpecies === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPetSpecies(t.id as any)}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? "bg-[#174B3D] text-white border-[#174B3D] shadow-xs"
                              : "bg-cream-50/70 hover:bg-cream-100 text-stone-700 border-cream-200"
                          }`}
                        >
                          <Icon
                            className={`w-3.5 h-3.5 ${
                              isSelected ? "text-[#c6a26c]" : "text-stone-500"
                            }`}
                          />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Continue CTA */}
            {petImage && (
              <div className="max-w-sm mx-auto pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-soft transition-all"
                >
                  <span>Continuar a Estilo y Escena</span>
                  <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
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
                  <PawPrint className="w-3.5 h-3.5 text-stone-500" />
                  <span>Mascota de Muestra 1</span>
                </button>
                <button
                  type="button"
                  onClick={loadDemoCat}
                  className="px-4 py-2 rounded-full bg-white border border-cream-200 text-stone-700 hover:border-stone-400 hover:text-stone-900 font-medium flex items-center gap-2 transition-colors shadow-soft"
                >
                  <PawPrint className="w-3.5 h-3.5 text-stone-500" />
                  <span>Mascota de Muestra 2</span>
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

              {/* Dynamic Curated Collection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {catalogCharacters.map((char) => {
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

            {/* Launch Dual Artistic Portrait Generation CTA */}
            <div className="pt-2 max-w-md mx-auto text-center space-y-2.5">
              <button
                onClick={handleStartFusion}
                className="w-full py-4 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-soft transition-all"
              >
                <span>Crear Retrato Ahora</span>
                <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
              </button>
              <p className="text-xs text-stone-500">
                Prepararemos{" "}
                <strong className="text-stone-800 font-medium">
                  2 propuestas artísticas exclusivas
                </strong>{" "}
                de tu mascota en estilo{" "}
                <strong className="text-stone-800 font-medium">
                  {activeThemeName}
                </strong>{" "}
                para que elijas tu favorita.
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                  <span>2 propuestas artísticas listas para tu elección</span>
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
                  disabled={isExportingPrint}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium shadow-soft transition-all disabled:opacity-60"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Muestra con Marca de Agua</span>
                </button>
              </div>
            </div>

            {/* Simulation Warning Banner when APIs exceed quota (429) */}
            {isSimulationJob && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-3.5 shadow-soft">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950 text-sm">
                    Muestra de Ilustración de Estudio (Modo Demostración)
                  </p>
                  <p className="text-amber-800 leading-relaxed text-xs">
                    {simulationNotice ||
                      "Las claves de API de los motores de IA (OpenAI / Google Gemini) alcanzaron su cuota o saldo disponible (Error 429 Quota Exceeded). Por ello, el sistema desplegó una muestra ilustrativa del atelier en lugar de la transformación en vivo de tu foto. Para fusionar en tiempo real conservando al 100% las facciones exactas de tu mascota, por favor recarga los créditos de tu cuenta de OpenAI o habilita facturación en Google Cloud / AI Studio."}
                  </p>
                </div>
              </div>
            )}

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
                {/* DUAL PROPOSAL ARTWORK SELECTOR */}
                {generatedVariants.length > 1 && (
                  <div className="bg-white border border-cream-200 rounded-3xl p-5 shadow-soft space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-terracotta-500" />
                          <span>Elige tu propuesta artística favorita</span>
                        </h3>
                        <p className="text-xs text-stone-500">
                          Hemos preparado 2 propuestas de retrato para tu
                          mascota. Selecciona la que más te guste para tu
                          cuadro:
                        </p>
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-cream-100 text-stone-700 self-start sm:self-auto">
                        1 de 2 seleccionada
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {generatedVariants.map((variant, idx) => {
                        const isActiveVariant =
                          selectedVariantId === variant.id ||
                          (!selectedVariantId && idx === 0);
                        const proposalTitle =
                          variant.providerTitle ||
                          (idx === 0
                            ? "Propuesta 1 · Óleo Fine Art"
                            : "Propuesta 2 · Claroscuro y Detalle");
                        const proposalDesc =
                          idx === 0
                            ? "Pinceladas ricas en textura y calidez clásica"
                            : "Contrastes profundos, realce de brillo y mirada";

                        return (
                          <div
                            key={variant.id || `prop-${idx}`}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setFusedResultUrl(variant.imageUrl);
                              setModelUsedLabel(proposalTitle);
                            }}
                            className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                              isActiveVariant
                                ? "bg-terracotta-50/40 border-terracotta-500 ring-2 ring-terracotta-500/20 shadow-card"
                                : "bg-white border-cream-200 hover:border-stone-300 hover:bg-cream-50/40 shadow-soft"
                            }`}
                          >
                            <div
                              onContextMenu={(e) => e.preventDefault()}
                              className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden border border-cream-200 bg-stone-900 flex-shrink-0 select-none"
                            >
                              <img
                                src={variant.imageUrl}
                                alt={proposalTitle}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-full object-contain object-top pointer-events-none select-none"
                              />
                              {/* Subtle Mini Watermark on Proposal Thumbnail */}
                              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
                                <img
                                  src="/logo-light.png"
                                  alt=""
                                  draggable={false}
                                  className="w-10 object-contain -rotate-12"
                                />
                              </div>
                              {isActiveVariant && (
                                <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center">
                                  <span className="w-6 h-6 rounded-full bg-[#174B3D] text-white flex items-center justify-center shadow">
                                    <Check className="w-3.5 h-3.5 stroke-[3] text-[#c6a26c]" />
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-[#174B3D] truncate">
                                  {proposalTitle}
                                </span>
                                {isActiveVariant && (
                                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#174B3D] bg-[#c6a26c]/25 px-2 py-0.5 rounded-full border border-[#c6a26c]/50">
                                    Elegida
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500 mt-1 leading-snug line-clamp-2">
                                {proposalDesc}
                              </p>
                              <div className="mt-2.5 flex items-center gap-1.5">
                                <span
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                                    isActiveVariant
                                      ? "bg-[#174B3D] text-white shadow-xs"
                                      : "bg-cream-100 text-stone-700 hover:bg-cream-200"
                                  }`}
                                >
                                  {isActiveVariant ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Obra elegida</span>
                                    </span>
                                  ) : (
                                    "Seleccionar esta"
                                  )}
                                </span>
                              </div>
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

                {/* Gallery Matte Viewport (Protected against right-click, drag & direct save) */}
                <div
                  ref={imageContainerRef}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
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
                  className="relative rounded-3xl overflow-hidden bg-cream-100 border border-cream-200 min-h-[480px] flex flex-col items-center justify-center p-6 sm:p-10 select-none shadow-soft"
                >
                  {/* MODE 1: FULL PORTRAIT - BASTIDOR DE MADERA FULL SCREEN (SIN MARCO) */}
                  {viewMode === "fusion" && (
                    <div
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative rounded-lg overflow-hidden transition-all bg-stone-900 border border-stone-800/20 select-none"
                      style={{
                        boxShadow:
                          "0 25px 50px -12px rgba(28, 25, 23, 0.45), 4px 8px 24px -2px rgba(0, 0, 0, 0.28)",
                        WebkitTouchCallout: "none",
                      }}
                    >
                      <ProtectedArtworkCanvas
                        src={
                          fusedResultUrl || selectedCharacter.fusionSampleUrl
                        }
                        alt="Retrato finalizado"
                        maxHeightPx={560}
                        className="rounded-sm"
                      />

                      {/* Escudo invisible interactivo anti-descarga y anti-arrastre (la marca de agua sutil ya viene integrada en el lienzo) */}
                      <div
                        onContextMenu={(e) => e.preventDefault()}
                        className="absolute inset-0 z-10 pointer-events-auto select-none"
                      />

                      {/* Deep Zoom Magnifier Loupe (also watermarked) */}
                      {isZoomActive && (
                        <div
                          className="absolute z-30 w-44 h-44 rounded-full border-4 border-white pointer-events-none shadow-card overflow-hidden hidden sm:block"
                          style={{
                            left: `calc(${lensPos.x}% - 88px)`,
                            top: `calc(${lensPos.y}% - 88px)`,
                          }}
                        >
                          <div
                            className="w-full h-full relative"
                            style={{
                              backgroundImage: `url(${
                                fusedResultUrl ||
                                selectedCharacter.fusionSampleUrl
                              })`,
                              backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                              backgroundSize: "280%",
                              backgroundRepeat: "no-repeat",
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-35">
                              <img
                                src="/logo-light.png"
                                alt=""
                                className="w-20 object-contain -rotate-12"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE 2: BEFORE / AFTER SLIDER (Also Protected) */}
                  {viewMode === "compare" && petImage && (
                    <div
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative max-h-[560px] aspect-[4/3] w-full max-w-[660px] rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card cursor-ew-resize select-none"
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
                      {/* After Fused Image (already contains server watermark) */}
                      <img
                        src={
                          fusedResultUrl || selectedCharacter.fusionSampleUrl
                        }
                        alt="Retrato"
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
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

                  {/* Dynamic Size List (300 DPI) */}
                  <div className="space-y-2.5">
                    {catalogSizes.map((preset) => {
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
                            <div className="text-right">
                              <span className="text-xs font-semibold text-terracotta-600 block">
                                S/ {preset.pricePen}.00
                              </span>
                              <span className="text-[11px] text-stone-500">
                                {preset.cmDimensions}
                              </span>
                            </div>
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

                  {/* Formato de Presentación: Bastidor de Madera Full Screen (Sin Marco) */}
                  <div className="pt-3 border-t border-cream-200 space-y-2">
                    <span className="text-xs font-semibold text-stone-800 block">
                      Formato y Presentación:
                    </span>
                    <div className="p-3 rounded-2xl border border-terracotta-200 bg-terracotta-50/40 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-stone-900 text-terracotta-400 flex items-center justify-center flex-shrink-0">
                          <Frame className="w-4 h-4 text-terracotta-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900">
                            Lienzo en Bastidor de Madera
                          </p>
                          <p className="text-[10px] text-stone-600 truncate">
                            Full Screen (sin marco) · Listo para colgar
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-terracotta-700 bg-white px-2 py-0.5 rounded-full border border-terracotta-200 whitespace-nowrap">
                        Incluido
                      </span>
                    </div>
                  </div>

                  {/* Price & 50% Split Payment Box */}
                  <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Precio del cuadro personalizado:</span>
                      <span className="font-semibold text-stone-900">
                        S/ {currentUnitPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-terracotta-700 font-semibold">
                      <span>Adelanto hoy (50% iniciar fabricación):</span>
                      <span>S/ {currentAdvance50.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 text-[11px]">
                      <span>Restante 50% (Contraentrega al recibir):</span>
                      <span>S/ {currentAdvance50.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Primary Order & Checkout CTA */}
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 px-5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#c6a26c]" />
                    <span>
                      Ordenar Cuadro · Adelanto 50% (S/{" "}
                      {currentAdvance50.toFixed(2)})
                    </span>
                  </button>

                  {/* Secondary Export Watermarked Preview File CTA */}
                  <button
                    onClick={() => handleDownload(selectedPrintPreset)}
                    disabled={isExportingPrint}
                    className="w-full py-3 px-5 rounded-full bg-white hover:bg-cream-100 border border-cream-200 disabled:opacity-60 text-stone-800 text-xs font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    {isExportingPrint ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando muestra con marca de agua...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Descargar Muestra con Marca de Agua</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                    La muestra descargable incluye marca de agua protectora en
                    resolución web. Tu cuadro físico se imprime sin marcas a 300
                    DPI y al completarse la entrega se desbloquea tu{" "}
                    <strong>Recuerdo Digital HD sin marca</strong> en{" "}
                    <em>Mis Órdenes</em>.
                  </p>
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
                className="px-6 py-3 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] text-xs font-bold shadow-soft transition-all"
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
