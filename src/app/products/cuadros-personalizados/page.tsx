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
  ChevronLeft,
  ChevronRight,
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
  PenTool,
  Gift,
  Truck,
  Home,
} from "lucide-react";

/**
 * Coordenadas porcentuales exactas sobre el mockup de sala (public/images/room-sizes-reference.png)
 * Dimensiones base: 819 x 1024 px. Origen inferior-izquierdo alineado con la guía de pared.
 */
const ROOM_SCALE_COORDINATES: Record<
  string,
  { width: number; height: number; left: number; bottom: number }
> = {
  "size-30x20": { width: 10.62, height: 12.4, left: 28.69, bottom: 41.41 },
  "size-45x30": { width: 15.99, height: 18.55, left: 28.69, bottom: 41.41 },
  "size-60x40": { width: 21.25, height: 24.71, left: 28.69, bottom: 41.41 },
  "size-75x50": { width: 26.62, height: 30.96, left: 28.69, bottom: 41.41 },
  "size-90x60": { width: 31.87, height: 37.01, left: 28.69, bottom: 41.41 },
  "size-105x70": { width: 37.24, height: 43.36, left: 28.69, bottom: 41.41 },
  "size-120x80": { width: 42.49, height: 49.51, left: 28.69, bottom: 41.41 },
};

export default function personalizedWallArt() {
  const router = useRouter();
  // 3-step state: 1 = Upload Pet(s), 2 = Choose Theme & Studio Engine, 3 = Result Portrait
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Pet Images (1 mandatory, 2nd optional for duo portrait)
  const [petImage, setPetImage] = useState<string | null>(null);
  const [secondPetImage, setSecondPetImage] = useState<string | null>(null);
  const [petSpecies, setPetSpecies] = useState<"dog" | "cat" | "other">("dog");
  const [includePetInscription, setIncludePetInscription] =
    useState<boolean>(false);
  const [petInscriptionName, setPetInscriptionName] = useState<string>("");
  const [dedicationNote, setDedicationNote] = useState<string>("");
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
  const [viewMode, setViewMode] = useState<"fusion" | "compare" | "room">("fusion");
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Print Size, Finish & Extensible Frame state (Guía de tamaños oficial Apolena a 300 DPI)
  const [selectedPrintPreset, setSelectedPrintPreset] = useState<PrintPreset>(
    () =>
      PRINT_PRESETS.find((p) => p.cmDimensions.includes("60 × 40")) ||
      PRINT_PRESETS[2] ||
      PRINT_PRESETS[0],
  );

  const currentRoomCoords =
    ROOM_SCALE_COORDINATES[selectedPrintPreset?.id] ||
    ROOM_SCALE_COORDINATES[
      Object.keys(ROOM_SCALE_COORDINATES).find((key) => {
        const dimensions = key.replace("size-", "").replace("x", " × ");
        return selectedPrintPreset?.cmDimensions?.includes(dimensions);
      }) || "size-60x40"
    ] ||
    ROOM_SCALE_COORDINATES["size-60x40"];
  const [printFinishMode, setPrintFinishMode] =
    useState<PrintFinishMode>("full-bleed");
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(
    FRAME_OPTIONS[0],
  );
  const [isExportingPrint, setIsExportingPrint] = useState(false);

  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const themeFileInputRef = useRef<HTMLInputElement>(null);
  const charactersScrollRef = useRef<HTMLDivElement>(null);
  const createPortraitBtnRef = useRef<HTMLButtonElement>(null);
  const customizationsSectionRef = useRef<HTMLDivElement>(null);
  const [previewCharacterModal, setPreviewCharacterModal] =
    useState<FamousCharacter | null>(null);
  const [showNoCustomizationModal, setShowNoCustomizationModal] =
    useState<boolean>(false);

  const scrollToCreatePortrait = () => {
    setTimeout(() => {
      if (createPortraitBtnRef.current) {
        createPortraitBtnRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        createPortraitBtnRef.current.focus({ preventScroll: true });
      }
    }, 100);
  };

  // Auto-selección de personaje desde URL (ej. ?character=sapa-inca-imperial o ?character=chef)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const charParam = params.get("character");
      if (charParam) {
        const found = FAMOUS_CHARACTERS.find(
          (c) =>
            c.id === charParam ||
            c.id.toLowerCase().includes(charParam.toLowerCase()),
        );
        if (found) {
          setSelectedCharacter(found);
          setUseCustomTheme(false);
        }
      }
    }
  }, []);

  // Cerrar lightbox / modal de confirmación con tecla Escape
  useEffect(() => {
    if (!previewCharacterModal && !showNoCustomizationModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewCharacterModal(null);
        setShowNoCustomizationModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewCharacterModal, showNoCustomizationModal]);

  const scrollCharacters = (direction: "left" | "right") => {
    if (charactersScrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      charactersScrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

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
          petName:
            petInscriptionName.trim() ||
            (secondPetImage ? "Dúo de Mascotas" : "Mascota"),
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
    setIncludePetInscription(false);
    setPetInscriptionName("");
    setDedicationNote("");
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
    const hasInscription =
      includePetInscription && Boolean(petInscriptionName.trim());
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
        size_label: `${selectedPrintPreset.cmDimensions} (${selectedPrintPreset.inchDimensions})`,
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
        dedication_note: dedicationNote.trim() || null,
        pet_inscription: hasInscription
          ? {
              enabled: true,
              pet_name: petInscriptionName.trim(),
              style: "brush-white-diagonal",
            }
          : null,
      },
    };
    try {
      localStorage.setItem("apolena_checkout_draft", JSON.stringify(draft));
    } catch {}
    router.push("/checkout");
  };

  const handleOrderButtonClick = () => {
    const hasInscription =
      includePetInscription && Boolean(petInscriptionName.trim());
    const hasDedication = Boolean(dedicationNote.trim());

    // Si no tiene nombre ni dedicatoria (o no tiene nombre en el lienzo), confirmar con el usuario
    if (!hasInscription && !hasDedication) {
      setShowNoCustomizationModal(true);
      return;
    }

    if (!hasInscription) {
      setShowNoCustomizationModal(true);
      return;
    }

    handleProceedToCheckout();
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
      <main className="flex-1 max-w-[1440px] xl:max-w-[1520px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
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
          <div className="space-y-6 max-w-5xl xl:max-w-6xl mx-auto animate-in fade-in duration-300">
            {/* Header Compacto */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-200 text-stone-600 text-xs font-medium">
                <Camera className="w-3.5 h-3.5 text-terracotta-500" />
                <span>Paso 1 de 3 · Fotografía de Referencia</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
                Sube la foto de tu mascota
              </h1>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Selecciona una fotografía clara donde se aprecie bien el rostro,
                los ojos y los rasgos de tu mascota.
              </p>
            </div>

            {/* Grid 2 Columnas: Izquierda (Subida / Preview) - Derecha (Tipo, Nombre y CTA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
              {/* Columna Izquierda: Dropzone de Fotografía */}
              <div className="lg:col-span-6 bg-white border border-cream-200 rounded-3xl p-5 sm:p-6 shadow-soft flex flex-col justify-between space-y-3">
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

                <div className="flex-1 flex flex-col justify-center">
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
                      className="relative w-full aspect-square sm:aspect-[4/3] lg:aspect-square min-h-[360px] sm:min-h-[440px] max-h-[500px] rounded-2xl border-2 border-dashed border-cream-300 hover:border-terracotta-500 bg-cream-50/70 hover:bg-terracotta-50/30 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all group"
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
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-base font-semibold text-stone-900 mb-1">
                        Seleccionar o arrastrar fotografía
                      </p>
                      <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                        Haz clic para buscar en tu dispositivo o arrastra el archivo aquí
                      </p>
                    </div>
                  ) : (
                    <div className="relative w-full aspect-square sm:aspect-[4/3] lg:aspect-square min-h-[360px] sm:min-h-[440px] max-h-[500px] rounded-2xl overflow-hidden border border-cream-200 bg-[#f8f6f0] flex items-center justify-center">
                      <img
                        src={petImage}
                        alt="Tu Mascota"
                        className="w-full h-full object-contain object-center"
                      />
                      <button
                        onClick={() => fileInput1Ref.current?.click()}
                        className="absolute bottom-3 right-3 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xs border border-cream-200 text-stone-800 hover:text-terracotta-600 text-xs font-semibold flex items-center gap-1.5 shadow-card transition-colors z-10"
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

              {/* Columna Derecha: Tipo de Mascota, Nombre en Lienzo y Botón Continuar */}
              <div className="lg:col-span-6 bg-white border border-cream-200 rounded-3xl p-5 sm:p-6 shadow-soft flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Selector de Tipo de Mascota */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <PawPrint className="w-3.5 h-3.5 text-terracotta-500" />
                        <span>Tipo de mascota:</span>
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Garantiza fidelidad fisonómica
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

                  {/* Opción de Nombre de Mascota en el Lienzo */}
                  <div className="pt-3 border-t border-cream-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-[#c6a26c]" />
                        <span>Nombre de tu mascota en el lienzo:</span>
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Opcional · Pincel blanco
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIncludePetInscription(false)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          !includePetInscription
                            ? "bg-[#174B3D] text-white border-[#174B3D] shadow-xs"
                            : "bg-cream-50/70 hover:bg-cream-100 text-stone-700 border-cream-200"
                        }`}
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${
                            !includePetInscription
                              ? "text-[#c6a26c]"
                              : "text-stone-400"
                          }`}
                        />
                        <span>Solo Arte (Sin texto)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIncludePetInscription(true)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          includePetInscription
                            ? "bg-[#174B3D] text-white border-[#174B3D] shadow-xs"
                            : "bg-cream-50/70 hover:bg-cream-100 text-stone-700 border-cream-200"
                        }`}
                      >
                        <PenTool
                          className={`w-3.5 h-3.5 ${
                            includePetInscription
                              ? "text-[#c6a26c]"
                              : "text-stone-400"
                          }`}
                        />
                        <span>Con Nombre (Brush)</span>
                      </button>
                    </div>

                    {includePetInscription && (
                      <div className="pt-1 space-y-1 animate-in fade-in duration-200">
                        <div className="relative">
                          <input
                            type="text"
                            value={petInscriptionName}
                            onChange={(e) =>
                              setPetInscriptionName(e.target.value)
                            }
                            placeholder="Ej. Clattering, Max, Luna, Thor..."
                            maxLength={35}
                            className="w-full px-3.5 py-2 pl-9 rounded-xl bg-white border border-cream-200 text-xs text-stone-900 focus:outline-none focus:border-[#174B3D] focus:ring-1 focus:ring-[#174B3D]"
                          />
                          <PenTool className="w-3.5 h-3.5 text-[#c6a26c] absolute left-3 top-2.5" />
                        </div>
                        <p className="text-[10px] text-stone-400">
                          Se inscribirá en color blanco con tipografía brush en la esquina inferior derecha.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fotografías de Muestra Rápida */}
                  <div className="pt-3 border-t border-cream-200 space-y-2">
                    <span className="text-xs font-semibold text-stone-700 block">
                      Probar con fotografía de muestra:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={loadDemoDog}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-cream-50 border border-cream-200 hover:border-terracotta-400 text-stone-700 hover:text-stone-900 font-medium flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <Dog className="w-4 h-4 text-terracotta-600" />
                        <span>Perro de Muestra</span>
                      </button>
                      <button
                        type="button"
                        onClick={loadDemoCat}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-cream-50 border border-cream-200 hover:border-terracotta-400 text-stone-700 hover:text-stone-900 font-medium flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <Cat className="w-4 h-4 text-terracotta-600" />
                        <span>Gato de Muestra</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón Principal Continuar */}
                <div className="pt-2">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!petImage}
                    className={`w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-soft transition-all ${
                      petImage
                        ? "bg-[#174B3D] hover:bg-[#134034] text-white cursor-pointer"
                        : "bg-cream-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    <span>
                      {petImage
                        ? "Continuar a Estilo y Escena"
                        : "Sube una foto para continuar"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
                  </button>
                </div>
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

              {/* Dynamic Curated Collection Cards (1 Línea Horizontal Flexible & Responsive) */}
              <div className="relative group">
                {/* Flechas de Navegación Horizontal */}
                <button
                  type="button"
                  onClick={() => scrollCharacters("left")}
                  aria-label="Ver estilos anteriores"
                  className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-cream-200 text-stone-700 shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-stone-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCharacters("right")}
                  aria-label="Ver siguientes estilos"
                  className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-cream-200 text-stone-700 shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-stone-900"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Track Horizontal de Personajes en 1 sola línea */}
                <div
                  ref={charactersScrollRef}
                  className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {catalogCharacters.map((char) => {
                    const isSelected =
                      !useCustomTheme && selectedCharacter.id === char.id;

                    return (
                      <div
                        key={char.id}
                        onClick={() => {
                          setSelectedCharacter(char);
                          setUseCustomTheme(false);
                          scrollToCreatePortrait();
                        }}
                        className={`group/card relative rounded-2xl overflow-hidden border bg-white transition-all duration-200 cursor-pointer flex flex-col justify-between flex-1 min-w-[210px] max-w-[270px] sm:max-w-none flex-shrink-0 snap-start ${
                          isSelected
                            ? "border-terracotta-500 ring-2 ring-terracotta-500/20 shadow-card"
                            : "border-cream-200 hover:border-stone-300 shadow-soft"
                        }`}
                      >
                        {/* Imagen Compacta y Proporcional */}
                        <div className="relative aspect-[16/11] w-full overflow-hidden bg-cream-100">
                          <img
                            src={char.characterImageUrl}
                            alt={char.name}
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover/card:scale-105"
                          />

                          <div className="absolute top-2 left-2">
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full border backdrop-blur-xs bg-white/90 text-stone-800 border-stone-200/80">
                              {char.universe}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-terracotta-500 text-white flex items-center justify-center shadow-soft">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                          )}

                          {/* Botón flotante para ver imagen en tamaño completo */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewCharacterModal(char);
                            }}
                            aria-label={`Ver imagen completa de ${char.name}`}
                            title="Ver imagen en tamaño completo"
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all duration-150 hover:scale-110 z-10"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Información Compacta */}
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-terracotta-600 block truncate">
                              {char.characterTitle}
                            </span>
                            <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 mt-0.5 truncate">
                              {char.name}
                            </h3>
                            <p className="text-[11px] text-stone-500 leading-snug mt-1 line-clamp-2">
                              {char.description}
                            </p>
                          </div>

                          <div className="pt-1.5">
                            <span
                              className={`w-full py-1.5 px-2.5 rounded-full text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                                isSelected
                                  ? "bg-terracotta-50 text-terracotta-700 border border-terracotta-100"
                                  : "bg-cream-100 text-stone-700 group-hover/card:bg-cream-200"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Seleccionado</span>
                                </>
                              ) : (
                                <span>Seleccionar</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                            scrollToCreatePortrait();
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
                ref={createPortraitBtnRef}
                onClick={handleStartFusion}
                className="w-full py-4 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-soft transition-all focus:outline-none focus:ring-4 focus:ring-emerald-700/30"
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

        {/* Modal Lightbox para previsualizar imagen de personaje en tamaño completo */}
        {previewCharacterModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Previsualización de ${previewCharacterModal.name}`}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setPreviewCharacterModal(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            >
              {/* Barra superior con título y botón de cierre */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800/80 bg-stone-900/90">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta-400 block">
                    {previewCharacterModal.universe} · {previewCharacterModal.characterTitle}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-white">
                    {previewCharacterModal.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewCharacterModal(null)}
                  aria-label="Cerrar vista previa"
                  className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Imagen completa en alta fidelidad sin recortes */}
              <div className="relative flex-1 min-h-0 bg-stone-950/80 flex items-center justify-center p-3 sm:p-5 overflow-auto">
                <img
                  src={previewCharacterModal.characterImageUrl}
                  alt={previewCharacterModal.name}
                  className="max-h-[62vh] sm:max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-stone-800"
                />
              </div>

              {/* Barra inferior con descripción y botón para seleccionar estilo */}
              <div className="p-4 sm:p-5 border-t border-stone-800/80 bg-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-stone-300 leading-relaxed max-w-md text-center sm:text-left">
                  {previewCharacterModal.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCharacter(previewCharacterModal);
                    setUseCustomTheme(false);
                    setPreviewCharacterModal(null);
                    scrollToCreatePortrait();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Elegir este estilo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: VER EL RETRATO FINAL */}
        {/* ========================================================================= */}
        {!isGenerating && step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Bar Header */}
            <div className="pb-6 border-b border-cream-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-100 text-sage-700 text-xs font-medium mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                <span>2 propuestas artísticas listas para tu elección</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-stone-900">
                {secondPetImage ? "Retrato Doble" : "Retrato"} ·{" "}
                <span className="text-terracotta-600">{activeThemeName}</span>
              </h2>
            </div>

            {/* Simulation Warning Banner when APIs exceed quota (429) */}
            {isSimulationJob && (
              <div className="p-4 sm:p-5 rounded-2xl bg-red-50/95 border-2 border-red-300 text-red-900 text-xs flex items-start gap-3.5 shadow-soft animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="font-bold text-red-950 text-sm">
                    Muestra de Ilustración de Estudio (Modo Demostración)
                  </p>
                  <p className="text-red-800 leading-relaxed text-xs">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left 7 Columns: Dual Option Selector + Artwork Viewer */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-5">
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
                              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0 select-none shadow-xs"
                            >
                              <img
                                src={variant.imageUrl}
                                alt={proposalTitle}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-300"
                              />
                              {isActiveVariant && (
                                <div className="absolute inset-0 bg-[#174B3D]/15 backdrop-blur-[1px] flex items-center justify-center">
                                  <span className="w-7 h-7 rounded-full bg-[#174B3D] text-white flex items-center justify-center shadow-soft ring-2 ring-white/80">
                                    <Check className="w-4 h-4 stroke-[3] text-[#c6a26c]" />
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="text-xs font-bold text-[#174B3D]">
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
                <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-full bg-white border border-cream-200 shadow-soft">
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => {
                        setViewMode("fusion");
                        setIsZoomActive(false);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        viewMode === "fusion"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-cream-100"
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
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        viewMode === "compare"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-cream-100"
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5" />
                      <span>Comparar Original</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode("room");
                        setIsZoomActive(false);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        viewMode === "room"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-cream-100"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5 text-[#c6a26c]" />
                      <span>Ver en Sala (Escala)</span>
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
                  className={`relative rounded-3xl overflow-hidden border border-cream-200 min-h-[480px] flex flex-col items-center justify-center p-3 sm:p-6 select-none shadow-soft transition-colors ${
                    viewMode === "room" ? "bg-[#ece9e2]/50" : "bg-cream-100"
                  }`}
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

                      {/* Nombre de la mascota en tipografía Brush en color blanco estilo autógrafo (esquina inferior derecha en diagonal) */}
                      {includePetInscription && petInscriptionName.trim() && (
                        <div className="absolute bottom-12 right-6 sm:bottom-16 sm:right-8 z-20 pointer-events-none select-none max-w-[75%] sm:max-w-[70%] text-right transform -rotate-[6deg] sm:-rotate-[7deg] origin-bottom-right">
                          <span
                            className={`font-brush ${
                              petInscriptionName.trim().length > 16
                                ? "text-base sm:text-xl md:text-2xl"
                                : petInscriptionName.trim().length > 11
                                ? "text-xl sm:text-2xl md:text-3xl"
                                : petInscriptionName.trim().length > 6
                                ? "text-2xl sm:text-3xl md:text-4xl"
                                : "text-3xl sm:text-4xl md:text-5xl"
                            } text-white tracking-wide font-normal leading-none select-none whitespace-nowrap block`}
                          >
                            {petInscriptionName.trim()}
                          </span>
                        </div>
                      )}

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

                  {/* MODE 3: ROOM SCALE VIEWPORT (Ver en Sala a Escala Real) */}
                  {viewMode === "room" && (
                    <div
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative w-fit max-w-full rounded-2xl overflow-hidden border border-cream-200 bg-[#EFEFEF] shadow-card select-none animate-in fade-in duration-200 mx-auto"
                    >
                      {/* Imagen de fondo de la sala con marcas guía de medidas (en proporción 819x1024 nativa sin recorte) */}
                      <img
                        src="/images/room-sizes-reference.png"
                        alt="Escala de tamaños de cuadros en sala"
                        draggable={false}
                        className="block w-auto max-w-full max-h-[60vh] sm:max-h-[66vh] object-contain pointer-events-none select-none mx-auto"
                      />

                      {/* Cuadro dinámico posicionado y dimensionado sobre la pared */}
                      <div
                        style={{
                          left: `${currentRoomCoords.left}%`,
                          bottom: `${currentRoomCoords.bottom}%`,
                          width: `${currentRoomCoords.width}%`,
                          height: `${currentRoomCoords.height}%`,
                        }}
                        className="absolute transition-all duration-500 ease-out z-10 pointer-events-auto group cursor-pointer"
                        title={`${selectedPrintPreset.cmDimensions} - ${selectedPrintPreset.tier}`}
                      >
                        {/* Efecto bastidor de lienzo 3D con sombra profunda sobre la pared */}
                        <div className="relative w-full h-full rounded-xs shadow-[0_14px_36px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] ring-1 ring-black/20 overflow-hidden bg-stone-900 transition-shadow">
                          <img
                            src={
                              fusedResultUrl ||
                              selectedCharacter.fusionSampleUrl
                            }
                            alt="Vista previa a escala en sala"
                            draggable={false}
                            className="w-full h-full object-cover pointer-events-none select-none"
                          />

                          {/* Nombre de la mascota si está activo */}
                          {includePetInscription &&
                            petInscriptionName.trim() && (
                              <div className="absolute bottom-1 right-1.5 sm:bottom-2 sm:right-2 z-20 pointer-events-none select-none max-w-[75%] text-right transform -rotate-[6deg] origin-bottom-right">
                                <span
                                  style={{
                                    fontFamily:
                                      "'Caveat', 'Dancing Script', cursive, sans-serif",
                                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                                  }}
                                  className="font-brush text-white tracking-wide font-normal leading-none select-none whitespace-nowrap block drop-shadow-md text-[8px] sm:text-xs md:text-sm"
                                >
                                  {petInscriptionName.trim()}
                                </span>
                              </div>
                            )}

                          {/* Marca de agua de protección ligera en sala */}
                          <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-20">
                            <img
                              src="/logo-light.png"
                              alt=""
                              className="w-16 sm:w-20 object-contain -rotate-12"
                            />
                          </div>

                          {/* Etiqueta de Medida sobre el Cuadro */}
                          <div className="absolute top-1 left-1 bg-stone-900/85 backdrop-blur-xs text-white text-[7px] sm:text-[9px] font-semibold px-1.5 py-0.5 rounded-xs shadow-xs border border-white/20 whitespace-nowrap pointer-events-none">
                            {selectedPrintPreset.cmDimensions}
                          </div>
                        </div>
                      </div>

                      {/* Barra flotante superior indicadora del tamaño actual */}
                      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-cream-200 shadow-soft text-xs text-stone-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="font-semibold text-stone-900">
                          {selectedPrintPreset.cmDimensions}
                        </span>
                        <span className="text-stone-400">·</span>
                        <span className="text-stone-600 font-medium">
                          {selectedPrintPreset.tier}
                        </span>
                      </div>

                      {/* Selector Rápido de Tamaños en la parte inferior de la sala */}
                      <div className="absolute bottom-3 left-3 right-3 z-20 bg-stone-900/90 backdrop-blur-md p-2 rounded-2xl border border-stone-800 shadow-xl flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 px-2 shrink-0">
                          Escala:
                        </span>
                        {catalogSizes.map((preset) => {
                          const isCurrent =
                            selectedPrintPreset.id === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setSelectedPrintPreset(preset)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                                isCurrent
                                  ? "bg-[#174B3D] text-white ring-1 ring-[#c6a26c]"
                                  : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white"
                              }`}
                            >
                              {preset.cmDimensions}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customizations: Nombre Brush + Dedicatoria para Regalo en Grid 2 Cols */}
                <div
                  ref={customizationsSectionRef}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Nombre de Mascota en Tipografía Brush (Firma de Atelier) */}
                  <div className="bg-white border border-cream-200 rounded-3xl p-4 sm:p-5 shadow-soft flex flex-col justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-[#c6a26c] flex items-center justify-center shrink-0">
                        <PenTool className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-stone-900 flex flex-wrap items-center gap-1.5">
                          <span>Nombre de Mascota (Brush)</span>
                          {includePetInscription &&
                            petInscriptionName.trim() && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#174B3D] bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
                                Activo
                              </span>
                            )}
                        </h4>
                        <p className="text-stone-500 text-[11px] mt-0.5 leading-relaxed">
                          {includePetInscription && petInscriptionName.trim()
                            ? `Inscribiendo: "${petInscriptionName.trim()}" en pincel blanco.`
                            : "Lienzo artístico sin texto. Puedes activar el nombre."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-cream-100">
                      <button
                        type="button"
                        onClick={() =>
                          setIncludePetInscription(!includePetInscription)
                        }
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          includePetInscription
                            ? "bg-[#174B3D] text-white border-[#174B3D] shadow-xs"
                            : "bg-cream-50 text-stone-700 border-cream-200 hover:bg-cream-100"
                        }`}
                      >
                        <PenTool
                          className={`w-3.5 h-3.5 ${
                            includePetInscription
                              ? "text-[#c6a26c]"
                              : "text-stone-400"
                          }`}
                        />
                        <span>
                          {includePetInscription
                            ? "Con Nombre"
                            : "Activar Nombre"}
                        </span>
                      </button>
                      {includePetInscription && (
                        <input
                          type="text"
                          value={petInscriptionName}
                          onChange={(e) =>
                            setPetInscriptionName(e.target.value)
                          }
                          placeholder="Nombre de mascota"
                          maxLength={35}
                          className="px-3 py-1.5 rounded-xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:outline-none focus:border-[#174B3D] flex-1 min-w-[120px]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Dedicatoria para Regalo (Opcional) */}
                  <div className="bg-white border border-cream-200 rounded-3xl p-4 sm:p-5 shadow-soft flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center flex-shrink-0 border border-terracotta-200/50">
                          <Gift className="w-4 h-4 text-terracotta-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                              Nota de Dedicatoria
                            </h4>
                            <span className="text-[10px] font-semibold text-terracotta-700 bg-terracotta-50 px-2 py-0.5 rounded-full border border-terracotta-200/60">
                              Opcional
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            ¿Es un regalo? Escribe un mensaje o dedicatoria.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={dedicationNote}
                        onChange={(e) =>
                          setDedicationNote(e.target.value.slice(0, 300))
                        }
                        placeholder="Ej: Con todo el amor para mamá en su cumpleaños..."
                        rows={2}
                        maxLength={300}
                        className="w-full rounded-2xl border border-cream-200 bg-cream-50/50 p-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-500 focus:bg-white focus:ring-1 focus:ring-terracotta-500/20 transition-all resize-none shadow-xs"
                      />
                      <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-stone-400">
                        <span>Tarjeta física adjunta</span>
                        <span className={dedicationNote.length >= 280 ? "text-terracotta-600 font-semibold" : ""}>
                          {dedicationNote.length}/300
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: Predefined Print Sizes & Order Details */}
              <div className="lg:col-span-5 xl:col-span-5 space-y-5">
                {/* Card 1: Detalles del producto (Medidas, Bastidor y Lienzo Canvas) */}
                <div className="bg-white border border-cream-200 rounded-3xl p-5 sm:p-6 shadow-soft space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-terracotta-600 text-xs font-semibold uppercase tracking-wider">
                      <Printer className="w-4 h-4" />
                      <span>Impresión en Alta Calidad (300 DPI)</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900">
                      Guía de tamaños
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Elige el tamaño ideal según el espacio y el protagonismo que quieras darle a tu cuadro.
                    </p>
                  </div>

                  {/* Dynamic Size List: Grid de 2 columnas compacto y optimizado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {catalogSizes.map((preset, idx) => {
                      const isSelected = selectedPrintPreset.id === preset.id;
                      const isLastOdd =
                        idx === catalogSizes.length - 1 &&
                        catalogSizes.length % 2 !== 0;

                      return (
                        <div
                          key={preset.id}
                          onClick={() => setSelectedPrintPreset(preset)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isLastOdd ? "sm:col-span-2" : ""
                          } ${
                            isSelected
                              ? "border-terracotta-500 bg-terracotta-50/40 ring-1 ring-terracotta-500/20 shadow-xs"
                              : "border-cream-200 bg-cream-50/50 hover:border-stone-300 hover:bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Frame
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected
                                      ? "text-terracotta-600"
                                      : "text-stone-400"
                                  }`}
                                />
                                <span className="text-xs font-bold text-stone-900 truncate">
                                  {preset.tier}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-terracotta-600 shrink-0">
                                S/ {preset.pricePen.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-[11px] font-medium text-stone-500 mt-0.5">
                              {preset.cmDimensions} · {preset.inchDimensions}
                            </div>
                          </div>

                          <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                            {preset.recommendedUse}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Formato, Presentación y Material en 2 Columnas */}
                  <div className="pt-3 border-t border-cream-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3.5 rounded-2xl border border-cream-200 bg-cream-50/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-stone-900 text-[#c6a26c] flex items-center justify-center flex-shrink-0">
                          <Frame className="w-4 h-4 text-[#c6a26c]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900">
                            Bastidor de Madera
                          </p>
                          <p className="text-[10px] text-stone-600 truncate">
                            Full Screen · Listo para colgar
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#174B3D] bg-white px-2 py-0.5 rounded-full border border-sage-200 whitespace-nowrap">
                        Incluido
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl border border-cream-200 bg-cream-50/60 flex items-center text-xs">
                      <p className="flex items-center gap-2 text-[11px] font-medium text-stone-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#174B3D] shrink-0" />
                        <span>Los cuadros son elaborados en lienzo de tela canvas.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Detalles de la orden (Tiempos de Entrega, Resumen de precios y totales, y botones) */}
                <div className="bg-white border border-cream-200 rounded-3xl p-5 sm:p-6 shadow-soft space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#c6a26c]" />
                      <span>Detalles de la orden</span>
                    </h3>
                  </div>

                  {/* Tiempos de Entrega */}
                  <div className="p-3.5 rounded-2xl border border-[#c6a26c]/35 bg-[#FFFBF2] text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-[#174B3D]">
                      <Truck className="w-4 h-4 text-[#c6a26c] shrink-0" />
                      <span>Tiempos de Entrega</span>
                    </div>
                    <ul className="text-[11px] text-stone-700 space-y-1 pl-1">
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#c6a26c] font-bold">•</span>
                        <span><strong>Envíos a Lima Metropolitana:</strong> Tu pedido llegará en 3 a 5 días hábiles luego de realizada la compra.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#c6a26c] font-bold">•</span>
                        <span><strong>Envíos a provincia y otros distritos:</strong> Tu pedido llegará en 5 a 7 días hábiles luego de realizada la compra.</span>
                      </li>
                    </ul>
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
                    onClick={handleOrderButtonClick}
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

        {/* Modal de Confirmación: Cuadro sin Nombre ni Dedicatoria */}
        {showNoCustomizationModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirmación de personalización del cuadro"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowNoCustomizationModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 border border-cream-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            >
              {/* Botón de Cierre X */}
              <button
                type="button"
                onClick={() => setShowNoCustomizationModal(false)}
                aria-label="Cerrar modal"
                className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-cream-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Encabezado con Icono Informativo */}
              <div className="flex items-start gap-3.5 pr-6">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                    ¿Confirmar pedido sin nombre ni dedicatoria?
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Notamos que no has añadido el nombre de tu mascota en el lienzo ni una tarjeta de dedicatoria.
                  </p>
                </div>
              </div>

              {/* Resumen del Estado de Personalización */}
              <div className="rounded-2xl bg-cream-50/80 border border-cream-200 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-stone-600 flex items-center gap-2">
                    <PenTool className="w-3.5 h-3.5 text-[#c6a26c]" />
                    <span>Nombre en el lienzo:</span>
                  </span>
                  <span className="font-semibold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-cream-200 text-[11px]">
                    {includePetInscription && petInscriptionName.trim()
                      ? petInscriptionName.trim()
                      : "Sin texto (Solo arte puro)"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-stone-600 flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5 text-terracotta-500" />
                    <span>Tarjeta de dedicatoria:</span>
                  </span>
                  <span className="font-semibold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-cream-200 text-[11px]">
                    {dedicationNote.trim() ? "Incluida" : "Sin dedicatoria"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                El cuadro físico se confeccionará como una obra de arte limpia sin inscripciones. ¿Deseas agregar el nombre o continuar directo al pago?
              </p>

              {/* Acciones */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoCustomizationModal(false);
                    setTimeout(() => {
                      customizationsSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 100);
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all"
                >
                  <PenTool className="w-4 h-4 text-[#c6a26c]" />
                  <span>Deseo agregar Nombre o Dedicatoria</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowNoCustomizationModal(false);
                    handleProceedToCheckout();
                  }}
                  className="w-full py-2.5 px-5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 text-xs font-medium flex items-center justify-center transition-all"
                >
                  <span>Continuar sin texto · Proceder al Pago</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
