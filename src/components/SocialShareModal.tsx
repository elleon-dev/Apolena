"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Loader2,
  Sparkles,
  MessageCircle,
  Smartphone,
  Square,
} from "lucide-react";
import {
  generateSocialShareCard,
  type SocialCardFormat,
  type SocialShareCardResult,
} from "@/lib/social-share";

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkUrl: string;
  petImageUrl?: string | null;
  themeName: string;
  characterId: string;
  petName?: string | null;
}

export default function SocialShareModal({
  isOpen,
  onClose,
  artworkUrl,
  petImageUrl,
  themeName,
  characterId,
  petName,
}: SocialShareModalProps) {
  const [format, setFormat] = useState<SocialCardFormat>("story");
  const [includeBefore, setIncludeBefore] = useState<boolean>(
    Boolean(petImageUrl),
  );
  const [card, setCard] = useState<SocialShareCardResult | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState<boolean>(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [canNativeShareFiles, setCanNativeShareFiles] =
    useState<boolean>(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/products/cuadros-personalizados?character=${encodeURIComponent(characterId)}&step=2`
      : `https://apolena.pe/products/cuadros-personalizados?character=${encodeURIComponent(characterId)}&step=2`;

  const shareText = petName?.trim()
    ? `Mira el retrato estilo ${themeName} que creé para ${petName.trim()} en Apolena. Prueba con tu mascota aquí: ${shareUrl}`
    : `Mira el retrato estilo ${themeName} que creé para mi mascota en Apolena. Prueba con la tuya aquí: ${shareUrl}`;

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Regenerar tarjeta cuando se abre el modal o cambian las opciones
  const buildCard = useCallback(async () => {
    if (!isOpen || !artworkUrl) return;
    setIsGeneratingCard(true);
    setCardError(null);
    try {
      const result = await generateSocialShareCard({
        artworkUrl,
        petImageUrl: includeBefore ? petImageUrl : null,
        themeName,
        petName,
        includeBeforeBadge: includeBefore,
        format,
        fileSlug: characterId,
      });
      setCard(result);

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function"
      ) {
        try {
          setCanNativeShareFiles(navigator.canShare({ files: [result.file] }));
        } catch {
          setCanNativeShareFiles(false);
        }
      } else {
        setCanNativeShareFiles(false);
      }
    } catch (err) {
      console.error("Error generando tarjeta social:", err);
      setCardError(
        "No pudimos generar la vista previa de la tarjeta. Intenta nuevamente.",
      );
    } finally {
      setIsGeneratingCard(false);
    }
  }, [
    isOpen,
    artworkUrl,
    petImageUrl,
    includeBefore,
    themeName,
    petName,
    format,
    characterId,
  ]);

  useEffect(() => {
    if (isOpen) {
      buildCard();
    }
  }, [isOpen, buildCard]);

  if (!isOpen) return null;

  const handleDownloadCard = () => {
    if (!card) return;
    const link = document.createElement("a");
    link.href = card.dataUrl;
    link.download = card.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareFeedback("Tarjeta guardada en tu dispositivo.");
    setTimeout(() => setShareFeedback(null), 3500);
  };

  const handleNativeShare = async () => {
    if (!card) return;
    if (canNativeShareFiles && typeof navigator.share === "function") {
      try {
        await navigator.share({
          files: [card.file],
          title: `Retrato ${themeName} · Apolena`,
          text: shareText,
        });
        setShareFeedback("Gracias por compartir tu creación.");
        setTimeout(() => setShareFeedback(null), 3500);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }
    handleDownloadCard();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setShareFeedback("No se pudo copiar el enlace automáticamente.");
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="social-share-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#FFFBF2] border border-[#E8DEC8] shadow-2xl p-4 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#94713F]">
              <Sparkles className="w-3.5 h-3.5 text-[#c6a26c]" />
              <span>Tarjeta lista para redes sociales</span>
            </div>
            <h3
              id="social-share-modal-title"
              className="font-serif text-xl sm:text-2xl font-semibold text-[#174B3D] leading-tight"
            >
              Comparte tu creación
            </h3>
            <p className="text-xs text-stone-600">
              Diseñada con marca de agua estética y enlace directo para que tus
              amigos prueben con sus mascotas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de compartir"
            className="p-2 rounded-full bg-white border border-[#E8DEC8] text-stone-500 hover:text-stone-900 hover:bg-cream-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido principal: Vista previa + Controles */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Columna de Vista Previa */}
          <div className="md:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[270px] rounded-2xl overflow-hidden bg-[#0E2F26] border border-[#E8DEC8] shadow-lg flex items-center justify-center min-h-[340px]">
              {isGeneratingCard ? (
                <div className="flex flex-col items-center justify-center gap-2.5 p-8 text-center text-[#FFFBF2]">
                  <Loader2 className="w-7 h-7 animate-spin text-[#c6a26c]" />
                  <span className="text-xs font-medium text-[#FFFBF2]/90">
                    Diseñando tu tarjeta editorial...
                  </span>
                </div>
              ) : cardError ? (
                <div className="p-6 text-center space-y-3 text-white">
                  <p className="text-xs text-red-200">{cardError}</p>
                  <button
                    type="button"
                    onClick={buildCard}
                    className="px-4 py-2 rounded-full bg-[#c6a26c] text-[#0E2F26] text-xs font-bold"
                  >
                    Reintentar
                  </button>
                </div>
              ) : card ? (
                <img
                  src={card.dataUrl}
                  alt={`Tarjeta compartible de ${themeName}`}
                  className="w-full h-auto block select-none"
                />
              ) : null}
            </div>
          </div>

          {/* Columna de Opciones y Botones de Acción */}
          <div className="md:col-span-6 space-y-4">
            {/* Selector de Formato */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-700 block">
                Formato para redes
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("story")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    format === "story"
                      ? "bg-[#174B3D] text-white border-[#174B3D] shadow-xs"
                      : "bg-white text-stone-700 border-[#E8DEC8] hover:border-[#c6a26c]"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Historia (9:16)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("post")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    format === "post"
                      ? "bg-[#174B3D] text-white border-[#174B3D] shadow-xs"
                      : "bg-white text-stone-700 border-[#E8DEC8] hover:border-[#c6a26c]"
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Post (4:5)</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                {format === "story"
                  ? "Ideal para Instagram Stories, TikTok y Estados de WhatsApp."
                  : "Ideal para publicaciones en el Feed de Instagram y Facebook."}
              </p>
            </div>

            {/* Switch Antes vs Después */}
            {petImageUrl && (
              <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-[#E8DEC8] cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-stone-800 block">
                    Incluir foto original ("Antes")
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Muestra la transformación real de tu mascota.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeBefore}
                  onChange={(e) => setIncludeBefore(e.target.checked)}
                  className="w-4 h-4 accent-[#174B3D] rounded cursor-pointer"
                />
              </label>
            )}

            {/* Botón Principal de Compartir / Descargar */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleNativeShare}
                disabled={isGeneratingCard || !card}
                className="w-full py-3.5 px-5 rounded-full bg-[#174B3D] hover:bg-[#134034] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all"
              >
                {canNativeShareFiles ? (
                  <>
                    <Share2 className="w-4 h-4 text-[#c6a26c]" />
                    <span>Compartir en Instagram / Redes</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#c6a26c]" />
                    <span>Descargar Tarjeta Lista para Subir</span>
                  </>
                )}
              </button>

              {/* Acciones Secundarias */}
              <div className="grid grid-cols-2 gap-2">
                {canNativeShareFiles && (
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    disabled={isGeneratingCard || !card}
                    className="col-span-2 py-2.5 px-4 rounded-full bg-white hover:bg-cream-100 border border-[#E8DEC8] text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#174B3D]" />
                    <span>Guardar imagen en mi galería</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="py-2.5 px-3 rounded-full bg-white hover:bg-emerald-50 border border-[#E8DEC8] text-[#174B3D] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-full bg-white hover:bg-cream-100 border border-[#E8DEC8] text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="text-emerald-700">Enlace copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-stone-600" />
                      <span>Copiar enlace</span>
                    </>
                  )}
                </button>
              </div>

              {shareFeedback && (
                <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center">
                  {shareFeedback}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
