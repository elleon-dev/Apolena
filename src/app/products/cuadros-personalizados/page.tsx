"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Header } from "@/components/Header";
import { ProtectedArtworkCanvas } from "@/components/ProtectedArtworkCanvas";
import {
  AppliedCouponClient,
  CouponInputBox,
} from "@/components/CouponInputBox";
import { MobileStep3AppShell } from "@/components/MobileStep3AppShell";
import SocialShareModal from "@/components/SocialShareModal";
import { FAMOUS_CHARACTERS, FamousCharacter } from "@/data/characters";
import {
  AIProviderId,
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
import {
  SavedStudioCreation,
  loadSavedCreations,
  upsertSavedCreation,
  removeSavedCreation,
  getActiveCreationId,
  setActiveCreationId,
  mapJobToSavedCreation,
} from "@/lib/studio-drafts";
import {
  trackPetPhotoUploaded,
  trackPortraitGenerated,
  trackBeginCheckout,
} from "@/lib/analytics";
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
  Maximize2,
  AlertCircle,
  Plus,
  X,
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
  Truck,
  Home,
  Palette,
  Share2,
} from "lucide-react";

/**
 * Coordenadas porcentuales exactas sobre el mockup de sala (public/images/room-sizes-reference-2.png)
 * Dimensiones base: 1296 x 1616 px. El cuadro se posiciona centrado horizontalmente al 50%
 * sobre la pared y encima del mueble/credenza flotante.
 */
const ROOM_SCALE_COORDINATES: Record<
  string,
  { width: number; height: number; left: number; bottom: number }
> = {
  "size-20x30": { width: 10.62, height: 12.4, left: 44.69, bottom: 41.41 },
  "size-30x20": { width: 10.62, height: 12.4, left: 44.69, bottom: 41.41 },
  "size-30x40": { width: 14.5, height: 16.5, left: 42.75, bottom: 41.41 },
  "size-40x60": { width: 21.25, height: 24.71, left: 39.38, bottom: 41.41 },
  "size-60x40": { width: 21.25, height: 24.71, left: 39.38, bottom: 41.41 },
  "size-50x70": { width: 25.5, height: 29.5, left: 37.25, bottom: 41.41 },
  "size-60x90": { width: 31.87, height: 37.01, left: 34.07, bottom: 41.41 },
  "size-90x60": { width: 31.87, height: 37.01, left: 34.07, bottom: 41.41 },
  "size-45x30": { width: 15.99, height: 18.55, left: 42.0, bottom: 41.41 },
  "size-75x50": { width: 26.62, height: 30.96, left: 36.69, bottom: 41.41 },
  "size-105x70": { width: 37.24, height: 43.36, left: 31.38, bottom: 41.41 },
  "size-120x80": { width: 42.49, height: 49.51, left: 28.75, bottom: 41.41 },
};

/**
 * Calcula el estilo visual dinámico de la moldura/marco en la vista previa del Paso 3
 * según el marco elegido por el usuario (solo visual en el visor).
 */
function getVisualFramePresentation(frame?: FrameOption | null): {
  isFramed: boolean;
  outerStyle: React.CSSProperties;
  innerStyle: React.CSSProperties;
  roomOuterStyle: React.CSSProperties;
  cornerColor: string;
} {
  const id = (frame?.id || "").toLowerCase();
  const name = (frame?.name || "").toLowerCase();
  const hex = frame?.colorHex || "#1C1917";

  // 1. Canvas - Estilo 3D (Sin marco externo, solo bastidor)
  if (
    !frame ||
    id === "canvas-bastidor" ||
    (frame.priceModifierPen === 0 &&
      (id.includes("canvas") ||
        name.includes("lienzo") ||
        name.includes("bastidor")))
  ) {
    return {
      isFramed: false,
      outerStyle: {
        padding: 0,
        borderRadius: "0.5rem",
        boxShadow:
          "0 25px 50px -12px rgba(28, 25, 23, 0.45), 4px 8px 24px -2px rgba(0, 0, 0, 0.28)",
      },
      innerStyle: {
        borderRadius: "0.5rem",
      },
      roomOuterStyle: {
        padding: 0,
      },
      cornerColor: "transparent",
    };
  }

  // 2. Marco Minimalista Negro
  if (id.includes("black") || name.includes("negro")) {
    return {
      isFramed: true,
      outerStyle: {
        padding: "16px",
        borderRadius: "6px",
        background:
          "linear-gradient(135deg, #2d2a28 0%, #181615 48%, #0d0c0b 100%)",
        border: "1px solid #3d3936",
        boxShadow:
          "0 28px 55px -12px rgba(15, 14, 13, 0.55), 6px 12px 28px -4px rgba(0, 0, 0, 0.38), inset 1px 1px 2px rgba(255, 255, 255, 0.14), inset -2px -2px 4px rgba(0, 0, 0, 0.75)",
      },
      innerStyle: {
        borderRadius: "2px",
        boxShadow: "0 0 0 3px #090808, 0 4px 12px rgba(0, 0, 0, 0.7)",
      },
      roomOuterStyle: {
        padding: "4px",
        background: "linear-gradient(135deg, #2d2a28 0%, #121110 100%)",
        boxShadow: "inset 0 0 0 1px #090808",
      },
      cornerColor: "rgba(255,255,255,0.12)",
    };
  }

  // 3. Marco Minimalista Natural (Madera)
  if (id.includes("natural") || name.includes("natural")) {
    return {
      isFramed: true,
      outerStyle: {
        padding: "16px",
        borderRadius: "6px",
        background:
          "linear-gradient(135deg, #dbb88e 0%, #c39764 45%, #a57946 100%)",
        border: "1px solid #8f6536",
        boxShadow:
          "0 28px 55px -12px rgba(45, 30, 15, 0.48), 6px 12px 28px -4px rgba(0, 0, 0, 0.3), inset 1.5px 1.5px 3px rgba(255, 245, 225, 0.55), inset -2px -2px 5px rgba(85, 50, 18, 0.5)",
      },
      innerStyle: {
        borderRadius: "2px",
        boxShadow: "0 0 0 3px #5e3f1f, 0 4px 12px rgba(0, 0, 0, 0.55)",
      },
      roomOuterStyle: {
        padding: "4px",
        background: "linear-gradient(135deg, #dbb88e 0%, #a57946 100%)",
        boxShadow: "inset 0 0 0 1px #5e3f1f",
      },
      cornerColor: "rgba(94, 63, 31, 0.35)",
    };
  }

  // 4. Marco Minimalista Blanco
  if (id.includes("white") || name.includes("blanco")) {
    return {
      isFramed: true,
      outerStyle: {
        padding: "16px",
        borderRadius: "6px",
        background:
          "linear-gradient(135deg, #ffffff 0%, #f5f2ec 52%, #e5e0d5 100%)",
        border: "1px solid #d5cfc3",
        boxShadow:
          "0 28px 55px -12px rgba(28, 25, 23, 0.42), 6px 12px 28px -4px rgba(0, 0, 0, 0.25), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.95), inset -2px -2px 5px rgba(155, 145, 130, 0.38)",
      },
      innerStyle: {
        borderRadius: "2px",
        boxShadow: "0 0 0 3px #bdb5a6, 0 4px 12px rgba(0, 0, 0, 0.35)",
      },
      roomOuterStyle: {
        padding: "4px",
        background: "linear-gradient(135deg, #ffffff 0%, #e5e0d5 100%)",
        boxShadow: "inset 0 0 0 1px #bdb5a6",
      },
      cornerColor: "rgba(160, 150, 135, 0.38)",
    };
  }

  // 5. Marco Madera Gold (Dorado Imperial)
  if (id.includes("gold") || name.includes("gold") || name.includes("dorado")) {
    return {
      isFramed: true,
      outerStyle: {
        padding: "17px",
        borderRadius: "6px",
        background:
          "linear-gradient(135deg, #f0d584 0%, #cda235 32%, #9e7314 68%, #e2c265 100%)",
        border: "1px solid #87600d",
        boxShadow:
          "0 28px 55px -12px rgba(40, 28, 8, 0.52), 6px 12px 28px -4px rgba(0, 0, 0, 0.34), inset 2px 2px 4px rgba(255, 246, 200, 0.75), inset -2px -2px 5px rgba(90, 60, 8, 0.65)",
      },
      innerStyle: {
        borderRadius: "2px",
        boxShadow: "0 0 0 3px #5c4007, 0 4px 14px rgba(0, 0, 0, 0.6)",
      },
      roomOuterStyle: {
        padding: "4px",
        background: "linear-gradient(135deg, #f0d584 0%, #9e7314 100%)",
        boxShadow: "inset 0 0 0 1px #5c4007",
      },
      cornerColor: "rgba(92, 64, 7, 0.45)",
    };
  }

  // 6. Cualquier otro marco dinámico configurado en el Dashboard
  return {
    isFramed: true,
    outerStyle: {
      padding: "16px",
      borderRadius: "6px",
      backgroundColor: hex,
      border: "1px solid rgba(0,0,0,0.25)",
      boxShadow:
        "0 28px 55px -12px rgba(28, 25, 23, 0.48), 6px 12px 28px -4px rgba(0, 0, 0, 0.32), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.3), inset -2px -2px 5px rgba(0, 0, 0, 0.4)",
    },
    innerStyle: {
      borderRadius: "2px",
      boxShadow: "0 0 0 3px rgba(0,0,0,0.6), 0 4px 12px rgba(0, 0, 0, 0.5)",
    },
    roomOuterStyle: {
      padding: "4px",
      backgroundColor: hex,
    },
    cornerColor: "rgba(0,0,0,0.25)",
  };
}

export default function personalizedWallArt() {
  const router = useRouter();
  // 3-step state: 1 = Choose Character/Theme, 2 = Upload Pet Photo, 3 = Result Portrait
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Pet Images (1 mandatory, up to 2 optional extra angles of the SAME pet, or 2nd pet for duo portrait)
  const [petImage, setPetImage] = useState<string | null>(null);
  const [extraPetImages, setExtraPetImages] = useState<string[]>([]);
  const [secondPetImage, setSecondPetImage] = useState<string | null>(null);
  const extraPetInputRef = useRef<HTMLInputElement>(null);
  const [isValidatingPetPhoto, setIsValidatingPetPhoto] = useState(false);
  const [petSpecies, setPetSpecies] = useState<"dog" | "cat" | "other">("dog");
  const [includePetInscription, setIncludePetInscription] =
    useState<boolean>(false);
  const [petInscriptionName, setPetInscriptionName] = useState<string>("");
  const [dedicationNote, setDedicationNote] = useState<string>("");
  const [isSimulationJob, setIsSimulationJob] = useState<boolean>(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);
  const [isSendingQuotaAlert, setIsSendingQuotaAlert] = useState(false);
  const [quotaAlertSent, setQuotaAlertSent] = useState(false);

  // Dynamic Catalog from Supabase (products.customization_config)
  const [wallArtProductId, setWallArtProductId] = useState<string>(
    "00000000-0000-4000-8000-000000000101",
  );
  const [catalogCharacters, setCatalogCharacters] = useState<FamousCharacter[]>(
    [],
  );
  const [catalogSizes, setCatalogSizes] =
    useState<PrintPreset[]>(PRINT_PRESETS);
  const [catalogFrames, setCatalogFrames] =
    useState<FrameOption[]>(FRAME_OPTIONS);
  const [previewFrame, setPreviewFrame] = useState<FrameOption | null>(null);
  const [previewFrameImgIdx, setPreviewFrameImgIdx] = useState(0);
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
  const [hasSelectedCharacter, setHasSelectedCharacter] = useState(false);
  const [customThemeImage, setCustomThemeImage] = useState<string | null>(null);
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // Multi-Model Provider selection (credenciales gestionadas exclusivamente en el servidor .env)
  const [selectedProvider, setSelectedProvider] =
    useState<AIProviderId>("openai");

  const handleSendQuotaAlert = useCallback(async () => {
    if (isSendingQuotaAlert || quotaAlertSent) return;
    setIsSendingQuotaAlert(true);
    try {
      const res = await fetch("/api/ai-quota-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          reason:
            simulationNotice ||
            "Límite de cuota o saldo alcanzado en la generación de retratos.",
        }),
      });
      if (res.ok) {
        setQuotaAlertSent(true);
      }
    } catch {
      // ignore network error
    } finally {
      setIsSendingQuotaAlert(false);
    }
  }, [isSendingQuotaAlert, quotaAlertSent, selectedProvider, simulationNotice]);
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
  const [errorNotification, setErrorNotification] = useState<{
    title: string;
    description: string;
  } | null>(null);

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
      PRINT_PRESETS.find(
        (p) => p.isAvailable !== false && p.cmDimensions.includes("40 × 60"),
      ) ||
      PRINT_PRESETS.find((p) => p.isAvailable !== false) ||
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
  const continueToUploadBtnRef = useRef<HTMLButtonElement>(null);
  const createPortraitBtnRef = useRef<HTMLButtonElement>(null);
  const customizationsSectionRef = useRef<HTMLDivElement>(null);
  const [previewCharacterModal, setPreviewCharacterModal] =
    useState<FamousCharacter | null>(null);
  const [showNoCustomizationModal, setShowNoCustomizationModal] =
    useState<boolean>(false);
  const [showPhotoGuideModal, setShowPhotoGuideModal] =
    useState<boolean>(false);
  const [showSocialShareModal, setShowSocialShareModal] =
    useState<boolean>(false);
  const [savedCreations, setSavedCreations] = useState<SavedStudioCreation[]>(
    [],
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthGateModal, setShowAuthGateModal] = useState<boolean>(false);
  const [authGateReason, setAuthGateReason] = useState<
    "generation" | "checkout"
  >("generation");
  const [pendingAutoGenerate, setPendingAutoGenerate] =
    useState<boolean>(false);
  const [showFeedbackOptions, setShowFeedbackOptions] =
    useState<boolean>(false);
  const [feedbackSentJobId, setFeedbackSentJobId] = useState<string | null>(
    null,
  );
  const [appliedCoupon, setAppliedCoupon] =
    useState<AppliedCouponClient | null>(null);

  const handleSubmitPortraitFeedback = async (
    reason: "no_match_pet" | "bad_proportions" | "too_dark" | "cropped_ears",
  ) => {
    if (!activeGenerationJobId) return;
    setFeedbackSentJobId(activeGenerationJobId);
    setShowFeedbackOptions(false);
    try {
      await fetch(`/api/jobs/${encodeURIComponent(activeGenerationJobId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: {
            reason,
            variantId: selectedVariantId || null,
          },
        }),
      });
    } catch {
      // Silencioso: no interrumpir la experiencia del cliente
    }
  };

  const savePendingGenerationForAuth = useCallback(() => {
    try {
      sessionStorage.setItem(
        "apolena_pending_generation_v1",
        JSON.stringify({
          petImage,
          secondPetImage,
          petSpecies,
          selectedCharacter,
          useCustomTheme,
          customThemeImage,
          customPrompt,
          includePetInscription,
          petInscriptionName,
        }),
      );
    } catch {}
  }, [
    petImage,
    secondPetImage,
    petSpecies,
    selectedCharacter,
    useCustomTheme,
    customThemeImage,
    customPrompt,
    includePetInscription,
    petInscriptionName,
  ]);

  const catalogCharactersRef = useRef(catalogCharacters);
  catalogCharactersRef.current = catalogCharacters;
  const catalogSizesRef = useRef(catalogSizes);
  catalogSizesRef.current = catalogSizes;
  const catalogFramesRef = useRef(catalogFrames);
  catalogFramesRef.current = catalogFrames;
  const pendingCharacterIdRef = useRef<string | null>(null);

  const applySavedCreationToStudio = useCallback(
    (creation: SavedStudioCreation, goToStep3: boolean = true) => {
      setActiveGenerationJobId(creation.jobId);
      if (creation.petImageUrl) setPetImage(creation.petImageUrl);
      setSecondPetImage(creation.secondPetImageUrl || null);
      setPetSpecies(creation.petSpecies || "dog");
      setFusedResultUrl(creation.fusedResultUrl);
      if (Array.isArray(creation.variants) && creation.variants.length > 0) {
        setGeneratedVariants(creation.variants);
        const activeVar =
          creation.variants.find((v) => v.id === creation.selectedVariantId) ||
          creation.variants[0];
        setSelectedVariantId(activeVar.id);
        setFusedResultUrl(activeVar.imageUrl);
        if (activeVar.modelUsed) setModelUsedLabel(activeVar.modelUsed);
      }
      setIncludePetInscription(Boolean(creation.includePetInscription));
      setPetInscriptionName(creation.petInscriptionName || "");
      setDedicationNote(creation.dedicationNote || "");
      setIsSimulationJob(false);
      setSimulationNotice(null);

      // Restaurar personaje desde catálogo activo o preservar su ID/nombre mientras carga la BD
      const allChars =
        catalogCharactersRef.current.length > 0
          ? catalogCharactersRef.current
          : FAMOUS_CHARACTERS;
      const matchedChar = allChars.find(
        (c) =>
          c.id === creation.characterId ||
          c.id.toLowerCase() === creation.characterId.toLowerCase(),
      );
      if (matchedChar) {
        pendingCharacterIdRef.current = null;
        setSelectedCharacter(matchedChar);
        setHasSelectedCharacter(true);
        setUseCustomTheme(false);
      } else if (creation.characterId) {
        pendingCharacterIdRef.current = creation.characterId;
        setSelectedCharacter((prev) => ({
          ...prev,
          id: creation.characterId,
          name: creation.characterName || prev.name,
        }));
        setHasSelectedCharacter(true);
        setUseCustomTheme(creation.characterId === "custom-reference");
      }

      // Restaurar tamaño de impresión elegido
      if (creation.selectedPrintPresetId) {
        const matchedSize = catalogSizesRef.current.find(
          (s) => s.id === creation.selectedPrintPresetId,
        );
        if (matchedSize) setSelectedPrintPreset(matchedSize);
      }

      // Restaurar marco elegido
      if (creation.selectedFrameId) {
        const matchedFrame = catalogFramesRef.current.find(
          (f) => f.id === creation.selectedFrameId,
        );
        if (matchedFrame) setSelectedFrame(matchedFrame);
      }

      setActiveCreationId(creation.jobId);
      if (typeof window !== "undefined") {
        const nextUrl = `${window.location.pathname}?job=${encodeURIComponent(creation.jobId)}`;
        window.history.replaceState({}, "", nextUrl);
      }

      if (goToStep3) {
        setStep(3);
      }
    },
    [],
  );

  const triggerErrorNotification = useCallback(
    (title: string, description: string) => {
      setFusionError(description);
      setErrorNotification({ title, description });
    },
    [],
  );

  useEffect(() => {
    if (!errorNotification) return;
    const timer = setTimeout(() => {
      setErrorNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [errorNotification]);

  const scrollToContinueUpload = () => {
    setTimeout(() => {
      if (continueToUploadBtnRef.current) {
        continueToUploadBtnRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        continueToUploadBtnRef.current.focus({ preventScroll: true });
      }
    }, 100);
  };

  const scrollToCreatePortrait = () => {
    setTimeout(() => {
      if (createPortraitBtnRef.current) {
        createPortraitBtnRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        createPortraitBtnRef.current.focus({ preventScroll: true });
      }
    }, 250);
  };

  // Restauración inteligente: ?resumeGenerate=1, ?job=<id>, ?character=<slug>, ?step=3 o borrador persistente
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const resumeGenerateParam = params.get("resumeGenerate");
    const jobParam = params.get("job");
    const charParam = params.get("character");
    const stepParam = params.get("step");

    // Verificar estado de sesión actual
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setIsAuthenticated(Boolean(data?.user));
      })
      .catch(() => {
        setIsAuthenticated(false);
      });

    const localCreations = loadSavedCreations();
    setSavedCreations(localCreations);

    const resolveCharName = (id: string) => {
      const match =
        catalogCharactersRef.current.find((c) => c.id === id) ||
        FAMOUS_CHARACTERS.find((c) => c.id === id);
      return match?.name || id;
    };

    // Caso 0: Usuario acaba de iniciar sesión para continuar su 2da+ generación
    if (resumeGenerateParam === "1") {
      try {
        const rawPending = sessionStorage.getItem(
          "apolena_pending_generation_v1",
        );
        if (rawPending) {
          const pending = JSON.parse(rawPending);
          sessionStorage.removeItem("apolena_pending_generation_v1");
          if (pending.petImage) setPetImage(pending.petImage);
          if (pending.secondPetImage !== undefined)
            setSecondPetImage(pending.secondPetImage);
          if (pending.petSpecies) setPetSpecies(pending.petSpecies);
          if (pending.selectedCharacter) {
            pendingCharacterIdRef.current = pending.selectedCharacter.id;
            setSelectedCharacter(pending.selectedCharacter);
            setHasSelectedCharacter(true);
          }
          if (pending.useCustomTheme !== undefined)
            setUseCustomTheme(pending.useCustomTheme);
          if (pending.customThemeImage !== undefined)
            setCustomThemeImage(pending.customThemeImage);
          if (typeof pending.customPrompt === "string")
            setCustomPrompt(pending.customPrompt);
          if (pending.includePetInscription !== undefined)
            setIncludePetInscription(pending.includePetInscription);
          if (typeof pending.petInscriptionName === "string")
            setPetInscriptionName(pending.petInscriptionName);
          setStep(2);
          setPendingAutoGenerate(true);
          window.history.replaceState({}, "", window.location.pathname);
          // Sincronizar en segundo plano sus creaciones previas de BD sin pisar la nueva generación
          fetch("/api/jobs", { cache: "no-store" })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (!Array.isArray(data?.jobs) || data.jobs.length === 0) return;
              const dbCreations = data.jobs
                .map((j: any) => mapJobToSavedCreation(j, resolveCharName))
                .filter(
                  (item: SavedStudioCreation | null): item is SavedStudioCreation =>
                    Boolean(item),
                );
              if (dbCreations.length > 0) {
                setSavedCreations((prev) => {
                  const map = new Map<string, SavedStudioCreation>();
                  for (const item of [...prev, ...dbCreations]) {
                    if (!map.has(item.jobId)) map.set(item.jobId, item);
                  }
                  return Array.from(map.values()).slice(0, 8);
                });
              }
            })
            .catch(() => {});
          return;
        }
      } catch {}
    }

    // Sincronizar historial de creaciones desde PostgreSQL si el usuario tiene sesión iniciada
    fetch("/api/jobs", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!Array.isArray(data?.jobs) || data.jobs.length === 0) return;
        const dbCreations = data.jobs
          .map((j: any) => mapJobToSavedCreation(j, resolveCharName))
          .filter((item: SavedStudioCreation | null): item is SavedStudioCreation =>
            Boolean(item),
          );
        if (dbCreations.length === 0) return;

        setSavedCreations((prev) => {
          const map = new Map<string, SavedStudioCreation>();
          for (const item of [...prev, ...dbCreations]) {
            if (!map.has(item.jobId)) {
              map.set(item.jobId, item);
            }
          }
          const merged = Array.from(map.values())
            .sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            )
            .slice(0, 8);
          for (const c of [...merged].reverse()) {
            upsertSavedCreation(c);
          }
          return merged;
        });

        // Si no había nada en localStorage y el usuario entró sin parámetros, restaurar su última creación de BD
        if (
          !jobParam &&
          !charParam &&
          !stepParam &&
          localCreations.length === 0 &&
          dbCreations[0]
        ) {
          applySavedCreationToStudio(dbCreations[0], true);
        }
      })
      .catch(() => {});

    // Caso 1: Deep-link o recarga directa con ?job=<id>
    if (jobParam) {
      const localMatch = localCreations.find((c) => c.jobId === jobParam);
      if (localMatch) {
        applySavedCreationToStudio(localMatch, true);
      }
      // Hidratar también desde la base de datos para garantizar datos completos y actualizados
      fetch(`/api/jobs/${encodeURIComponent(jobParam)}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.job) return;
          const mapped = mapJobToSavedCreation(data.job, resolveCharName);
          if (mapped) {
            upsertSavedCreation(mapped);
            setSavedCreations((prev) => {
              const filtered = prev.filter((c) => c.jobId !== mapped.jobId);
              return [mapped, ...filtered].slice(0, 8);
            });
            applySavedCreationToStudio(mapped, true);
          }
        })
        .catch(() => {});
      return;
    }

    // Caso 2: Navegación explícita con ?character=<slug> desde la página principal
    if (charParam) {
      const found = FAMOUS_CHARACTERS.find(
        (c) =>
          c.id === charParam ||
          c.id.toLowerCase() === charParam.toLowerCase() ||
          c.id.toLowerCase().includes(charParam.toLowerCase()) ||
          charParam.toLowerCase().includes(c.id.toLowerCase()),
      );
      if (found) {
        setSelectedCharacter(found);
        setHasSelectedCharacter(true);
        setUseCustomTheme(false);
        if (stepParam !== "3") {
          setStep(2);
        }
      }
    }

    // Caso 3: Volver desde /checkout (?step=3)
    if (stepParam === "3") {
      try {
        const raw = sessionStorage.getItem("apolena_studio_state");
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.petImage !== undefined) setPetImage(saved.petImage);
          if (saved.secondPetImage !== undefined)
            setSecondPetImage(saved.secondPetImage);
          if (saved.petSpecies) setPetSpecies(saved.petSpecies);
          if (saved.selectedCharacter) {
            setSelectedCharacter(saved.selectedCharacter);
            setHasSelectedCharacter(true);
          }
          if (saved.useCustomTheme !== undefined)
            setUseCustomTheme(saved.useCustomTheme);
          if (saved.customThemeImage !== undefined)
            setCustomThemeImage(saved.customThemeImage);
          if (typeof saved.fusedResultUrl === "string")
            setFusedResultUrl(saved.fusedResultUrl);
          if (Array.isArray(saved.generatedVariants))
            setGeneratedVariants(saved.generatedVariants);
          if (saved.selectedVariantId)
            setSelectedVariantId(saved.selectedVariantId);
          if (saved.activeGenerationJobId !== undefined)
            setActiveGenerationJobId(saved.activeGenerationJobId);
          if (saved.modelUsedLabel) setModelUsedLabel(saved.modelUsedLabel);
          if (saved.isSimulationJob !== undefined)
            setIsSimulationJob(saved.isSimulationJob);
          if (saved.simulationNotice !== undefined)
            setSimulationNotice(saved.simulationNotice);
          if (saved.selectedPrintPreset)
            setSelectedPrintPreset(saved.selectedPrintPreset);
          if (saved.selectedFrame) setSelectedFrame(saved.selectedFrame);
          if (saved.includePetInscription !== undefined)
            setIncludePetInscription(saved.includePetInscription);
          if (typeof saved.petInscriptionName === "string")
            setPetInscriptionName(saved.petInscriptionName);
          if (typeof saved.dedicationNote === "string")
            setDedicationNote(saved.dedicationNote);
          setStep(3);
          return;
        }
      } catch {}
    }

    // Caso 4: Recarga normal o regreso sin parámetros -> restaurar última creación activa (ahorra tokens)
    if (!charParam && stepParam !== "1" && stepParam !== "2") {
      const activeId = getActiveCreationId();
      const targetCreation =
        (activeId
          ? localCreations.find((c) => c.jobId === activeId)
          : null) || localCreations[0];
      if (targetCreation) {
        applySavedCreationToStudio(targetCreation, true);
      }
    }
  }, [applySavedCreationToStudio]);

  // Auto-guardado en tiempo real de selecciones del Paso 3 (localStorage + PostgreSQL)
  useEffect(() => {
    if (step !== 3 || !activeGenerationJobId || !fusedResultUrl) return;

    const resolvedThemeName = useCustomTheme
      ? "Diseño Propio"
      : selectedCharacter.name;

    const currentSnapshot: SavedStudioCreation = {
      jobId: activeGenerationJobId,
      characterId: selectedCharacter.id,
      characterName: resolvedThemeName,
      petImageUrl: petImage || "",
      secondPetImageUrl: secondPetImage,
      petSpecies,
      fusedResultUrl,
      variants: generatedVariants,
      selectedVariantId,
      selectedPrintPresetId: selectedPrintPreset?.id || null,
      selectedFrameId: selectedFrame?.id || null,
      includePetInscription,
      petInscriptionName,
      dedicationNote,
      productSlug: "cuadros-personalizados",
      updatedAt: new Date().toISOString(),
    };

    upsertSavedCreation(currentSnapshot);
    setSavedCreations((prev) => {
      const exists = prev.some((c) => c.jobId === currentSnapshot.jobId);
      if (!exists) return [currentSnapshot, ...prev].slice(0, 8);
      return prev.map((c) =>
        c.jobId === currentSnapshot.jobId ? currentSnapshot : c,
      );
    });
    setActiveCreationId(activeGenerationJobId);

    const timer = setTimeout(() => {
      fetch(`/api/jobs/${encodeURIComponent(activeGenerationJobId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: "cuadros-personalizados",
          selectedVariantId,
          selectedPrintPresetId: selectedPrintPreset?.id || null,
          selectedFrameId: selectedFrame?.id || null,
          includePetInscription,
          petInscriptionName,
          dedicationNote,
        }),
      }).catch(() => {});
    }, 600);

    return () => clearTimeout(timer);
  }, [
    step,
    activeGenerationJobId,
    fusedResultUrl,
    useCustomTheme,
    selectedCharacter.id,
    selectedCharacter.name,
    petImage,
    secondPetImage,
    petSpecies,
    generatedVariants,
    selectedVariantId,
    selectedPrintPreset?.id,
    selectedFrame?.id,
    includePetInscription,
    petInscriptionName,
    dedicationNote,
  ]);

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

  // Cerrar modal de guía de foto con tecla Escape
  useEffect(() => {
    if (!showPhotoGuideModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPhotoGuideModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPhotoGuideModal]);

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

    const applyDbCharacters = (chars: FamousCharacter[]) => {
      const activeChars = chars.filter((c) => c.isAvailable !== false);
      if (activeChars.length > 0) {
        setCatalogCharacters(activeChars);
        setSelectedCharacter((prev) => {
          if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const charParam = params.get("character");
            const stepParam = params.get("step");
            if (charParam) {
              const match = activeChars.find(
                (c) =>
                  c.id === charParam ||
                  c.id.toLowerCase() === charParam.toLowerCase() ||
                  c.id.toLowerCase().includes(charParam.toLowerCase()) ||
                  charParam.toLowerCase().includes(c.id.toLowerCase()),
              );
              if (match) {
                setHasSelectedCharacter(true);
                setUseCustomTheme(false);
                if (stepParam !== "3") {
                  setStep(2);
                }
                return match;
              }
            }
          }
          const targetId = pendingCharacterIdRef.current || prev.id;
          const found = activeChars.find(
            (c) =>
              c.id === targetId ||
              c.id.toLowerCase() === targetId.toLowerCase(),
          );
          if (found) {
            pendingCharacterIdRef.current = null;
            return found;
          }
          return activeChars[0];
        });
      }
    };

    // Cargar personajes directamente desde la BD (vía /api/templates)
    fetch("/api/templates", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.fromDatabase && Array.isArray(data.templates)) {
          applyDbCharacters(data.templates);
        }
      })
      .catch(() => {});

    // Load dynamic characters, frames, sizes, and finishes for cuadros-personalizados
    fetch("/api/products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
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

        if (Array.isArray(cfg?.characters) && cfg.characters.length > 0) {
          applyDbCharacters(cfg.characters);
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

  // Comprime y valida que la fotografía cargada sea apta para el retrato antes de aceptarla
  const readAndCompressImage = useCallback(
    (file: File, onDone: (dataUrl: string) => void) => {
      const isImage =
        !file.type ||
        file.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|heic|heif|bmp|gif)$/i.test(file.name);

      if (!isImage) {
        triggerErrorNotification(
          "Formato de archivo no válido",
          "Por favor selecciona una imagen válida en formato JPG, PNG o WEBP.",
        );
        return;
      }

      setFusionError(null);
      setErrorNotification(null);
      setIsValidatingPetPhoto(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          try {
            // 1. Canvas principal de compresión para alta resolución (máx 1024px)
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
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
            if (!ctx) throw new Error("No se pudo procesar la fotografía.");

            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

            // 2. Canvas ligero optimizado para validación (máx 512px, ~35KB)
            const detectCanvas = document.createElement("canvas");
            const detectDim = 512;
            let dWidth = img.width;
            let dHeight = img.height;
            if (dWidth > detectDim || dHeight > detectDim) {
              if (dWidth > dHeight) {
                dHeight = Math.round((dHeight * detectDim) / dWidth);
                dWidth = detectDim;
              } else {
                dWidth = Math.round((dWidth * detectDim) / dHeight);
                dHeight = detectDim;
              }
            }
            detectCanvas.width = dWidth;
            detectCanvas.height = dHeight;
            const dCtx = detectCanvas.getContext("2d");
            if (dCtx) {
              dCtx.drawImage(img, 0, 0, dWidth, dHeight);
            }
            const detectDataUrl = detectCanvas.toDataURL("image/jpeg", 0.75);

            // 3. Validación estricta de mascota y facciones visibles con IA visual (servidor)
            let detectedSpecies: string = petSpecies;
            try {
              const res = await fetch("/api/validate-pet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: detectDataUrl }),
              });

              const result = await res.json().catch(() => null);

              if (!res.ok || !result || result.isPet !== true) {
                triggerErrorNotification(
                  "Fotografía no válida",
                  result?.reason ||
                    "La fotografía debe mostrar claramente el rostro y las facciones de una mascota real. No se aceptan personas, ilustraciones, paisajes u objetos.",
                );
                return;
              }

              if (result.species === "dog") {
                setPetSpecies("dog");
                detectedSpecies = "dog";
              } else if (result.species === "cat") {
                setPetSpecies("cat");
                detectedSpecies = "cat";
              } else if (result.species === "other") {
                setPetSpecies("other");
                detectedSpecies = "other";
              }
            } catch (validateErr) {
              console.warn("Fallo en verificación /api/validate-pet:", validateErr);
              triggerErrorNotification(
                "No pudimos validar la fotografía",
                "Verifica tu conexión e intenta subir nuevamente una foto clara del rostro de tu mascota.",
              );
              return;
            }

            setFusionError(null);
            setErrorNotification(null);
            onDone(dataUrl);
            trackPetPhotoUploaded(detectedSpecies);
            scrollToCreatePortrait();
          } catch (processErr) {
            console.error("Error al procesar la fotografía:", processErr);
            triggerErrorNotification(
              "Error al procesar la imagen",
              "No se pudo procesar la fotografía seleccionada. Prueba con otra imagen.",
            );
          } finally {
            setIsValidatingPetPhoto(false);
          }
        };
        img.onerror = () => {
          setIsValidatingPetPhoto(false);
          triggerErrorNotification(
            "No se pudo abrir la imagen",
            "La fotografía no pudo abrirse o está dañada. Prueba con otra imagen JPG, PNG o WEBP.",
          );
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setIsValidatingPetPhoto(false);
        triggerErrorNotification(
          "Error al leer el archivo",
          "No pudimos leer la fotografía seleccionada. Intenta subirla nuevamente.",
        );
      };
      reader.readAsDataURL(file);
    },
    [triggerErrorNotification],
  );

  // Quick Demo Presets
  const loadDemoIncaTwoCats = () => {
    setPetImage("/samples/cat-sample.jpg");
    setSecondPetImage("/samples/cat-suit.jpg");
    setSelectedCharacter(FAMOUS_CHARACTERS[0]);
    setHasSelectedCharacter(true);
    setUseCustomTheme(false);
    setPetSpecies("cat");
    scrollToCreatePortrait();
  };

  const loadDemoDog = () => {
    setPetImage("/samples/dog-sample.jpg");
    setSecondPetImage(null);
    setPetSpecies("dog");
    scrollToCreatePortrait();
  };

  const loadDemoCat = () => {
    setPetImage("/samples/cat-sample.jpg");
    setSecondPetImage(null);
    setPetSpecies("cat");
    scrollToCreatePortrait();
  };

  // Start Portrait Generation
  const handleStartFusion = async () => {
    if (!petImage) return;
    if (!hasSelectedCharacter && !useCustomTheme) {
      setStep(1);
      return;
    }

    // Modelo Híbrido: 1ra creación gratis sin login; 2da+ requiere iniciar sesión conservando la foto
    if (isAuthenticated === false && savedCreations.length >= 1) {
      savePendingGenerationForAuth();
      setAuthGateReason("generation");
      setShowAuthGateModal(true);
      return;
    }

    setIsGenerating(true);
    setFusionError(null);
    setErrorNotification(null);
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
          extraPetImageUrls: secondPetImage ? [] : extraPetImages,
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
      if (
        response.status === 401 ||
        data.code === "AUTH_REQUIRED_FOR_NEXT_GENERATION"
      ) {
        savePendingGenerationForAuth();
        setIsGenerating(false);
        setAuthGateReason("generation");
        setShowAuthGateModal(true);
        return;
      }

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
        let finalSelectedVariantId: string | null = null;
        let finalUrl =
          job.hdOutputImageUrl ||
          job.outputImageUrl ||
          selectedCharacter.fusionSampleUrl;

        if (Array.isArray(job.variants) && job.variants.length > 0) {
          setGeneratedVariants(job.variants);
          const firstVarId: string = String(job.variants[0].id);
          finalSelectedVariantId = firstVarId;
          finalUrl = job.variants[0].imageUrl;
          setSelectedVariantId(firstVarId);
          setFusedResultUrl(finalUrl);
          setModelUsedLabel(job.variants[0].modelUsed);
        } else {
          setFusedResultUrl(finalUrl);
          if (job.modelUsed) setModelUsedLabel(job.modelUsed);
        }
        if (job.executionSeconds) setExecutionSeconds(job.executionSeconds);

        // Guardar inmediatamente el resultado en el carrito de creaciones y fijar ?job=<id> en URL
        if (finalUrl && !job.isSimulation) {
          const snapshot: SavedStudioCreation = {
            jobId,
            characterId: selectedCharacter.id,
            characterName: activeThemeName,
            petImageUrl: job.petImageUrl || petImage || "",
            secondPetImageUrl: job.secondPetImageUrl || secondPetImage,
            petSpecies,
            fusedResultUrl: finalUrl,
            variants: Array.isArray(job.variants) ? job.variants : [],
            selectedVariantId: finalSelectedVariantId,
            selectedPrintPresetId: selectedPrintPreset?.id || null,
            selectedFrameId: selectedFrame?.id || null,
            includePetInscription,
            petInscriptionName,
            dedicationNote,
            productSlug: "cuadros-personalizados",
            updatedAt: new Date().toISOString(),
          };
          upsertSavedCreation(snapshot);
          setSavedCreations((prev) => {
            const filtered = prev.filter((c) => c.jobId !== snapshot.jobId);
            return [snapshot, ...filtered].slice(0, 8);
          });
          setActiveCreationId(jobId);
          trackPortraitGenerated({
            characterId: selectedCharacter.id,
            characterName: activeThemeName,
            species: petSpecies,
            jobId,
          });
          if (typeof window !== "undefined") {
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}?job=${encodeURIComponent(jobId)}`,
            );
          }
        }

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
                triggerErrorNotification(
                  "Error al generar el retrato",
                  resData.job.errorMessage ||
                    "Error en el servicio de generación",
                );
              }
            }
          } catch (err) {
            clearInterval(interval);
            setIsGenerating(false);
            triggerErrorNotification(
              "Error de conexión",
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
            triggerErrorNotification(
              "Error al generar el retrato",
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
      triggerErrorNotification(
        "Error al iniciar la composición",
        err?.message || "Error al iniciar la composición",
      );
    }
  };

  // Reanudar automáticamente la generación pendiente al volver del inicio de sesión
  useEffect(() => {
    if (
      pendingAutoGenerate &&
      isAuthenticated === true &&
      petImage &&
      !isGenerating
    ) {
      setPendingAutoGenerate(false);
      void handleStartFusion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoGenerate, isAuthenticated, petImage, isGenerating]);

  const handleDownload = async (_presetOverride?: PrintPreset) => {
    const sourceUrl = fusedResultUrl || selectedCharacter.fusionSampleUrl;
    if (!sourceUrl) return;

    setIsExportingPrint(true);
    try {
      const exported = await exportWatermarkedPreviewImage(
        sourceUrl,
        activeThemeName,
        includePetInscription ? petInscriptionName.trim() : null,
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
    setHasSelectedCharacter(false);
    setPetImage(null);
    setExtraPetImages([]);
    setSecondPetImage(null);
    setFusedResultUrl("");
    setActiveGenerationJobId(null);
    setFusionError(null);
    setErrorNotification(null);
    setIsGenerating(false);
    setIsSimulationJob(false);
    setSimulationNotice(null);
    setIncludePetInscription(false);
    setPetInscriptionName("");
    setDedicationNote("");
    setGeneratedVariants([]);
    setActiveCreationId(null);
    try {
      sessionStorage.removeItem("apolena_studio_state");
      if (
        typeof window !== "undefined" &&
        (window.location.search.includes("step=") ||
          window.location.search.includes("job="))
      ) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {}
  };

  const activeThemeImageUrl =
    useCustomTheme && customThemeImage
      ? customThemeImage
      : selectedCharacter.characterImageUrl;
  const activeThemeName =
    useCustomTheme && customThemeImage
      ? "Referencia Personalizada"
      : selectedCharacter.name;

  const currentUnitPrice =
    selectedPrintPreset.pricePen + (selectedFrame?.priceModifierPen || 0);

  const couponDiscountPen = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? Math.round(
          Math.min(
            (currentUnitPrice * appliedCoupon.value) / 100,
            currentUnitPrice,
          ) * 100,
        ) / 100
      : Math.round(Math.min(appliedCoupon.value, currentUnitPrice) * 100) / 100
    : 0;
  const finalPriceWithCoupon = Number(
    Math.max(0, currentUnitPrice - couponDiscountPen).toFixed(2),
  );

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
        frame_id: selectedFrame?.id || "canvas-bastidor",
        frame_name:
          selectedFrame?.name || "Foto Lienzo - Estilo 3D (Bastidor)",
        frame_price_pen: selectedFrame?.priceModifierPen || 0,
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
      coupon: appliedCoupon
        ? {
            ...appliedCoupon,
            discountAmount: couponDiscountPen,
          }
        : null,
    };
    try {
      localStorage.setItem("apolena_checkout_draft", JSON.stringify(draft));
      sessionStorage.setItem(
        "apolena_studio_state",
        JSON.stringify({
          petImage,
          secondPetImage,
          petSpecies,
          selectedCharacter,
          useCustomTheme,
          customThemeImage,
          fusedResultUrl: finalArtUrl,
          generatedVariants,
          selectedVariantId,
          activeGenerationJobId,
          modelUsedLabel,
          isSimulationJob,
          simulationNotice,
          selectedPrintPreset,
          selectedFrame,
          includePetInscription,
          petInscriptionName,
          dedicationNote,
        }),
      );
    } catch {}

    trackBeginCheckout({
      value: currentUnitPrice,
      characterId: selectedCharacter.id,
      characterName: activeThemeName,
      sizeLabel: selectedPrintPreset.cmDimensions,
      frameName: selectedFrame.name,
    });

    // Para ordenar se requiere obligatoriamente iniciar sesión
    if (!isAuthenticated) {
      setAuthGateReason("checkout");
      setShowAuthGateModal(true);
      return;
    }

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
      {/* Notificación flotante de error cuando se sube una imagen incorrecta (#90) */}
      {errorNotification && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-20 right-4 sm:top-24 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-white border border-red-200 shadow-2xl p-4 sm:p-5 flex items-start gap-3.5 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <X className="w-4 h-4 stroke-[2.75]" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-sm font-bold text-stone-900 leading-snug">
              {errorNotification.title}
            </h4>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {errorNotification.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotification(null)}
            aria-label="Cerrar notificación"
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* App Header */}
      <Header
        currentStep={step}
        onReset={handleReset}
        selectedProvider={selectedProvider}
        hasActiveKey={isProviderConfigured(selectedProvider)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1440px] xl:max-w-[1520px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Barra Persistente de Creaciones Guardadas (Carrito de Retratos) */}
        {!isGenerating && savedCreations.length > 0 && (
          <div className="mb-6 bg-white/95 border border-cream-200 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-stone-900 block">
                  Mis creaciones guardadas ({savedCreations.length})
                </span>
                <span className="text-[10px] text-stone-500 block">
                  Tu avance se guarda automáticamente al refrescar
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 w-full">
              <Swiper
                modules={[FreeMode]}
                slidesPerView="auto"
                spaceBetween={8}
                freeMode={{ enabled: true, momentumRatio: 0.75 }}
                grabCursor
                className="w-full !py-0.5"
              >
                {savedCreations.map((item) => {
                  const isActive =
                    step === 3 && activeGenerationJobId === item.jobId;
                  return (
                    <SwiperSlide key={item.jobId} className="!w-auto">
                      <div
                        className={`group relative flex items-center gap-2 pl-1.5 pr-7 py-1 rounded-full border text-left transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#174B3D] text-white border-[#174B3D] shadow-xs"
                            : "bg-cream-50 hover:bg-cream-100 text-stone-800 border-cream-200"
                        }`}
                        onClick={() => applySavedCreationToStudio(item, true)}
                      >
                        <img
                          src={item.fusedResultUrl}
                          alt={item.characterName}
                          className="w-7 h-7 rounded-full object-cover border border-white/40 shrink-0"
                        />
                        <div className="min-w-0 max-w-[120px] leading-tight">
                          <span className="text-[11px] font-semibold block truncate">
                            {item.petInscriptionName.trim()
                              ? `${item.petInscriptionName.trim()} · ${item.characterName}`
                              : item.characterName}
                          </span>
                          <span
                            className={`text-[9px] block truncate ${
                              isActive ? "text-[#DFC18D]" : "text-stone-500"
                            }`}
                          >
                            {isActive ? "Viendo ahora" : "Retomar obra"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSavedCreation(item.jobId);
                            const nextList = savedCreations.filter(
                              (c) => c.jobId !== item.jobId,
                            );
                            setSavedCreations(nextList);
                            fetch(`/api/jobs/${encodeURIComponent(item.jobId)}`, {
                              method: "DELETE",
                            }).catch(() => {});
                            if (activeGenerationJobId === item.jobId) {
                              if (nextList[0]) {
                                applySavedCreationToStudio(nextList[0], true);
                              } else {
                                handleReset();
                              }
                            }
                          }}
                          aria-label={`Eliminar creación ${item.characterName}`}
                          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                            isActive
                              ? "text-white/70 hover:text-white hover:bg-white/15"
                              : "text-stone-400 hover:text-stone-700 hover:bg-stone-200/70"
                          }`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </SwiperSlide>
                  );
                })}

                <SwiperSlide className="!w-auto">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-cream-100 border border-dashed border-[#c6a26c] text-[#174B3D] text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#94713F]" />
                    <span>Nuevo retrato</span>
                  </button>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        )}
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
        {/* PASO 1: ELEGIR PERSONAJE / VESTUARIO Y ESCENARIO (#73) */}
        {/* ========================================================================= */}
        {!isGenerating && step === 1 && (
          <div className="space-y-8 pb-28 animate-in fade-in duration-300">
            {/* Step Indicator */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cream-100 border border-cream-200 text-stone-600 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
                <span>Paso 1 de 3 · Dirección de Arte</span>
              </div>
            </div>

            {/* SECTION A: SELECT COLLECTION THEME */}
            <div className="space-y-6">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
                  Elige el vestuario y escenario
                </h1>
                <p className="text-xs sm:text-sm text-stone-600">
                  Selecciona una obra de nuestra colección para convertir a tu mascota en protagonista.
                </p>
              </div>

              {/* Dynamic Curated Collection Cards (Grid Compacto Vertical 2:3 o Skeleton si no hay conexión a BD) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
                {catalogCharacters.length === 0
                  ? Array.from({ length: 12 }).map((_, idx) => (
                      <div
                        key={`studio-char-skeleton-${idx}`}
                        aria-hidden="true"
                        className="rounded-xl overflow-hidden border border-cream-200 bg-white shadow-soft flex flex-col justify-between h-full"
                      >
                        <div className="relative aspect-[2/3] w-full bg-[#EFE6D5] animate-pulse">
                          <div className="absolute top-1.5 left-1.5 h-3.5 w-16 rounded-full bg-white/70" />
                        </div>
                        <div className="p-2 space-y-1.5 animate-pulse">
                          <div className="h-3 w-3/4 rounded bg-stone-200" />
                          <div className="h-2.5 w-1/2 rounded bg-stone-100" />
                          <div className="h-5 w-full rounded-full bg-cream-100 mt-1" />
                        </div>
                      </div>
                    ))
                  : catalogCharacters.map((char) => {
                      const isSelected =
                        hasSelectedCharacter &&
                        !useCustomTheme &&
                        selectedCharacter.id === char.id;

                      return (
                        <div
                          key={char.id}
                          onClick={() => {
                            setSelectedCharacter(char);
                            setHasSelectedCharacter(true);
                            setUseCustomTheme(false);
                            setErrorNotification(null);
                            setFusionError(null);
                          }}
                          title={char.description || char.name}
                          className={`group/card relative rounded-xl overflow-hidden border bg-white transition-all duration-200 cursor-pointer flex flex-col justify-between h-full ${
                            isSelected
                              ? "border-[#174B3D] ring-2 ring-[#174B3D]/25 shadow-card"
                              : "border-cream-200 hover:border-stone-300 shadow-soft"
                          }`}
                        >
                          {/* Imagen Vertical Completa (2:3) en tamaño compacto */}
                          <div className="relative aspect-[2/3] w-full overflow-hidden bg-cream-100">
                            <img
                              src={char.characterImageUrl}
                              alt={char.name}
                              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover/card:scale-105"
                            />

                            <div className="absolute top-1.5 left-1.5 right-8">
                              <span className="inline-block max-w-full truncate text-[8px] font-medium px-1.5 py-0.5 rounded-full border backdrop-blur-xs bg-white/90 text-stone-800 border-stone-200/80">
                                {char.universe}
                              </span>
                            </div>

                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#174B3D] text-white flex items-center justify-center shadow-soft">
                                <Check className="w-3 h-3 stroke-[2.5]" />
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
                              className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs shadow-md transition-all duration-150 hover:scale-110 z-10"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Pie Compacto */}
                          <div className="p-2 space-y-1.5 flex flex-col justify-between">
                            <div className="min-w-0">
                              <h3 className="font-serif text-xs font-bold text-stone-900 truncate leading-tight">
                                {char.name}
                              </h3>
                              <span className="text-[9px] font-medium text-stone-500 block truncate mt-0.5">
                                {char.characterTitle}
                              </span>
                            </div>

                            <span
                              className={`w-full py-1 px-2 rounded-full text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${
                                isSelected
                                  ? "bg-[#174B3D] text-white"
                                  : "bg-cream-100 text-stone-700 group-hover/card:bg-cream-200"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Elegido</span>
                                </>
                              ) : (
                                <span>Seleccionar</span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>

            {/* Barra Inferior Fija Superpuesta: Personaje Elegido + Continuar a Subir Foto */}
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-cream-200 px-4 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {hasSelectedCharacter || useCustomTheme ? (
                    <>
                      <img
                        src={activeThemeImageUrl}
                        alt={activeThemeName}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover object-top border border-[#174B3D]/30 shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block leading-tight">
                          Estilo elegido
                        </span>
                        <span className="font-serif text-sm sm:text-base font-bold text-[#174B3D] block truncate leading-tight">
                          {activeThemeName}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block leading-tight">
                        Paso 1 de 3
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-stone-700 block truncate leading-tight">
                        Elige un personaje
                      </span>
                    </div>
                  )}
                </div>

                <button
                  ref={continueToUploadBtnRef}
                  type="button"
                  onClick={() => {
                    if (!hasSelectedCharacter && !useCustomTheme) {
                      triggerErrorNotification(
                        "Selecciona un personaje",
                        "Es necesario elegir un personaje del catálogo para continuar al siguiente paso.",
                      );
                      return;
                    }
                    setErrorNotification(null);
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={!useCustomTheme && catalogCharacters.length === 0}
                  className="shrink-0 py-3 sm:py-3.5 px-5 sm:px-7 rounded-full bg-[#174B3D] hover:bg-[#134034] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-card transition-all focus:outline-none focus:ring-4 focus:ring-emerald-700/30 cursor-pointer"
                >
                  <span>Continuar a subir foto</span>
                  <ArrowRight className="w-4 h-4 text-[#c6a26c] shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: SUBIR FOTO DE TU MASCOTA Y GENERAR RETRATO (#73 + #90) */}
        {/* ========================================================================= */}
        {!isGenerating && step === 2 && (
          <div className="space-y-6 max-w-5xl xl:max-w-6xl mx-auto animate-in fade-in duration-300">
            {/* Navigation & Step Indicator */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cream-200 text-stone-700 hover:text-stone-900 text-xs font-medium hover:border-stone-300 transition-colors shadow-soft"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a personajes</span>
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-200 text-stone-600 text-xs font-medium">
                <Camera className="w-3.5 h-3.5 text-terracotta-500" />
                <span>Paso 2 de 3 · Fotografía de Referencia</span>
              </div>
            </div>

            {/* Header Compacto */}
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
                Sube la foto de tu mascota
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                Selecciona una fotografía clara donde se aprecie bien el rostro,
                los ojos y los rasgos de tu mascota para el estilo{" "}
                <strong className="text-stone-800 font-semibold">
                  {activeThemeName}
                </strong>
                .
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

                <div className="flex-1 flex flex-col justify-between gap-3">
                  {!petImage ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!isValidatingPetPhoto && e.dataTransfer.files?.[0]) {
                          readAndCompressImage(
                            e.dataTransfer.files[0],
                            setPetImage,
                          );
                        }
                      }}
                      onClick={() => {
                        if (!isValidatingPetPhoto) fileInput1Ref.current?.click();
                      }}
                      className="relative w-full min-h-[250px] sm:min-h-[285px] max-h-[340px] rounded-2xl border-2 border-dashed border-cream-300 hover:border-terracotta-500 bg-cream-50/70 hover:bg-terracotta-50/30 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
                    >
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-[10px] font-bold">
                        Foto 1 · Principal (obligatoria)
                      </span>
                      <input
                        ref={fileInput1Ref}
                        type="file"
                        accept="image/*"
                        disabled={isValidatingPetPhoto}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) readAndCompressImage(file, setPetImage);
                        }}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-full bg-white border border-cream-200 flex items-center justify-center text-stone-600 group-hover:text-terracotta-600 mb-3 shadow-soft transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-stone-900 mb-1">
                        Seleccionar o arrastrar fotografía
                      </p>
                      <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                        Haz clic para buscar en tu dispositivo o arrastra el archivo aquí
                      </p>
                      {isValidatingPetPhoto ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#174B3D] px-4 py-2 text-xs font-semibold text-white">
                          <Loader2 className="h-4 w-4 animate-spin text-[#c6a26c]" />
                          Validando que sea una mascota...
                        </div>
                      ) : fusionError ? (
                        <div className="mt-3 max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium leading-relaxed text-red-700">
                          {fusionError}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="relative w-full min-h-[250px] sm:min-h-[285px] max-h-[340px] rounded-2xl overflow-hidden border border-cream-200 bg-[#f8f6f0] flex items-center justify-center">
                      <img
                        src={petImage}
                        alt="Tu Mascota"
                        className="w-full h-full object-contain object-center"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-stone-900/75 text-white text-[10px] font-semibold">
                        Foto 1 · Principal
                      </span>
                      <button
                        onClick={() => {
                          if (!isValidatingPetPhoto) fileInput1Ref.current?.click();
                        }}
                        disabled={isValidatingPetPhoto}
                        className="absolute bottom-3 right-3 px-4 py-2 rounded-full bg-white/95 backdrop-blur-xs border border-cream-200 text-stone-800 hover:text-terracotta-600 text-xs font-semibold flex items-center gap-1.5 shadow-card transition-colors z-10 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Cambiar foto</span>
                      </button>
                      {isValidatingPetPhoto && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/85 backdrop-blur-sm">
                          <div className="inline-flex items-center gap-2 rounded-full bg-[#174B3D] px-4 py-2 text-xs font-semibold text-white">
                            <Loader2 className="h-4 w-4 animate-spin text-[#c6a26c]" />
                            Validando fotografía...
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInput1Ref}
                        type="file"
                        accept="image/*"
                        disabled={isValidatingPetPhoto}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) readAndCompressImage(file, setPetImage);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Fotos adicionales opcionales de la MISMA mascota (visibles desde el inicio · hasta 3 fotos en total) */}
                  {!secondPetImage && (
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-[#174B3D]">
                          Fotos extra de la misma mascota (opcional · {(petImage ? 1 : 0) + extraPetImages.length}/3)
                        </span>
                        <span className="text-stone-500">
                          Mejora el parecido facial
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {[0, 1].map((slotIdx) => {
                          const imgUrl = extraPetImages[slotIdx];
                          if (imgUrl) {
                            return (
                              <div
                                key={`extra-pet-${slotIdx}`}
                                className="relative h-24 rounded-xl overflow-hidden border border-emerald-200 bg-cream-50 group"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Ángulo adicional ${slotIdx + 2} de tu mascota`}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-stone-900/75 text-white text-[10px] font-semibold">
                                  Foto {slotIdx + 2}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExtraPetImages((prev) =>
                                      prev.filter((_, i) => i !== slotIdx),
                                    )
                                  }
                                  aria-label={`Quitar foto adicional ${slotIdx + 2}`}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-stone-900/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={`extra-pet-empty-${slotIdx}`}
                              type="button"
                              disabled={isValidatingPetPhoto}
                              onClick={() =>
                                !petImage
                                  ? fileInput1Ref.current?.click()
                                  : extraPetInputRef.current?.click()
                              }
                              className="h-24 rounded-xl border-2 border-dashed border-cream-300 hover:border-[#174B3D] bg-cream-50/70 hover:bg-[#174B3D]/5 disabled:opacity-50 flex flex-col items-center justify-center gap-1 text-center px-2 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4 text-[#174B3D]" />
                              <span className="text-[11px] font-semibold text-stone-700">
                                + Foto {slotIdx + 2} (opcional)
                              </span>
                              <span className="text-[10px] text-stone-400">
                                Otro ángulo o luz
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <input
                        ref={extraPetInputRef}
                        type="file"
                        accept="image/*"
                        disabled={isValidatingPetPhoto}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) {
                            readAndCompressImage(file, (compressedUrl) => {
                              if (!petImage) {
                                setPetImage(compressedUrl);
                              } else {
                                setExtraPetImages((prev) =>
                                  [...prev, compressedUrl].slice(0, 2),
                                );
                              }
                            });
                          }
                        }}
                        className="hidden"
                      />

                      <p className="text-[10px] text-stone-500 leading-snug">
                        Puedes subir hasta 3 ángulos de la <strong>misma mascota</strong> para lograr un parecido aún más fiel. En el cuadro aparecerá 1 sola mascota.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Tipo de Mascota, Nombre en Lienzo y Botón Crear Retrato */}
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

                  {/* Guía de la foto correcta a subir */}
                  <div className="pt-3 border-t border-cream-200 space-y-2">
                    <span className="text-xs font-semibold text-stone-700 block">
                      Imagen de foto correcta a subir:
                    </span>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowPhotoGuideModal(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setShowPhotoGuideModal(true);
                        }
                      }}
                      className="w-full rounded-2xl overflow-hidden border border-cream-200 hover:border-[#c6a26c] bg-cream-50 shadow-xs cursor-pointer transition-colors"
                    >
                      <img
                        src="/images/ejemplo.jpg"
                        alt="Ejemplo de foto correcta de mascota"
                        className="w-full h-auto max-h-[260px] object-contain mx-auto block"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón Principal Crear Retrato Ahora */}
                <div className="pt-2 space-y-2">
                  <button
                    ref={createPortraitBtnRef}
                    type="button"
                    onClick={handleStartFusion}
                    disabled={!petImage || isValidatingPetPhoto}
                    className={`w-full py-3.5 px-6 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-soft transition-all focus:outline-none focus:ring-4 focus:ring-[#174B3D]/30 ${
                      petImage && !isValidatingPetPhoto
                        ? "bg-[#174B3D] hover:bg-[#134034] text-white cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                        : "bg-cream-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    <span>
                      {petImage
                        ? "Crear Retrato Ahora"
                        : "Sube una foto para continuar"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
                  </button>
                  {petImage && (
                    <p className="text-[11px] text-stone-500 text-center">
                      Prepararemos{" "}
                      <strong className="text-stone-800 font-medium">
                        2 propuestas artísticas exclusivas
                      </strong>{" "}
                      en estilo{" "}
                      <strong className="text-stone-800 font-medium">
                        {activeThemeName}
                      </strong>
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal informativo: guía de la foto correcta a subir */}
        {showPhotoGuideModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Guía para tomar la foto correcta de tu mascota"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShowPhotoGuideModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-white border border-cream-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-cream-200 bg-cream-50">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c6a26c] block">
                    Guía y consejos
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                    Cómo tomar la foto correcta de tu mascota
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhotoGuideModal(false)}
                  aria-label="Cerrar guía"
                  className="p-2 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
                <div className="rounded-2xl overflow-hidden border border-cream-200 bg-cream-100 flex items-center justify-center">
                  <img
                    src="/images/ejemplo.jpg"
                    alt="Ejemplo de foto correcta de mascota"
                    className="w-full h-full max-h-[60vh] object-contain"
                  />
                </div>

                <div className="flex flex-col justify-between gap-5">
                  <ul className="space-y-3 text-sm text-stone-700">
                    {[
                      {
                        title: "Luz natural",
                        text: "Toma la foto cerca de una ventana o al aire libre, evita el flash y las sombras duras.",
                      },
                      {
                        title: "Rostro de frente",
                        text: "Ubica la cámara a la altura de sus ojos y que mire hacia el lente, con el rostro completo visible.",
                      },
                      {
                        title: "Sin accesorios",
                        text: "Quita collares, gorros, lentes o ropa que tapen sus rasgos; así conservamos sus facciones exactas.",
                      },
                      {
                        title: "Foto nítida",
                        text: "Mantén el celular firme y enfoca bien los ojos; evita fotos borrosas o muy lejanas.",
                      },
                    ].map((tip) => (
                      <li key={tip.title} className="flex items-start gap-2.5">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#174B3D] text-[#c6a26c] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                        <span className="leading-snug">
                          <strong className="text-stone-900 font-semibold">
                            {tip.title}:
                          </strong>{" "}
                          {tip.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoGuideModal(false);
                      fileInput1Ref.current?.click();
                    }}
                    className="w-full py-3 px-5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all focus:outline-none focus:ring-4 focus:ring-emerald-700/30"
                  >
                    <Upload className="w-4 h-4 text-[#c6a26c]" />
                    <span>Subir foto de mi mascota ahora</span>
                  </button>
                </div>
              </div>
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
                    setHasSelectedCharacter(true);
                    setUseCustomTheme(false);
                    setPreviewCharacterModal(null);
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
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
        {/* PASO 3: VER EL RETRATO FINAL (MOBILE APP SHELL + DESKTOP STICKY STUDIO)   */}
        {/* ========================================================================= */}
        {!isGenerating && step === 3 && (
          <>
            {/* EXPERIENCIA MOBILE-FIRST TIPO APP NATIVA (SIN SCROLL LARGO) */}
            <MobileStep3AppShell
              activeThemeName={activeThemeName}
              isDoublePet={Boolean(secondPetImage)}
              artworkUrl={fusedResultUrl || selectedCharacter.fusionSampleUrl}
              petImage={petImage}
              generatedVariants={generatedVariants}
              selectedVariantId={selectedVariantId}
              onSelectVariant={(variant) => {
                setSelectedVariantId(variant.id);
                setFusedResultUrl(variant.imageUrl);
                if (variant.providerTitle) {
                  setModelUsedLabel(variant.providerTitle);
                }
              }}
              viewMode={viewMode}
              onChangeViewMode={setViewMode}
              sliderPos={sliderPos}
              onChangeSliderPos={setSliderPos}
              currentRoomCoords={currentRoomCoords}
              catalogSizes={catalogSizes}
              selectedPrintPreset={selectedPrintPreset}
              onSelectPrintPreset={setSelectedPrintPreset}
              catalogFrames={catalogFrames}
              selectedFrame={selectedFrame}
              onSelectFrame={setSelectedFrame}
              visualFrame={getVisualFramePresentation(selectedFrame)}
              currentUnitPrice={currentUnitPrice}
              includePetInscription={includePetInscription}
              onTogglePetInscription={setIncludePetInscription}
              petInscriptionName={petInscriptionName}
              onChangePetInscriptionName={setPetInscriptionName}
              dedicationNote={dedicationNote}
              onChangeDedicationNote={setDedicationNote}
              isExportingPrint={isExportingPrint}
              onDownloadSample={() => handleDownload()}
              onOpenShareModal={() => setShowSocialShareModal(true)}
              onOrderClick={handleOrderButtonClick}
              onUploadNewPhotos={handleReset}
              onTryAnotherStyle={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              isSimulationJob={isSimulationJob}
              simulationNotice={simulationNotice}
              isSendingQuotaAlert={isSendingQuotaAlert}
              quotaAlertSent={quotaAlertSent}
              onSendQuotaAlert={handleSendQuotaAlert}
            />

            {/* EXPERIENCIA DESKTOP STUDIO (2 COLUMNAS CON RETRATO SIEMPRE VISIBLE) */}
            <div className="hidden lg:block space-y-8 animate-in fade-in duration-300">
            {/* Top Bar Header */}
            <div className="pb-6 border-b border-cream-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 border border-sage-100 text-sage-700 text-xs font-medium mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                <span>
                  {generatedVariants.length > 1
                    ? `${generatedVariants.length} propuestas artísticas listas para tu elección`
                    : "Tu retrato artístico está listo"}
                </span>
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
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSendingQuotaAlert || quotaAlertSent}
                      onClick={handleSendQuotaAlert}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        quotaAlertSent
                          ? "bg-emerald-700 text-white"
                          : "bg-red-700 hover:bg-red-800 text-white disabled:opacity-60"
                      }`}
                    >
                      {isSendingQuotaAlert ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Enviando aviso...</span>
                        </>
                      ) : quotaAlertSent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Aviso enviado al equipo Apolena</span>
                        </>
                      ) : (
                        <span>Avisar al equipo de Apolena para recargar</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reference Summary Strip: [Pet 1] + [Pet 2] + [Theme] = [Portrait] */}
            <div className="px-3 py-2.5 sm:p-4 rounded-2xl bg-white border border-cream-200 shadow-soft flex items-center justify-center gap-2.5 sm:gap-6 text-[11px] sm:text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
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
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
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

              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />

              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0">
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

              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />

              <div className="flex items-center gap-1 sm:gap-1.5 text-terracotta-600 font-semibold whitespace-nowrap">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Composición Final</span>
              </div>
            </div>

            {/* Main Stage: Gallery Frame & Print Formats Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
              {/* Left 7 Columns: Dual Option Selector + Artwork Viewer (Sticky en Desktop) */}
              <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-24 space-y-4 sm:space-y-5">
                {/* DUAL PROPOSAL ARTWORK SELECTOR */}
                {generatedVariants.length > 1 && (
                  <div className="bg-white border border-cream-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-soft space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-stone-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-terracotta-500 shrink-0" />
                          <span>Elige tu propuesta favorita</span>
                        </h3>
                        <p className="text-[11px] sm:text-xs text-stone-500 hidden sm:block mt-0.5">
                          Hemos preparado 2 propuestas de retrato para tu
                          mascota. Selecciona la que más te guste para tu
                          cuadro:
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-medium px-2.5 py-0.5 sm:py-1 rounded-full bg-cream-100 text-stone-700 shrink-0">
                        1 de 2 elegida
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
                      {generatedVariants.map((variant, idx) => {
                        const isActiveVariant =
                          selectedVariantId === variant.id ||
                          (!selectedVariantId && idx === 0);
                        const proposalTitle =
                          variant.providerTitle ||
                          (idx === 0
                            ? "Propuesta 1 · Óleo Fine Art"
                            : "Propuesta 2 · Detalle y Luminosidad");
                        const shortTitle =
                          idx === 0 ? "Propuesta 1 · Óleo" : "Propuesta 2 · Estudio";
                        const proposalDesc =
                          idx === 0
                            ? "Pinceladas ricas en textura y calidez clásica"
                            : "Máximo detalle en mirada, pelaje y luz fiel al personaje";

                        return (
                          <div
                            key={variant.id || `prop-${idx}`}
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setFusedResultUrl(variant.imageUrl);
                              setModelUsedLabel(proposalTitle);
                            }}
                            className={`relative p-2 sm:p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 ${
                              isActiveVariant
                                ? "bg-terracotta-50/40 border-[#174B3D] ring-2 ring-[#174B3D]/15 shadow-card"
                                : "bg-white border-cream-200 hover:border-stone-300 hover:bg-cream-50/40 shadow-soft"
                            }`}
                          >
                            <div
                              onContextMenu={(e) => e.preventDefault()}
                              className="relative w-full aspect-[4/3] sm:aspect-square sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden border border-cream-200 bg-cream-100 flex-shrink-0 select-none shadow-xs"
                            >
                              <img
                                src={variant.imageUrl}
                                alt={proposalTitle}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-300"
                              />
                              {isActiveVariant && (
                                <div className="absolute inset-0 bg-[#174B3D]/15 flex items-center justify-center">
                                  <span className="w-7 h-7 rounded-full bg-[#174B3D] text-white flex items-center justify-center shadow-soft ring-2 ring-white/80">
                                    <Check className="w-4 h-4 stroke-[3] text-[#c6a26c]" />
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] sm:text-xs font-bold text-[#174B3D] leading-tight sm:hidden">
                                    {shortTitle}
                                  </span>
                                  <span className="text-xs font-bold text-[#174B3D] hidden sm:inline">
                                    {proposalTitle}
                                  </span>
                                  {isActiveVariant && (
                                    <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-bold text-[#174B3D] bg-[#c6a26c]/25 px-2 py-0.5 rounded-full border border-[#c6a26c]/50 shrink-0">
                                      Elegida
                                    </span>
                                  )}
                                </div>
                                <p className="hidden sm:block text-[11px] text-stone-500 mt-1 leading-snug line-clamp-2">
                                  {proposalDesc}
                                </p>
                              </div>
                              <div className="mt-1.5 sm:mt-2.5 flex items-center">
                                <span
                                  className={`w-full sm:w-auto text-center text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-full transition-colors ${
                                    isActiveVariant
                                      ? "bg-[#174B3D] text-white shadow-xs"
                                      : "bg-cream-100 text-stone-700 hover:bg-cream-200"
                                  }`}
                                >
                                  {isActiveVariant ? (
                                    <span className="inline-flex items-center justify-center gap-1">
                                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                      <span>Elegida</span>
                                    </span>
                                  ) : (
                                    "Elegir esta"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Feedback discreto para mejora continua del atelier */}
                    {activeGenerationJobId && !isSimulationJob && (
                      <div className="pt-2 border-t border-cream-200/80 flex flex-col gap-2">
                        {feedbackSentJobId === activeGenerationJobId ? (
                          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Gracias por tu aporte. Lo usaremos para perfeccionar futuros retratos.
                            </span>
                          </p>
                        ) : !showFeedbackOptions ? (
                          <button
                            type="button"
                            onClick={() => setShowFeedbackOptions(true)}
                            className="self-start text-[11px] text-stone-500 hover:text-[#174B3D] underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            ¿Algo no salió como esperabas? Ayúdanos a mejorar
                          </button>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-stone-700">
                                ¿Qué deberíamos mejorar en la propuesta que estás viendo?
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowFeedbackOptions(false)}
                                className="text-[10px] text-stone-400 hover:text-stone-700 cursor-pointer"
                              >
                                Cerrar
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { id: "no_match_pet", label: "No se parece a mi mascota" },
                                { id: "bad_proportions", label: "Proporción cabeza/cuerpo rara" },
                                { id: "too_dark", label: "Muy oscuro / cambió el fondo" },
                                { id: "cropped_ears", label: "Recortó orejas o cabeza" },
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    handleSubmitPortraitFeedback(
                                      opt.id as
                                        | "no_match_pet"
                                        | "bad_proportions"
                                        | "too_dark"
                                        | "cropped_ears",
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-full bg-cream-50 hover:bg-[#174B3D] hover:text-white border border-cream-300 text-[11px] font-medium text-stone-700 transition-colors cursor-pointer"
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Viewer Controls Bar (Segmented Control en Mobile · Pill en Desktop) */}
                <div className="flex items-center justify-between gap-2 p-1 sm:p-1.5 rounded-2xl sm:rounded-full bg-white border border-cream-200 shadow-soft">
                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-1 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("fusion");
                        setIsZoomActive(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-semibold sm:font-medium transition-all whitespace-nowrap cursor-pointer ${
                        viewMode === "fusion"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-cream-100"
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="sm:hidden">Obra</span>
                      <span className="hidden sm:inline">Obra Completa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("compare");
                        setIsZoomActive(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-semibold sm:font-medium transition-all whitespace-nowrap cursor-pointer ${
                        viewMode === "compare"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-cream-100"
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5 shrink-0" />
                      <span className="sm:hidden">Comparar</span>
                      <span className="hidden sm:inline">Comparar Original</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setViewMode("room");
                        setIsZoomActive(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-semibold sm:font-medium transition-all whitespace-nowrap cursor-pointer ${
                        viewMode === "room"
                          ? "bg-stone-900 text-white shadow-xs"
                          : "text-stone-600 hover:text-stone-900 hover:bg-cream-100"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5 text-[#c6a26c] shrink-0" />
                      <span className="sm:hidden">En Sala</span>
                      <span className="hidden sm:inline">Ver en Sala (Escala)</span>
                    </button>
                  </div>

                  {viewMode === "fusion" && (
                    <button
                      type="button"
                      onClick={() => setIsZoomActive(!isZoomActive)}
                      className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
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
                  className={`relative rounded-2xl sm:rounded-3xl overflow-hidden border border-cream-200 min-h-[340px] sm:min-h-[480px] flex flex-col items-center justify-center p-3 sm:p-6 select-none shadow-soft transition-colors ${
                    viewMode === "room" ? "bg-[#ece9e2]/50" : "bg-cream-100"
                  }`}
                >
                  {/* MODE 1: FULL PORTRAIT - CON MARCO DINÁMICO VISUAL O BASTIDOR 3D */}
                  {viewMode === "fusion" && (() => {
                    const visualFrame = getVisualFramePresentation(selectedFrame);
                    return (
                      <div
                        onContextMenu={(e) => e.preventDefault()}
                        className="relative transition-all duration-300 select-none"
                        style={{
                          ...visualFrame.outerStyle,
                          WebkitTouchCallout: "none",
                        }}
                      >
                        {/* Uniones de inglete (45°) en las 4 esquinas cuando lleva moldura */}
                        {visualFrame.isFramed && (
                          <>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute top-0 left-0 w-5 h-5 z-20"
                              style={{
                                background: `linear-gradient(45deg, transparent 48%, ${visualFrame.cornerColor} 49%, ${visualFrame.cornerColor} 51%, transparent 52%)`,
                              }}
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute top-0 right-0 w-5 h-5 z-20"
                              style={{
                                background: `linear-gradient(135deg, transparent 48%, ${visualFrame.cornerColor} 49%, ${visualFrame.cornerColor} 51%, transparent 52%)`,
                              }}
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute bottom-0 left-0 w-5 h-5 z-20"
                              style={{
                                background: `linear-gradient(135deg, transparent 48%, ${visualFrame.cornerColor} 49%, ${visualFrame.cornerColor} 51%, transparent 52%)`,
                              }}
                            />
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute bottom-0 right-0 w-5 h-5 z-20"
                              style={{
                                background: `linear-gradient(45deg, transparent 48%, ${visualFrame.cornerColor} 49%, ${visualFrame.cornerColor} 51%, transparent 52%)`,
                              }}
                            />
                          </>
                        )}

                        <div
                          className="relative overflow-hidden bg-stone-900 transition-all duration-300"
                          style={visualFrame.innerStyle}
                        >
                          <ProtectedArtworkCanvas
                            src={
                              fusedResultUrl || selectedCharacter.fusionSampleUrl
                            }
                            alt="Retrato finalizado"
                            maxHeightPx={560}
                            className="rounded-none block"
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
                      </div>
                    );
                  })()}

                  {/* MODE 2: BEFORE / AFTER SLIDER (Also Protected & 100% Responsive Mobile) */}
                  {viewMode === "compare" && petImage && (
                    <div
                      onContextMenu={(e) => e.preventDefault()}
                      className="relative max-h-[560px] aspect-[3/4] sm:aspect-[4/3] w-full max-w-[660px] rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card cursor-ew-resize select-none touch-none"
                      onMouseDown={() => setIsDraggingSlider(true)}
                      onMouseUp={() => setIsDraggingSlider(false)}
                      onMouseLeave={() => setIsDraggingSlider(false)}
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

                      {/* Before Pet Image (Clipped with responsive clip-path so it works on all screen sizes) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                        }}
                      >
                        <img
                          src={petImage}
                          alt="Fotografía Original"
                          draggable={false}
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                        />
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium text-stone-800 border border-cream-200 shadow-soft">
                          Original
                        </div>
                      </div>

                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium text-stone-900 border border-cream-200 shadow-soft max-w-[45%] truncate">
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
                        src="/images/room-sizes-reference-2.png"
                        alt="Escala de tamaños de cuadros en sala"
                        draggable={false}
                        className="block w-auto max-w-full max-h-[60vh] sm:max-h-[66vh] object-contain pointer-events-none select-none mx-auto"
                      />

                      {/* Cuadro dinámico posicionado y dimensionado sobre la pared */}
                      <div
                        style={{
                          left: "50%",
                          transform: "translateX(-50%)",
                          bottom: `${currentRoomCoords.bottom}%`,
                          width: `${currentRoomCoords.width}%`,
                          height: `${currentRoomCoords.height}%`,
                        }}
                        className="absolute transition-all duration-500 ease-out z-10 pointer-events-auto group cursor-pointer"
                        title={`${selectedPrintPreset.cmDimensions} - ${selectedPrintPreset.tier}`}
                      >
                        {/* Efecto bastidor de lienzo 3D o Marco seleccionado sobre la pared */}
                        <div
                          style={
                            getVisualFramePresentation(selectedFrame)
                              .roomOuterStyle
                          }
                          className="relative w-full h-full rounded-xs shadow-[0_14px_36px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] ring-1 ring-black/20 overflow-hidden bg-stone-900 transition-all duration-300"
                        >
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

                {/* Customizations: Nombre Brush (Dedicatoria oculta temporalmente) */}
                <div
                  ref={customizationsSectionRef}
                  className="grid grid-cols-1 gap-4"
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

                  {/* Tarjeta Viral: Compartir creación en redes sociales */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#174B3D] to-[#0E2F26] border border-[#c6a26c]/60 rounded-3xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 text-white">
                    {/* Brillo dorado diagonal continuo (loop suave) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#DFC18D]/18 to-transparent ap-shimmer-sweep"
                    />
                    <div className="relative z-10 flex items-start gap-3">
                      <div className="relative w-9 h-9 rounded-2xl bg-white/10 border border-[#c6a26c]/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Share2 className="w-4 h-4 text-[#DFC18D]" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DFC18D] opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#DFC18D]" />
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#DFC18D]">
                          <span>Invita a tus amigos a probar</span>
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-[#FFFBF2]">
                          Presume el retrato de tu engreído
                        </h4>
                        <p className="text-[11px] text-[#FFFBF2]/85 leading-relaxed">
                          Comparte tu tarjeta Antes y Después en Instagram
                          Stories, WhatsApp o TikTok e invita a otros a crear el
                          suyo.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSocialShareModal(true)}
                      className="relative z-10 ap-share-pulse w-full sm:w-auto shrink-0 py-2.5 px-5 rounded-full bg-[#FFFBF2] hover:bg-[#F5EBD7] text-[#174B3D] text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#94713F]" />
                      <span>Compartir en redes</span>
                    </button>
                  </div>

                  {/* Dedicatoria para Regalo (Opcional) 
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
                  </div>*/}
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
                    {catalogSizes
                      .filter((preset) => preset.isAvailable !== false)
                      .map((preset, idx, arr) => {
                        const isSelected = selectedPrintPreset.id === preset.id;
                        const isLastOdd =
                          idx === arr.length - 1 && arr.length % 2 !== 0;
                        const hasDiscount =
                          preset.compareAtPricePen &&
                          preset.compareAtPricePen > preset.pricePen;
                        const savings = hasDiscount
                          ? preset.compareAtPricePen! - preset.pricePen
                          : 0;

                        return (
                          <div
                            key={preset.id}
                            onClick={() => setSelectedPrintPreset(preset)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isLastOdd ? "sm:col-span-2" : ""
                            } ${
                              isSelected
                                ? "border-[#174B3D] bg-[#174B3D]/5 ring-1 ring-[#174B3D]/25 shadow-xs"
                                : "border-cream-200 bg-cream-50/50 hover:border-stone-300 hover:bg-white"
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <Frame
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isSelected
                                        ? "text-[#174B3D]"
                                        : "text-stone-400"
                                    }`}
                                  />
                                  <span className="text-xs font-bold text-stone-900 truncate">
                                    {preset.tier}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-[#174B3D] block">
                                    S/ {preset.pricePen.toFixed(2)}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-[10px] line-through text-red-500 font-semibold block">
                                      Antes S/{" "}
                                      {preset.compareAtPricePen!.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 mt-0.5">
                                <span>
                                  {preset.cmDimensions} · {preset.inchDimensions}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                    Ahorras S/ {savings.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-stone-600 mt-2 leading-relaxed">
                              {preset.recommendedUse}
                            </p>
                          </div>
                        );
                      })}
                  </div>

                  {/* Selector de Marco / Presentación (Foto Lienzo vs Marco Minimalista vs Marco Madera Gold) */}
                  <div className="pt-4 border-t border-cream-200 space-y-3">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-[#c6a26c]" />
                        <span>Presentación y Marco del Cuadro</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Elige entre lienzo en bastidor estilo 3D o marco con moldura listo para colgar.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {catalogFrames
                        .filter((frame) => frame.isAvailable !== false)
                        .map((frame) => {
                          const isFrameSelected = selectedFrame.id === frame.id;
                          const allFrameImages =
                            Array.isArray(frame.images) &&
                            frame.images.length > 0
                              ? frame.images.filter(Boolean)
                              : frame.imageUrl
                                ? [frame.imageUrl]
                                : [];
                          const frameImg = allFrameImages[0] || null;
                          return (
                            <div
                              key={frame.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedFrame(frame)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedFrame(frame);
                                }
                              }}
                              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer group ${
                                isFrameSelected
                                  ? "border-[#174B3D] bg-[#174B3D]/5 ring-1 ring-[#174B3D]/25 shadow-xs"
                                  : "border-cream-200 bg-cream-50/50 hover:border-stone-300 hover:bg-white"
                              }`}
                            >
                              {/* Miniatura del Marco con acceso directo al Preview ampliado */}
                              {frameImg && (
                                <button
                                  type="button"
                                  title={`Ver detalle de ${frame.name}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewFrame(frame);
                                    setPreviewFrameImgIdx(0);
                                  }}
                                  className="relative w-16 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border border-cream-200 bg-cream-100 shrink-0 cursor-zoom-in group/thumb"
                                >
                                  <img
                                    src={frameImg}
                                    alt={frame.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                                  />
                                  <span className="absolute bottom-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-stone-900/75 text-white flex items-center justify-center shadow-xs backdrop-blur-xs group-hover/thumb:bg-[#174B3D] transition-colors">
                                    <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  </span>
                                  {allFrameImages.length > 1 && (
                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-stone-900/75 text-white text-[9px] font-bold backdrop-blur-xs">
                                      +{allFrameImages.length}
                                    </span>
                                  )}
                                </button>
                              )}

                              {/* Información Completa del Marco (Sin textos cortados) */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0 shadow-2xs"
                                      style={{ backgroundColor: frame.colorHex }}
                                    />
                                    <span className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug">
                                      {frame.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span
                                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                        frame.priceModifierPen === 0
                                          ? "bg-sage-50 text-[#174B3D] border-sage-200"
                                          : "bg-white text-[#174B3D] border-[#c6a26c]/40"
                                      }`}
                                    >
                                      {frame.priceModifierPen === 0
                                        ? "Incluido"
                                        : `+ S/ ${frame.priceModifierPen.toFixed(2)}`}
                                    </span>
                                    {isFrameSelected && (
                                      <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                                    )}
                                  </div>
                                </div>

                                <p className="text-[11px] text-stone-600 leading-relaxed">
                                  {frame.description}
                                </p>

                                {frameImg && (
                                  <div className="pt-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewFrame(frame);
                                        setPreviewFrameImgIdx(0);
                                      }}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#174B3D] hover:text-[#c6a26c] transition-colors cursor-pointer"
                                    >
                                      <ZoomIn className="w-3 h-3" />
                                      <span>
                                        Ver foto{allFrameImages.length > 1 ? `s (${allFrameImages.length})` : ""} en detalle
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="p-3 rounded-2xl border border-cream-200 bg-cream-50/60 space-y-1.5 text-xs">
                      <p className="flex items-center gap-2 text-[11px] font-medium text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#174B3D] shrink-0" />
                        <span>Los cuadros son elaborados en lienzo de tela canvas de alta resistencia con acabado de galería.</span>
                      </p>
                      <p className="flex items-center gap-2 text-[11px] font-medium text-stone-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#174B3D] shrink-0" />
                        <span>Canvas montado a mano · Acabados cuidados al detalle</span>
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

                  {/* Price & 100% Payment Summary Box */}
                  <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Precio del cuadro personalizado:</span>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 text-sm block">
                          S/ {currentUnitPrice.toFixed(2)}
                        </span>
                        {selectedPrintPreset.compareAtPricePen &&
                          selectedPrintPreset.compareAtPricePen >
                            selectedPrintPreset.pricePen && (
                            <div className="flex items-center gap-1.5 justify-end text-[10px] mt-0.5">
                              <span className="text-stone-400 line-through">
                                Antes S/{" "}
                                {(
                                  selectedPrintPreset.compareAtPricePen +
                                  (selectedFrame?.priceModifierPen || 0)
                                ).toFixed(2)}
                              </span>
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Ahorras S/{" "}
                                {(
                                  selectedPrintPreset.compareAtPricePen -
                                  selectedPrintPreset.pricePen
                                ).toFixed(2)}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                    {appliedCoupon && couponDiscountPen > 0 && (
                      <div className="flex items-center justify-between text-emerald-700 font-semibold">
                        <span>
                          Cupón{" "}
                          <span className="font-mono">{appliedCoupon.code}</span>
                          :
                        </span>
                        <span>- S/ {couponDiscountPen.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[#174B3D] font-semibold pt-1.5 border-t border-cream-200/80">
                      <span>Total a abonar al ordenar (100%):</span>
                      <span className="font-bold text-sm">
                        S/ {finalPriceWithCoupon.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Cupón de Descuento (opcional) */}
                  <CouponInputBox
                    subtotal={currentUnitPrice}
                    appliedCoupon={
                      appliedCoupon
                        ? { ...appliedCoupon, discountAmount: couponDiscountPen }
                        : null
                    }
                    onApply={(coupon) => setAppliedCoupon(coupon)}
                    onRemove={() => setAppliedCoupon(null)}
                    compact
                  />

                  {/* Primary Order & Checkout CTA */}
                  <button
                    onClick={handleOrderButtonClick}
                    className="w-full py-4 px-5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#c6a26c]" />
                    <span>
                      Ordenar Cuadro · S/ {finalPriceWithCoupon.toFixed(2)}
                    </span>
                  </button>

                  {/* Viral Share Card CTA */}
                  <button
                    type="button"
                    onClick={() => setShowSocialShareModal(true)}
                    className="w-full py-3 px-5 rounded-full bg-[#FFFBF2] hover:bg-[#F5EBD7] border border-[#c6a26c] text-[#174B3D] text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-[#94713F]" />
                    <span>Compartir mi creación en redes sociales</span>
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
                onClick={() => {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-6 py-3 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] text-xs font-bold shadow-soft transition-all"
              >
                Probar otro escenario
              </button>
            </div>
          </div>
          </>
        )}

        {/* Modal de Confirmación: Cuadro sin Nombre en el Lienzo */}
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
                    ¿Confirmar pedido sin nombre?
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Notamos que no has añadido el nombre de tu mascota en el lienzo.
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

                {/* Tarjeta de dedicatoria oculta temporalmente
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-stone-600 flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5 text-terracotta-500" />
                    <span>Tarjeta de dedicatoria:</span>
                  </span>
                  <span className="font-semibold text-stone-700 bg-white px-2.5 py-0.5 rounded-full border border-cream-200 text-[11px]">
                    {dedicationNote.trim() ? "Incluida" : "Sin dedicatoria"}
                  </span>
                </div>
                */}
              </div>

              <p className="text-[11px] text-stone-500 text-center leading-relaxed">
                El cuadro físico se confeccionará como una obra de arte limpia sin inscripciones. ¿Deseas agregar el nombre o continuar directo al pago?
              </p>

              {/* Acciones */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIncludePetInscription(true);
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
                  <span>Deseo agregar el Nombre</span>
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

        {/* Modal de Vista Previa Ampliada de Imágenes del Marco */}
        {previewFrame && (() => {
          const modalImages =
            Array.isArray(previewFrame.images) && previewFrame.images.length > 0
              ? previewFrame.images.filter(Boolean)
              : previewFrame.imageUrl
                ? [previewFrame.imageUrl]
                : [];
          const activeImg = modalImages[previewFrameImgIdx] || modalImages[0] || null;
          const isCurrentlySelected = selectedFrame.id === previewFrame.id;

          return (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Vista previa de ${previewFrame.name}`}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setPreviewFrame(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden border border-cream-200 shadow-2xl animate-in zoom-in-95 duration-150"
              >
                <button
                  type="button"
                  onClick={() => setPreviewFrame(null)}
                  aria-label="Cerrar vista previa"
                  className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {activeImg && (
                  <div className="relative bg-cream-100 aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={activeImg}
                      alt={previewFrame.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {modalImages.length > 1 && (
                  <div className="px-5 pt-3 flex items-center gap-2 overflow-x-auto">
                    {modalImages.map((imgUrl, idx) => (
                      <button
                        key={`${previewFrame.id}-img-${idx}`}
                        type="button"
                        onClick={() => setPreviewFrameImgIdx(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          idx === previewFrameImgIdx
                            ? "border-[#174B3D] ring-2 ring-[#174B3D]/25"
                            : "border-cream-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`${previewFrame.name} vista ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 shrink-0 shadow-2xs"
                        style={{ backgroundColor: previewFrame.colorHex }}
                      />
                      <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                        {previewFrame.name}
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#174B3D]/10 text-[#174B3D] border border-[#174B3D]/20 shrink-0">
                      {previewFrame.priceModifierPen === 0
                        ? "Incluido (S/ 0)"
                        : `+ S/ ${previewFrame.priceModifierPen.toFixed(2)}`}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {previewFrame.description}
                  </p>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFrame(previewFrame);
                        setPreviewFrame(null);
                      }}
                      className="flex-1 py-3 px-5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#c6a26c]" />
                      <span>
                        {isCurrentlySelected
                          ? "Marco seleccionado actualmente"
                          : "Elegir este marco"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFrame(null)}
                      className="py-3 px-4 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal de Tarjeta Editorial Compartible para Redes Sociales */}
        <SocialShareModal
          isOpen={showSocialShareModal}
          onClose={() => setShowSocialShareModal(false)}
          artworkUrl={fusedResultUrl || selectedCharacter.fusionSampleUrl}
          petImageUrl={petImage}
          themeName={activeThemeName}
          characterId={selectedCharacter.id}
          selectedFrame={selectedFrame}
          petName={
            includePetInscription && petInscriptionName.trim()
              ? petInscriptionName.trim()
              : null
          }
        />

        {/* Modal Modelo Híbrido: Solicitud de inicio de sesión para la 2da+ creación */}
        {showAuthGateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => setShowAuthGateModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-modal-title"
          >
            <div
              className="relative w-full max-w-md rounded-3xl bg-[#FFFBF2] border border-[#E8DEC8] shadow-2xl p-6 sm:p-7 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowAuthGateModal(false)}
                aria-label="Cerrar"
                className="absolute top-4 right-4 p-2 rounded-full bg-white border border-[#E8DEC8] text-stone-500 hover:text-stone-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-2 text-center pt-1">
                <div className="w-12 h-12 rounded-2xl bg-[#174B3D]/10 border border-[#c6a26c]/40 text-[#174B3D] flex items-center justify-center mx-auto">
                  {authGateReason === "checkout" ? (
                    <ShoppingBag className="w-5 h-5 text-[#94713F]" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[#94713F]" />
                  )}
                </div>
                <h3
                  id="auth-gate-modal-title"
                  className="font-serif text-xl sm:text-2xl font-semibold text-[#174B3D]"
                >
                  {authGateReason === "checkout"
                    ? "Inicia sesión para ordenar tu cuadro"
                    : "Inicia sesión para seguir creando"}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {authGateReason === "checkout"
                    ? "Para completar tu pedido, hacer seguimiento en vivo y desbloquear tu Recuerdo Digital HD sin marca al recibirlo, inicia sesión con tu cuenta."
                    : "Ya disfrutaste tu primera creación gratuita de prueba. Inicia sesión para seguir probando todos los estilos y guardar tus obras en tu cuenta."}
                </p>
              </div>

              <div className="rounded-2xl bg-white border border-[#E8DEC8] p-3.5 space-y-2 text-xs text-stone-700">
                {authGateReason === "checkout" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                      <span>
                        Tu retrato, tamaño y marco elegidos ya están guardados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                      <span>
                        Al iniciar sesión pasarás directo a finalizar tu orden
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                      <span>
                        Recibirás tu Tracking ID y seguimiento paso a paso
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                      <span>Tu foto y personaje elegidos quedan guardados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                      <span>
                        Al iniciar sesión tu retrato comenzará automáticamente
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                      <span>Tu creación anterior se vinculará a tu cuenta</span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (authGateReason === "generation") {
                      savePendingGenerationForAuth();
                    }
                    const callbackUrl =
                      authGateReason === "checkout"
                        ? "/checkout"
                        : "/products/cuadros-personalizados?resumeGenerate=1";
                    router.push(
                      `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
                    );
                  }}
                  className="w-full py-3.5 px-5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer"
                >
                  <span>Iniciar sesión o continuar con Google</span>
                  <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (authGateReason === "generation") {
                      savePendingGenerationForAuth();
                    }
                    const callbackUrl =
                      authGateReason === "checkout"
                        ? "/checkout"
                        : "/products/cuadros-personalizados?resumeGenerate=1";
                    router.push(
                      `/auth/register?callbackUrl=${encodeURIComponent(callbackUrl)}`,
                    );
                  }}
                  className="w-full py-3 px-5 rounded-full bg-white hover:bg-cream-100 border border-[#E8DEC8] text-[#174B3D] text-xs font-bold transition-colors cursor-pointer"
                >
                  Crear cuenta nueva gratis
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}