"use client";

import React, { useState, MouseEvent } from "react";

interface ResultSectionProps {
  /* BACKEND INTEGRATION NOTE: 
     - petName: Nombre de la mascota obtenido de la base de datos o estado global.
     - characterTitle: Personaje seleccionado por el usuario en el SliderSection.
     - petImageUrl: URL temporal/permanente de la foto subida en HeroSection.
     - outputImageUrl: URL de la imagen renderizada devuelta por la API de IA (FLUX/Replicate/OpenAI).
     - isLoading: Booleano para activar el Spinner de carga durante el procesado asíncrono.
     - onOrderPortrait: Callback que enviará la medida seleccionada y el ID del trabajo al backend/checkout.
  */
  petName?: string;
  characterTitle?: string;
  petImageUrl?: string | null;
  outputImageUrl?: string | null;
  isLoading?: boolean;
  onNewPortrait?: () => void;
  onOrderPortrait?: (size: string) => void;
}

export function ResultSection({
  petName = "Tu Mascota",
  characterTitle = "Personaje Seleccionado",
  petImageUrl = null,
  outputImageUrl = null,
  isLoading = false,
  onNewPortrait,
  onOrderPortrait,
}: ResultSectionProps) {
  const [viewMode, setViewMode] = useState<"artwork" | "compare">("artwork");
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isSliding, setIsSliding] = useState(false);

  const [selectedPrintSize, setSelectedPrintSize] = useState<"a4" | "medium" | "large">("medium");

  const printSizes = {
    a4: { id: "a4", name: "Cuadro A4 (21 × 29.7 cm)", dpi: "300 DPI", use: "Escritorio o repisa" },
    medium: { id: "medium", name: "Lienzo Mediano (30 × 40 cm)", dpi: "300 DPI", use: "Ideal para sala o dormitorio" },
    large: { id: "large", name: "Lienzo Grande (50 × 70 cm)", dpi: "300 DPI", use: "Impacto total en pared principal" },
  };

  const handleSliderMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isSliding || viewMode !== "compare") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderPos(x);
  };

  const handleOrderClick = () => {
    if (onOrderPortrait) {
      onOrderPortrait(selectedPrintSize);
    } else {
      /* BACKEND INTEGRATION NOTE: 
         Disparar aquí la petición POST al endpoint de pedidos /checkout con la medida elegida, 
         la imagen generada y los datos del cliente.
      */
      console.log(`[BACKEND HOOK]: Pedido iniciado para medida: ${selectedPrintSize}`);
    }
  };

  return (
    <section id="retrato-final" className="py-12 sm:py-16 bg-[#FAF6F0] border-t border-[#E5C378]/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#E5C378]/40">
          <div>
            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#D4A343] bg-[#F3EBE0] px-3 py-1 rounded-full border border-[#E5C378]/40 mb-2">
              Paso 3: Retrato Final
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#1C1B1A]">
              {petName} — <span className="text-[#D4A343]">{characterTitle}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#6B655F] mt-1">
              Visualiza el resultado procesado por IA y selecciona el formato para encargar tu cuadro.
            </p>
          </div>

          {onNewPortrait && (
            <button
              onClick={onNewPortrait}
              className="px-5 py-2.5 rounded-full bg-[#F3EBE0] hover:bg-white text-[#1C1B1A] text-xs font-bold border border-[#E5C378]/50 transition-all text-center"
            >
              Crear Otro Retrato
            </button>
          )}
        </div>

        {/* Layout Principal: Visor + Panel de Pedido */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Visor de Arte (8 Columnas) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Selector de Vistas */}
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#F3EBE0] border border-[#E5C378]/40 w-fit">
              <button
                onClick={() => setViewMode("artwork")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  viewMode === "artwork"
                    ? "bg-white text-[#D4A343] shadow-xs"
                    : "text-[#1C1B1A] hover:text-[#D4A343]"
                }`}
              >
                Arte Digital 4K
              </button>

              <button
                onClick={() => setViewMode("compare")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  viewMode === "compare"
                    ? "bg-white text-[#D4A343] shadow-xs"
                    : "text-[#1C1B1A] hover:text-[#D4A343]"
                }`}
              >
                Antes / Después
              </button>
            </div>

            {/* Contenedor del Lienzo A4 */}
            <div className="relative rounded-3xl bg-[#F3EBE0] border border-[#E5C378]/50 p-4 sm:p-6 flex items-center justify-center overflow-hidden shadow-xs">
              
              {/* BACKEND INTEGRATION NOTE: 
                  Estado 1: Renderizado cuando isLoading=true (petición a la API en progreso).
              */}
              {isLoading ? (
                <div className="text-center space-y-3 py-24">
                  <div className="w-10 h-10 rounded-full border-3 border-[#D4A343] border-t-transparent animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-[#D4A343] tracking-wide uppercase">
                    Generando retrato con IA...
                  </p>
                </div>
              ) : outputImageUrl ? (
                /* BACKEND INTEGRATION NOTE: 
                   Estado 2: Renderizado cuando outputImageUrl contiene la respuesta de la API de IA.
                */
                viewMode === "artwork" ? (
                  <div className="relative w-full max-w-[420px] aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-[#E5C378]/40 bg-white">
                    <img
                      src={outputImageUrl}
                      alt={petName}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                ) : (
                  <div
                    className="relative w-full max-w-[420px] aspect-[3/4] rounded-2xl overflow-hidden border border-[#D4A343] shadow-lg cursor-ew-resize select-none"
                    onMouseDown={() => setIsSliding(true)}
                    onMouseUp={() => setIsSliding(false)}
                    onMouseLeave={() => setIsSliding(false)}
                    onMouseMove={handleSliderMove}
                  >
                    <img
                      src={outputImageUrl}
                      alt="Después"
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderPos}%` }}
                    >
                      {petImageUrl ? (
                        <img
                          src={petImageUrl}
                          alt="Antes"
                          className="absolute inset-0 w-full h-full object-cover max-w-none"
                          style={{ width: "420px" }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-stone-300 flex items-center justify-center text-xs text-stone-600 font-bold">
                          Sin Foto Original
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-[#1C1B1A]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                        Foto Original
                      </span>
                    </div>

                    <span className="absolute top-3 right-3 bg-[#D4A343] text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                      Retrato Apolena
                    </span>

                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md pointer-events-none"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#1C1B1A] font-bold text-xs flex items-center justify-center shadow-md">
                        |
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* BACKEND INTEGRATION NOTE: 
                   Estado 3: Lienzo A4 vacio en espera de la respuesta de la API.
                */
                <div className="w-full max-w-[420px] aspect-[3/4] bg-white/50 border border-[#E5C378]/30 rounded-2xl shadow-inner"></div>
              )}

            </div>
          </div>

          {/* Panel Lateral: Selección de Medida y Pedido (4 Columnas) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="p-5 rounded-3xl bg-[#F3EBE0] border border-[#E5C378]/50 space-y-5">
              <div>
                <span className="text-[10px] font-bold text-[#D4A343] uppercase tracking-wider block">
                  Paso Final
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1C1B1A]">
                  Selecciona la Medida del Cuadro
                </h3>
              </div>

              {/* Opciones de Medida */}
              <div className="space-y-2.5">
                {(Object.keys(printSizes) as Array<keyof typeof printSizes>).map((key) => {
                  const size = printSizes[key];
                  const isSelected = selectedPrintSize === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedPrintSize(key)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white border-[#D4A343] shadow-xs"
                          : "bg-white/50 border-[#E5C378]/30 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#1C1B1A]">
                        <span>{size.name}</span>
                        <span className="text-[#D4A343] text-[11px]">{size.dpi}</span>
                      </div>
                      <p className="text-[10px] text-[#6B655F] mt-1">{size.use}</p>
                    </div>
                  );
                })}
              </div>

              {/* Botón Principal Comercial de Pedido */}
              <button
                type="button"
                onClick={handleOrderClick}
                style={{ backgroundColor: '#D4A343', color: '#FFFFFF' }}
                className="w-full py-3.5 text-xs sm:text-sm font-extrabold rounded-full shadow-md active:scale-95 transition-transform text-center"
              >
                Personalizar y Finalizar Pedido
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3EBE0]/60 border border-[#E5C378]/40 text-center">
              <p className="text-[11px] font-semibold text-[#6B655F]">
                Incluye impresión a 300 DPI y marco de madera listo para colgar.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

export default ResultSection;