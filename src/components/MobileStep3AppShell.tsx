"use client";

import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Columns,
  Download,
  Frame,
  Gift,
  Home,
  Loader2,
  MoveHorizontal,
  PenTool,
  RefreshCw,
  Ruler,
  Share2,
  ShoppingBag,
  Sparkles,
  Truck,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import { ProtectedArtworkCanvas } from "@/components/ProtectedArtworkCanvas";
import type { FrameOption, PrintPreset } from "@/lib/print-export";
import type { GeneratedVariant } from "@/lib/types";

export interface VisualFramePresentation {
  isFramed: boolean;
  outerStyle: React.CSSProperties;
  innerStyle: React.CSSProperties;
  roomOuterStyle: React.CSSProperties;
  cornerColor: string;
}

interface MobileStep3AppShellProps {
  activeThemeName: string;
  isDoublePet: boolean;
  artworkUrl: string;
  petImage: string | null;
  generatedVariants: GeneratedVariant[];
  selectedVariantId: string | null;
  onSelectVariant: (variant: GeneratedVariant) => void;
  viewMode: "fusion" | "compare" | "room";
  onChangeViewMode: (mode: "fusion" | "compare" | "room") => void;
  sliderPos: number;
  onChangeSliderPos: (pos: number) => void;
  currentRoomCoords: { bottom: number; width: number; height: number };
  catalogSizes: PrintPreset[];
  selectedPrintPreset: PrintPreset;
  onSelectPrintPreset: (preset: PrintPreset) => void;
  catalogFrames: FrameOption[];
  selectedFrame: FrameOption;
  onSelectFrame: (frame: FrameOption) => void;
  visualFrame: VisualFramePresentation;
  currentUnitPrice: number;
  includePetInscription: boolean;
  onTogglePetInscription: (enabled: boolean) => void;
  petInscriptionName: string;
  onChangePetInscriptionName: (value: string) => void;
  dedicationNote: string;
  onChangeDedicationNote: (value: string) => void;
  isExportingPrint: boolean;
  onDownloadSample: () => void;
  onOpenShareModal: () => void;
  onOrderClick: () => void;
  onUploadNewPhotos: () => void;
  onTryAnotherStyle: () => void;
  isSimulationJob: boolean;
  simulationNotice: string | null;
  isSendingQuotaAlert?: boolean;
  quotaAlertSent?: boolean;
  onSendQuotaAlert?: () => void;
}

type ActiveSheet = "size" | "frame" | "customize" | "details" | null;

function getShortSizeLabel(preset: PrintPreset): string {
  const cleanCm = preset.cmDimensions.replace(/\s*\(.*?\)\s*/g, "").trim();
  return cleanCm || preset.tier;
}

function getShortFrameName(frame: FrameOption): string {
  const n = frame.name.toLowerCase();
  if (n.includes("canvas") || n.includes("bastidor") || n.includes("3d")) {
    return "Canvas 3D";
  }
  if (n.includes("negro")) return "Negro";
  if (n.includes("natural") || n.includes("madera")) return "Natural";
  if (n.includes("blanco")) return "Blanco";
  if (n.includes("dorado") || n.includes("oro")) return "Dorado";
  return frame.name;
}

export function MobileStep3AppShell({
  activeThemeName,
  isDoublePet,
  artworkUrl,
  petImage,
  generatedVariants,
  selectedVariantId,
  onSelectVariant,
  viewMode,
  onChangeViewMode,
  sliderPos,
  onChangeSliderPos,
  currentRoomCoords,
  catalogSizes,
  selectedPrintPreset,
  onSelectPrintPreset,
  catalogFrames,
  selectedFrame,
  onSelectFrame,
  visualFrame,
  currentUnitPrice,
  includePetInscription,
  onTogglePetInscription,
  petInscriptionName,
  onChangePetInscriptionName,
  dedicationNote,
  onChangeDedicationNote,
  isExportingPrint,
  onDownloadSample,
  onOpenShareModal,
  onOrderClick,
  onUploadNewPhotos,
  onTryAnotherStyle,
  isSimulationJob,
  simulationNotice,
  isSendingQuotaAlert = false,
  quotaAlertSent = false,
  onSendQuotaAlert,
}: MobileStep3AppShellProps) {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [previewFrameModal, setPreviewFrameModal] = useState<{
    frame: FrameOption;
    activeIndex: number;
  } | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const originalPrice = currentUnitPrice + 20;
  const shortSize = getShortSizeLabel(selectedPrintPreset);
  const hasName = includePetInscription && Boolean(petInscriptionName.trim());
  const hasDedication = Boolean(dedicationNote.trim());

  // Bloquear scroll del body mientras un bottom sheet está abierto
  useEffect(() => {
    if (!activeSheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSheet(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeSheet]);

  return (
    <div className="lg:hidden pb-28 space-y-3 animate-in fade-in duration-200">
      {/* Aviso compacto si fue modo simulación + botón 1-clic de alerta */}
      {isSimulationJob && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-[11px] leading-snug space-y-2.5">
          <div>
            <p className="font-bold text-red-950">Modo Demostración</p>
            <p className="mt-0.5 text-red-800">
              {simulationNotice ||
                "Mostrando vista ilustrativa por cuota temporal del motor IA."}
            </p>
          </div>
          {onSendQuotaAlert && (
            <button
              type="button"
              disabled={isSendingQuotaAlert || quotaAlertSent}
              onClick={onSendQuotaAlert}
              className={`w-full py-2 px-3 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
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
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. STAGE PRINCIPAL SIEMPRE VISIBLE (OBRA + VISTAS + PROPUESTAS)      */}
      {/* =================================================================== */}
      <div className="rounded-3xl overflow-hidden bg-white border border-cream-200 shadow-card">
        {/* Barra superior flotante compacta */}
        <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-2 bg-[#F8F3EA]">
          <div className="inline-flex items-center p-0.5 rounded-full bg-white/95 border border-cream-200 shadow-xs">
            <button
              type="button"
              onClick={() => onChangeViewMode("fusion")}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                viewMode === "fusion"
                  ? "bg-[#174B3D] text-white shadow-xs"
                  : "text-stone-600"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Obra</span>
            </button>
            {petImage && (
              <button
                type="button"
                onClick={() => onChangeViewMode("compare")}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                  viewMode === "compare"
                    ? "bg-[#174B3D] text-white shadow-xs"
                    : "text-stone-600"
                }`}
              >
                <Columns className="w-3 h-3" />
                <span>Antes</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onChangeViewMode("room")}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                viewMode === "room"
                  ? "bg-[#174B3D] text-white shadow-xs"
                  : "text-stone-600"
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Sala</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenShareModal}
              className="ap-share-pulse inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#174B3D] text-white text-[11px] font-bold shadow-xs"
              aria-label="Compartir resultado en redes"
            >
              <Share2 className="w-3 h-3 text-[#c6a26c]" />
              <span>Compartir</span>
            </button>
            <button
              type="button"
              onClick={onDownloadSample}
              disabled={isExportingPrint}
              aria-label="Descargar muestra con marca de agua"
              className="w-8 h-8 rounded-full bg-white border border-cream-200 text-stone-700 flex items-center justify-center shadow-xs disabled:opacity-50"
            >
              {isExportingPrint ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Lienzo / Comparador / Sala (Altura optimizada para pantalla móvil) */}
        <div
          className={`relative px-4 pt-2 pb-4 flex items-center justify-center min-h-[290px] max-h-[46vh] overflow-hidden select-none ${
            viewMode === "room" ? "bg-[#ece9e2]/70" : "bg-[#F8F3EA]"
          }`}
        >
          {/* MODO 1: OBRA CON MARCO EN VIVO */}
          {viewMode === "fusion" && (
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative transition-all duration-300 select-none"
              style={{
                ...visualFrame.outerStyle,
                padding: visualFrame.isFramed ? "11px" : 0,
                WebkitTouchCallout: "none",
              }}
            >
              <div
                className="relative overflow-hidden bg-stone-900 transition-all duration-300"
                style={visualFrame.innerStyle}
              >
                <ProtectedArtworkCanvas
                  src={artworkUrl}
                  alt="Retrato finalizado"
                  maxHeightPx={320}
                  className="rounded-none block"
                />

                {hasName && (
                  <div className="absolute bottom-9 right-4 z-20 pointer-events-none select-none max-w-[75%] text-right transform -rotate-[6deg] origin-bottom-right">
                    <span
                      className={`font-brush ${
                        petInscriptionName.trim().length > 14
                          ? "text-base"
                          : petInscriptionName.trim().length > 9
                            ? "text-xl"
                            : "text-2xl"
                      } text-white tracking-wide font-normal leading-none whitespace-nowrap block`}
                    >
                      {petInscriptionName.trim()}
                    </span>
                  </div>
                )}

                <div
                  onContextMenu={(e) => e.preventDefault()}
                  className="absolute inset-0 z-10 pointer-events-auto select-none"
                />
              </div>
            </div>
          )}

          {/* MODO 2: COMPARADOR ANTES / DESPUÉS */}
          {viewMode === "compare" && petImage && (
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative h-[300px] aspect-[3/4] max-w-full rounded-2xl overflow-hidden border border-cream-200 bg-white shadow-card cursor-ew-resize select-none touch-none"
              onMouseDown={() => setIsDraggingSlider(true)}
              onMouseUp={() => setIsDraggingSlider(false)}
              onMouseLeave={() => setIsDraggingSlider(false)}
              onMouseMove={(e) => {
                if (!isDraggingSlider) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(
                  0,
                  Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
                );
                onChangeSliderPos(x);
              }}
              onTouchMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const touchX = e.touches[0].clientX;
                const x = Math.max(
                  0,
                  Math.min(100, ((touchX - rect.left) / rect.width) * 100),
                );
                onChangeSliderPos(x);
              }}
            >
              <img
                src={artworkUrl}
                alt="Retrato"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={petImage}
                  alt="Original"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                <span className="absolute top-2.5 left-2.5 bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-semibold text-stone-800">
                  Original
                </span>
              </div>
              <span className="absolute top-2.5 right-2.5 bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-semibold text-stone-900 max-w-[45%] truncate">
                {activeThemeName}
              </span>
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-stone-800 border border-cream-200 flex items-center justify-center shadow-md">
                  <MoveHorizontal className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* MODO 3: EN SALA */}
          {viewMode === "room" && (
            <div
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-fit max-w-full rounded-2xl overflow-hidden border border-cream-200 bg-[#EFEFEF] shadow-card select-none mx-auto"
            >
              <img
                src="/images/room-sizes-reference-2.png"
                alt="Escala en sala"
                draggable={false}
                className="block w-auto max-w-full max-h-[300px] object-contain pointer-events-none mx-auto"
              />
              <div
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  bottom: `${currentRoomCoords.bottom}%`,
                  width: `${currentRoomCoords.width}%`,
                  height: `${currentRoomCoords.height}%`,
                }}
                className="absolute transition-all duration-300 z-10"
              >
                <div
                  style={visualFrame.roomOuterStyle}
                  className="relative w-full h-full rounded-xs shadow-lg ring-1 ring-black/20 overflow-hidden bg-stone-900"
                >
                  <img
                    src={artworkUrl}
                    alt="Cuadro en sala"
                    draggable={false}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tira de Propuestas IA (Estilo miniaturas Nike justo debajo de la obra) */}
        {generatedVariants.length > 1 && (
          <div className="px-3 py-2.5 bg-white border-t border-cream-200/80 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 shrink-0">
              Propuestas
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {generatedVariants.map((variant, idx) => {
                const isSelected = selectedVariantId === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => onSelectVariant(variant)}
                    className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border transition-all shrink-0 ${
                      isSelected
                        ? "border-[#174B3D] bg-[#174B3D]/5 ring-1 ring-[#174B3D]/20"
                        : "border-cream-200 bg-cream-50/70"
                    }`}
                  >
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                      <img
                        src={variant.imageUrl}
                        alt={`Propuesta ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                      {isSelected && (
                        <span className="absolute inset-0 bg-[#174B3D]/35 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        isSelected ? "text-[#174B3D]" : "text-stone-700"
                      }`}
                    >
                      Opción {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. TARJETA COMPACTA DE PRODUCTO Y CONTROLES RÁPIDOS (SIN SCROLL)  */}
        {/* ================================================================= */}
        <div className="p-4 space-y-3.5 bg-white border-t border-cream-200/80">
          {/* Título + Precio en vivo */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-bold text-stone-900 leading-tight truncate">
                {isDoublePet ? "Retrato Doble" : "Retrato"} · {activeThemeName}
              </h2>
              <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                {selectedPrintPreset.tier} ({shortSize}) · {selectedFrame.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-lg font-extrabold text-[#174B3D] leading-none">
                S/ {currentUnitPrice.toFixed(2)}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="font-mono text-[10px] text-stone-400 line-through">
                  S/ {originalPrice.toFixed(0)}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  -S/ 20
                </span>
              </div>
            </div>
          </div>

          {/* Selector Visual de MEDIDAS (Swiper sin scrollbar + Modal Guía) */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Medida
              </span>
              <button
                type="button"
                onClick={() => setActiveSheet("size")}
                className="text-[11px] font-bold text-[#174B3D] underline underline-offset-2"
              >
                Ver guía de tamaños
              </button>
            </div>
            <Swiper
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={8}
              freeMode={{ enabled: true, momentumRatio: 0.75 }}
              grabCursor
              className="w-full !py-0.5"
            >
              {catalogSizes.map((preset) => {
                const isSelected = selectedPrintPreset.id === preset.id;
                const chipSize = getShortSizeLabel(preset);
                const chipPrice =
                  preset.pricePen + (selectedFrame?.priceModifierPen || 0);
                return (
                  <SwiperSlide key={preset.id} className="!w-auto">
                    <button
                      type="button"
                      onClick={() => onSelectPrintPreset(preset)}
                      className={`flex flex-col items-start px-3 py-2 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-[#174B3D] bg-[#174B3D]/5 ring-1 ring-[#174B3D]/25"
                          : "border-cream-200 bg-cream-50/70"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-bold leading-none whitespace-nowrap ${
                            isSelected ? "text-[#174B3D]" : "text-stone-800"
                          }`}
                        >
                          {chipSize}
                        </span>
                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-[#174B3D] text-white flex items-center justify-center shrink-0">
                            <Check className="w-2 h-2 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] font-semibold text-stone-500 mt-1 leading-none whitespace-nowrap">
                        S/ {chipPrice.toFixed(0)}
                      </span>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Selector Visual de MARCOS (Swiper con miniatura sin scrollbar + Modal Detalles) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Marco
              </span>
              <button
                type="button"
                onClick={() => setActiveSheet("frame")}
                className="text-[11px] font-bold text-[#174B3D] underline underline-offset-2"
              >
                Ver detalles de marcos
              </button>
            </div>
            <Swiper
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={8}
              freeMode={{ enabled: true, momentumRatio: 0.75 }}
              grabCursor
              className="w-full !py-0.5"
            >
              {catalogFrames.map((frame) => {
                const isSelected = selectedFrame.id === frame.id;
                const frameImg = frame.imageUrl || frame.images?.[0] || null;
                return (
                  <SwiperSlide key={frame.id} className="!w-auto">
                    <button
                      type="button"
                      onClick={() => onSelectFrame(frame)}
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-[#174B3D] bg-[#174B3D]/5 ring-1 ring-[#174B3D]/25"
                          : "border-cream-200 bg-cream-50/70"
                      }`}
                    >
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-cream-200 shrink-0 flex items-center justify-center bg-stone-200">
                        {frameImg ? (
                          <img
                            src={frameImg}
                            alt={frame.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              backgroundColor: frame.colorHex || "#174B3D",
                            }}
                          >
                            <Frame className="w-4 h-4 text-white/80" />
                          </span>
                        )}
                        {isSelected && (
                          <span className="absolute inset-0 bg-[#174B3D]/40 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-[11px] font-bold leading-tight whitespace-nowrap ${
                            isSelected ? "text-[#174B3D]" : "text-stone-800"
                          }`}
                        >
                          {getShortFrameName(frame)}
                        </p>
                        <p className="text-[10px] font-semibold text-stone-500 leading-tight mt-0.5 whitespace-nowrap">
                          {frame.priceModifierPen === 0
                            ? "Incluido"
                            : `+ S/ ${frame.priceModifierPen.toFixed(0)}`}
                        </p>
                      </div>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Botones de Personalización que abren Bottom Sheets */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveSheet("customize")}
              className={`flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-2xl border text-left transition-colors ${
                hasName || hasDedication
                  ? "bg-emerald-50/70 border-emerald-200 text-[#174B3D]"
                  : "bg-cream-50 border-cream-200 text-stone-700"
              }`}
            >
              <div className="min-w-0 flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-[#94713F] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold truncate">
                    {hasName
                      ? petInscriptionName.trim()
                      : "Nombre / Dedicatoria"}
                  </p>
                  <p className="text-[9px] text-stone-500 truncate">
                    {hasName || hasDedication ? "Personalizado" : "Gratis · Toca aquí"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet("details")}
              className="flex items-center justify-between gap-1.5 px-3 py-2.5 rounded-2xl bg-cream-50 border border-cream-200 text-stone-700 text-left"
            >
              <div className="min-w-0 flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-[#174B3D] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold truncate">
                    Envío y Detalles
                  </p>
                  <p className="text-[9px] text-stone-500 truncate">
                    Lima 3-5 días · 300 DPI
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BARRA INFERIOR FIJA ESTILO APP MÓVIL (TAMAÑO + ORDENAR)           */}
      {/* =================================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-cream-200 px-3.5 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveSheet("size")}
            className="flex items-center justify-between gap-1.5 px-3.5 py-3.5 rounded-full bg-cream-100 border border-cream-300 text-stone-900 text-xs font-bold shrink-0 active:scale-[0.98] transition-transform"
          >
            <Ruler className="w-3.5 h-3.5 text-[#94713F]" />
            <span>{shortSize}</span>
            <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
          </button>

          <button
            type="button"
            onClick={onOrderClick}
            className="flex-1 py-3.5 px-4 rounded-full bg-[#174B3D] hover:bg-[#123B30] active:scale-[0.99] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-card transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-[#c6a26c] shrink-0" />
            <span className="truncate">
              Ordenar · S/ {currentUnitPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. BOTTOM SHEETS NATIVOS (TAMAÑO / MARCO / PERSONALIZAR / DETALLES)  */}
      {/* =================================================================== */}
      {activeSheet && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/55 backdrop-blur-[1px] flex flex-col justify-end animate-in fade-in duration-150"
          onClick={() => setActiveSheet(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-t-3xl shadow-2xl border-t border-cream-200 max-h-[78dvh] flex flex-col animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Indicador de arrastre + Encabezado */}
            <div className="pt-2.5 pb-3 px-5 border-b border-cream-200 shrink-0">
              <div className="w-10 h-1 rounded-full bg-stone-300 mx-auto mb-3" />
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {activeSheet === "size" && "Selecciona el tamaño"}
                  {activeSheet === "frame" && "Presentación y Marco"}
                  {activeSheet === "customize" && "Personaliza tu cuadro"}
                  {activeSheet === "details" && "Entrega y opciones"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  aria-label="Cerrar panel"
                  className="w-8 h-8 rounded-full bg-cream-100 text-stone-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido desplazable interno */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {/* SHEET: TAMAÑOS */}
              {activeSheet === "size" &&
                catalogSizes.map((preset) => {
                  const isSelected = selectedPrintPreset.id === preset.id;
                  const finalPrice =
                    preset.pricePen + (selectedFrame?.priceModifierPen || 0);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectPrintPreset(preset);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-[#174B3D] bg-[#174B3D]/5 ring-1 ring-[#174B3D]/25"
                          : "border-cream-200 bg-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-stone-900">
                            {preset.tier}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#174B3D] text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 font-medium mt-0.5">
                          {preset.cmDimensions}
                        </p>
                        {preset.recommendedUse && (
                          <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                            {preset.recommendedUse}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-sm font-extrabold text-[#174B3D]">
                          S/ {finalPrice.toFixed(2)}
                        </p>
                        <p className="font-mono text-[10px] text-stone-400 line-through">
                          S/ {(finalPrice + 20).toFixed(0)}
                        </p>
                      </div>
                    </button>
                  );
                })}

              {/* SHEET: MARCOS */}
              {activeSheet === "frame" &&
                catalogFrames.map((frame) => {
                  const isSelected = selectedFrame.id === frame.id;
                  const frameImages = Array.from(
                    new Set(
                      [frame.imageUrl, ...(frame.images || [])].filter(
                        (u): u is string => Boolean(u),
                      ),
                    ),
                  );
                  const primaryThumb = frameImages[0] || null;

                  return (
                    <div
                      key={frame.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectFrame(frame)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectFrame(frame);
                        }
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? "border-[#174B3D] bg-[#174B3D]/5 ring-1 ring-[#174B3D]/25"
                          : "border-cream-200 bg-white"
                      }`}
                    >
                      {primaryThumb ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFrameModal({ frame, activeIndex: 0 });
                          }}
                          aria-label={`Ver vista previa de ${frame.name}`}
                          className="relative w-14 h-14 rounded-xl overflow-hidden border border-cream-200 shrink-0 group cursor-zoom-in"
                        >
                          <img
                            src={primaryThumb}
                            alt={frame.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/65 text-white flex items-center justify-center backdrop-blur-xs shadow-xs">
                            <ZoomIn className="w-3 h-3" />
                          </span>
                        </button>
                      ) : (
                        <span
                          className="w-14 h-14 rounded-xl border border-stone-300 shrink-0 flex items-center justify-center"
                          style={{
                            backgroundColor: frame.colorHex || "#174B3D",
                          }}
                        >
                          <Frame className="w-5 h-5 text-white/80" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-stone-900 truncate">
                            {frame.name}
                          </span>
                          <span className="text-[11px] font-bold text-[#174B3D] shrink-0">
                            {frame.priceModifierPen === 0
                              ? "Incluido"
                              : `+ S/ ${frame.priceModifierPen.toFixed(2)}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                          {frame.description}
                        </p>
                      </div>
                    </div>
                  );
                })}

              {/* SHEET: PERSONALIZAR NOMBRE Y DEDICATORIA */}
              {activeSheet === "customize" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-[#94713F]" />
                        Nombre en el lienzo (Gratis)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onTogglePetInscription(!includePetInscription)
                        }
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                          includePetInscription
                            ? "bg-[#174B3D] text-white"
                            : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {includePetInscription ? "Activo" : "Desactivado"}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={24}
                      value={petInscriptionName}
                      onChange={(e) => {
                        onChangePetInscriptionName(e.target.value);
                        if (!includePetInscription && e.target.value.trim()) {
                          onTogglePetInscription(true);
                        }
                      }}
                      placeholder="Ej. CHOPP, Luna, Max..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-sm text-stone-900 focus:border-[#174B3D] focus:outline-none"
                    />
                    <p className="text-[11px] text-stone-500">
                      Se pinta en estilo firma artística en la esquina inferior
                      derecha de tu cuadro.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 space-y-2">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#94713F]" />
                      Tarjeta de dedicatoria (Opcional · Gratis)
                    </span>
                    <textarea
                      rows={3}
                      maxLength={180}
                      value={dedicationNote}
                      onChange={(e) => onChangeDedicationNote(e.target.value)}
                      placeholder="Si es un regalo, escribe aquí un mensaje especial para incluirlo en una tarjeta impresa..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-sm text-stone-900 focus:border-[#174B3D] focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* SHEET: DETALLES DE ENTREGA Y ACCIONES SECUNDARIAS */}
              {activeSheet === "details" && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 space-y-1.5 text-xs text-stone-700">
                    <p className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#174B3D]" />
                      Tiempos de Entrega
                    </p>
                    <p>
                      <strong>Lima Metropolitana:</strong> 3 a 5 días hábiles
                      (delivery incluido).
                    </p>
                    <p>
                      <strong>Provincias y otros distritos:</strong> 5 a 7 días
                      hábiles.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 space-y-1 text-xs text-stone-600">
                    <p className="font-bold text-stone-900">
                      Calidad Fine Art 300 DPI
                    </p>
                    <p>
                      Tu cuadro físico se imprime sin marcas de agua sobre
                      lienzo de algodón tensado en bastidor de madera, listo
                      para colgar. Al completarse la entrega se desbloquea tu
                      Recuerdo Digital HD sin marca en <em>Mis Órdenes</em>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSheet(null);
                        onUploadNewPhotos();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-white border border-cream-300 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir otra foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSheet(null);
                        onTryAnotherStyle();
                      }}
                      className="py-2.5 px-3 rounded-xl bg-[#c6a26c]/20 border border-[#c6a26c]/40 text-[#174B3D] text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Otro escenario</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón Confirmar del Bottom Sheet */}
            <div className="p-4 border-t border-cream-200 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="w-full py-3.5 rounded-full bg-[#174B3D] text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-[#c6a26c]" />
                <span>
                  {activeSheet === "size"
                    ? `Confirmar tamaño · ${shortSize}`
                    : activeSheet === "frame"
                      ? `Confirmar · ${selectedFrame.name}`
                      : "Listo"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. LIGHTBOX PREVIEW DE IMAGEN DEL MARCO                             */}
      {/* =================================================================== */}
      {previewFrameModal && (() => {
        const { frame, activeIndex } = previewFrameModal;
        const gallery = Array.from(
          new Set(
            [frame.imageUrl, ...(frame.images || [])].filter(
              (u): u is string => Boolean(u),
            ),
          ),
        );
        const currentImg = gallery[activeIndex] || gallery[0] || "";

        return (
          <div
            className="fixed inset-0 z-[60] lg:hidden bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setPreviewFrameModal(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`Vista previa de ${frame.name}`}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-cream-200 flex flex-col max-h-[88dvh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3.5 border-b border-cream-200 flex items-center justify-between gap-2 bg-cream-50">
                <div className="min-w-0">
                  <h4 className="font-serif text-base font-bold text-stone-900 truncate">
                    {frame.name}
                  </h4>
                  <p className="text-[11px] font-bold text-[#174B3D]">
                    {frame.priceModifierPen === 0
                      ? "Incluido en el precio"
                      : `+ S/ ${frame.priceModifierPen.toFixed(2)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewFrameModal(null)}
                  aria-label="Cerrar vista previa del marco"
                  className="w-8 h-8 rounded-full bg-white border border-cream-300 text-stone-700 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-stone-950 flex items-center justify-center overflow-hidden">
                {currentImg && (
                  <img
                    src={currentImg}
                    alt={frame.name}
                    className="max-h-[46dvh] w-auto max-w-full object-contain rounded-xl"
                  />
                )}
              </div>

              {gallery.length > 1 && (
                <div className="px-4 pt-3 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                  {gallery.map((imgUrl, idx) => (
                    <button
                      key={`${frame.id}-thumb-${idx}`}
                      type="button"
                      onClick={() =>
                        setPreviewFrameModal({ frame, activeIndex: idx })
                      }
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        idx === activeIndex
                          ? "border-[#174B3D] ring-2 ring-[#174B3D]/25"
                          : "border-cream-200 opacity-70"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`${frame.name} ángulo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4 space-y-3">
                <p className="text-xs text-stone-600 leading-relaxed">
                  {frame.description}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSelectFrame(frame);
                    setPreviewFrameModal(null);
                  }}
                  className="w-full py-3 rounded-full bg-[#174B3D] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#c6a26c]" />
                  <span>Elegir este marco</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
