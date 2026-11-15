"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { FAMOUS_CHARACTERS, FamousCharacter } from "@/data/characters";

interface StyleSelectionSectionProps {
  initialCharacters?: FamousCharacter[];
}

export default function StyleSelectionSection({
  initialCharacters,
}: StyleSelectionSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Inicializar con los personajes provistos por el servidor (desde la BD) o fallback local
  const [characters, setCharacters] = useState<FamousCharacter[]>(
    initialCharacters && initialCharacters.length > 0
      ? initialCharacters
      : FAMOUS_CHARACTERS,
  );

  // Sincronización dinámica del cliente con la base de datos (vía /api/templates)
  useEffect(() => {
    fetch("/api/templates", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (
          data?.templates &&
          Array.isArray(data.templates) &&
          data.templates.length > 0
        ) {
          const active = data.templates.filter(
            (c: FamousCharacter) => c.isAvailable !== false,
          );
          if (active.length > 0) {
            setCharacters(active);
          }
        }
      })
      .catch((err) =>
        console.warn("Error cargando personajes para el carrusel de estilos:", err),
      );
  }, []);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -380 : 380;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section
      id="estilos"
      className="relative py-14 sm:py-20 bg-[#FFFBF2] text-[#141414] overflow-hidden scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera de Sección */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#174B3D]/8 text-[#174B3D] text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#c6a26c]" />
            <span>Colecciones Exclusivas</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#174B3D] tracking-tight">
            Encuentra su estilo
          </h2>

          <p className="mt-3 text-stone-600 text-sm sm:text-base font-normal">
            Elige la personalidad de tu engreído: desde soberanos de nuestra historia hasta íconos del cine y la nobleza.
          </p>
        </div>

        {/* Controles de Navegación del Carrusel en Desktop */}
        <div className="hidden sm:flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Ver estilos anteriores"
            className="w-10 h-10 rounded-full border border-[#D9C7AE] bg-white text-[#174B3D] hover:bg-[#FAF0E4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Ver siguientes estilos"
            className="w-10 h-10 rounded-full border border-[#D9C7AE] bg-white text-[#174B3D] hover:bg-[#FAF0E4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Fila / Carrusel de Tarjetas de Personajes cargados desde la Base de Datos */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {characters.map((char) => {
            const displayImage =
              char.fusionSampleUrl ||
              char.characterImageUrl ||
              "/characters/style-realeza-clean.jpg";
            const displayName = char.name;

            return (
              <Link
                key={char.id}
                href={`/products/cuadros-personalizados?character=${char.id}`}
                className="group relative flex-none w-[280px] sm:w-[340px] lg:w-[360px] snap-center rounded-3xl overflow-hidden bg-white border border-[#E8DEC8]/80 shadow-md hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#174B3D] focus:ring-offset-2"
              >
                {/* Contenedor de la Imagen */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#FAF0E4]">
                  <Image
                    src={displayImage}
                    alt={`Retrato personalizado de mascota en estilo ${displayName}`}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 340px, 280px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                  />

                  {/* Sombra degradada sutil inferior para contraste */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Badge / Píldora de Nombre de Estilo */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-white/95 backdrop-blur-xs text-[#174B3D] group-hover:bg-[#174B3D] group-hover:text-white font-extrabold text-sm sm:text-base px-6 py-2 rounded-full shadow-lg border border-stone-200/60 transition-all duration-300 whitespace-nowrap flex items-center gap-1.5">
                      <span>{displayName}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer de la Sección con Enlace al Estudio Completo */}
        <div className="text-center mt-10">
          <Link
            href="/products/cuadros-personalizados"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#174B3D] hover:text-[#0E2F26] border-b-2 border-[#c6a26c] pb-0.5 transition-all group"
          >
            <span>Ver todos los atuendos y personajes en el Estudio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#c6a26c]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
