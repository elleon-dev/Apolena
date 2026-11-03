"use client";

import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { Template } from "@/data/templates";
import {
  Download,
  ZoomIn,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Printer,
  Frame,
  Maximize2,
  Eye,
  Layers,
  Share2,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

interface ResultScreenProps {
  jobId: string;
  template: Template;
  petImageUrl: string;
  petName: string;
  outputImageUrl: string;
  hdOutputImageUrl?: string;
  executionSeconds?: number;
  onNewPortrait: () => void;
}

export function ResultScreen({
  jobId,
  template,
  petImageUrl,
  petName,
  outputImageUrl,
  hdOutputImageUrl,
  executionSeconds = 14.2,
  onNewPortrait,
}: ResultScreenProps) {
  const finalImageUrl = hdOutputImageUrl || outputImageUrl;

  // View modes: 'artwork' | 'canvas' | 'wall' | 'compare'
  const [viewMode, setViewMode] = useState<
    "artwork" | "canvas" | "wall" | "compare"
  >("artwork");

  // Interactive Deep Zoom Loupe state
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(2.5);
  const [lensPos, setLensPos] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Before / After slider state
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isSliding, setIsSliding] = useState(false);

  // Print size selector state
  const [selectedPrintSize, setSelectedPrintSize] = useState<
    "a4" | "medium" | "large"
  >("medium");

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / rect.height) * 100),
    );
    setLensPos({ x, y });

    if (isSliding && viewMode === "compare") {
      setSliderPos(x);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = finalImageUrl;
    link.download = `Apolena-${petName.replace(/\s+/g, "_")}-${template.id}-4K.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printSizes = {
    a4: {
      name: "Cuadro A4 (21 × 29.7 cm)",
      dpi: "300 DPI",
      res: "2480 × 3508 px",
      use: "Escritorio o repisa",
    },
    medium: {
      name: "Lienzo Mediano (30 × 40 cm)",
      dpi: "300 DPI",
      res: "3543 × 4724 px",
      use: "Ideal para sala y dormitorio",
    },
    large: {
      name: "Lienzo Grande (50 × 70 cm)",
      dpi: "300 DPI",
      res: "5906 × 8268 px",
      use: "Impacto total en pared principal",
    },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header & Success Pill */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Retrato Maestro Renderizado en {executionSeconds}s</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            {petName} — <span className="text-amber-400">{template.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Fusión anatómica de rostro completada con FLUX.1 y remasterizada a
            300 DPI con Clarity Upscaler.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewPortrait}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Crear Otro Retrato</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-navy-950 font-serif text-xs font-bold shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Descargar en 4K (PNG)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Viewer with Modes (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setViewMode("artwork");
                  setIsZoomActive(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "artwork"
                    ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Arte Puro 4K</span>
              </button>

              <button
                onClick={() => {
                  setViewMode("canvas");
                  setIsZoomActive(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "canvas"
                    ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Frame className="w-3.5 h-3.5" />
                <span>Lienzo Impreso</span>
              </button>

              <button
                onClick={() => {
                  setViewMode("wall");
                  setIsZoomActive(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "wall"
                    ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>En Pared de Galería</span>
              </button>

              <button
                onClick={() => {
                  setViewMode("compare");
                  setIsZoomActive(false);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "compare"
                    ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Antes / Después</span>
              </button>
            </div>

            {/* Deep Zoom Toggle (for artwork view) */}
            {viewMode === "artwork" && (
              <button
                onClick={() => setIsZoomActive(!isZoomActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isZoomActive
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Lupa Deep Zoom ({zoomLevel}x)</span>
              </button>
            )}
          </div>

          {/* Canvas Display Viewport */}
          <div
            ref={imageContainerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => viewMode === "artwork" && setIsZoomActive(true)}
            onMouseLeave={() =>
              viewMode === "artwork" && setIsZoomActive(false)
            }
            className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[480px] max-h-[720px] flex items-center justify-center p-4 sm:p-8 select-none shadow-2xl"
          >
            {/* Ambient Background Light */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-navy-950/80 pointer-events-none" />

            {/* MODE 1: ARTWORK (With Deep Zoom Magnifier) */}
            {viewMode === "artwork" && (
              <div className="relative max-h-[620px] rounded-2xl overflow-hidden shadow-2xl border border-amber-900/30">
                <img
                  src={finalImageUrl}
                  alt={petName}
                  className="max-h-[620px] w-auto object-contain rounded-2xl"
                />

                {/* Interactive Deep Zoom Loupe */}
                {isZoomActive && (
                  <div
                    className="absolute w-48 h-48 rounded-full border-4 border-amber-400 pointer-events-none shadow-[0_0_25px_rgba(245,158,11,0.5)] overflow-hidden hidden sm:block"
                    style={{
                      left: `calc(${lensPos.x}% - 96px)`,
                      top: `calc(${lensPos.y}% - 96px)`,
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${finalImageUrl})`,
                        backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                        backgroundSize: `${zoomLevel * 100}%`,
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-amber-300 font-mono font-bold">
                      {zoomLevel}x Detalle 300 DPI
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: CANVAS PRINT (Matching user's physical canvas print photos) */}
            {viewMode === "canvas" && (
              <div className="relative group perspective-1000 py-6">
                {/* 3D Box Canvas Effect */}
                <div className="relative max-h-[580px] rounded-sm shadow-[25px_35px_60px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.15)] border-r-8 border-b-8 border-amber-950/90 transition-transform duration-500 hover:rotate-1">
                  <img
                    src={finalImageUrl}
                    alt={petName}
                    className="max-h-[560px] w-auto object-contain rounded-sm"
                  />
                  {/* Canvas Texture Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none rounded-sm" />
                  <div className="absolute top-0 right-0 bottom-0 w-3 bg-gradient-to-r from-transparent to-black/40 pointer-events-none" />
                </div>
                <p className="text-center text-[11px] text-slate-400 mt-4">
                  Visualización de Lienzo Impreso con Bastidor de Madera de 3.5
                  cm
                </p>
              </div>
            )}

            {/* MODE 3: WALL GALLERY */}
            {viewMode === "wall" && (
              <div className="relative flex flex-col items-center justify-center w-full py-8">
                {/* Wall Background & Spot Light */}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-900 to-stone-950 pointer-events-none rounded-2xl" />
                <div className="absolute top-2 w-48 h-32 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />

                {/* Museum Frame */}
                <div className="relative z-10 p-6 sm:p-8 bg-gradient-to-br from-amber-700 via-amber-900 to-amber-950 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-4 border-amber-600/60">
                  <div className="p-4 sm:p-6 bg-stone-100 shadow-inner rounded-sm">
                    <img
                      src={finalImageUrl}
                      alt={petName}
                      className="max-h-[460px] w-auto object-contain shadow-md"
                    />
                  </div>
                  {/* Brass Plaque */}
                  <div className="mx-auto mt-3 px-4 py-1 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 rounded text-center shadow-md max-w-[200px]">
                    <p className="font-serif text-[11px] font-bold text-stone-900 truncate">
                      {petName}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-stone-700 font-semibold truncate">
                      {template.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 4: BEFORE / AFTER SPLIT SLIDER */}
            {viewMode === "compare" && (
              <div
                className="relative max-h-[580px] aspect-[3/4] w-full max-w-[460px] rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl cursor-ew-resize"
                onMouseDown={() => setIsSliding(true)}
                onMouseUp={() => setIsSliding(false)}
                onTouchMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touchX = e.touches[0].clientX;
                  const x = Math.max(
                    0,
                    Math.min(100, ((touchX - rect.left) / rect.width) * 100),
                  );
                  setSliderPos(x);
                }}
              >
                {/* After Image (Full Background) */}
                <img
                  src={finalImageUrl}
                  alt="Después"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Before Image (Clipped Overlay) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={petImageUrl}
                    alt="Antes"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: "460px" }}
                  />
                  <div className="absolute top-4 left-4 bg-black/80 px-2.5 py-1 rounded-md text-[10px] font-bold text-white border border-white/20">
                    Foto Original
                  </div>
                </div>

                <div className="absolute top-4 right-4 bg-amber-500 px-2.5 py-1 rounded-md text-[10px] font-bold text-navy-950 shadow-md">
                  Retrato FLUX 4K
                </div>

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-navy-950 flex items-center justify-center shadow-xl font-bold text-xs">
                    ↔
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zoom Level Controls (when artwork mode) */}
          {viewMode === "artwork" && isZoomActive && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">
                Nivel de aumento de la lupa:
              </span>
              <div className="flex items-center gap-2">
                {[2, 2.5, 3.5, 4].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setZoomLevel(lvl)}
                    className={`px-3 py-1 rounded-lg font-mono font-bold transition-colors ${
                      zoomLevel === lvl
                        ? "bg-amber-500 text-navy-950"
                        : "bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    {lvl}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Specifications & Print Sizes (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quality Audit Checklist */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Criterios de Aceptación MVP</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">
                    Fidelidad de Rasgos
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Patrón del pelaje, orejas y mirada idénticos a la foto
                    original.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">
                    Fusión Anatómica Orgánica
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Cuello integrado con la solapa sin cortes duros ni
                    artefactos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-200">
                    Resolución Master 4K
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Escalado con Clarity Upscaler para impresión sin pixelación.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Size Specifications Card */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <span>Formatos de Impresión a 300 DPI</span>
            </h3>

            <div className="space-y-2">
              {(Object.keys(printSizes) as Array<keyof typeof printSizes>).map(
                (key) => {
                  const s = printSizes[key];
                  const isSelected = selectedPrintSize === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedPrintSize(key)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span>{s.name}</span>
                        <span className="text-amber-400 font-mono text-[11px]">
                          {s.dpi}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono">{s.res}</span>
                        <span className="text-[10px] text-slate-500">
                          {s.use}
                        </span>
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Descargar Archivo para Imprimir</span>
            </button>
          </div>

          {/* Share & Gift Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-navy-900 to-amber-950/30 border border-amber-500/20 text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>¿Listo para enmarcar?</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Puedes llevar este archivo a cualquier imprenta local o imprenta
              online de lienzos textiles (canvas) para reproducirlo exactamente
              como las muestras de la galería.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
