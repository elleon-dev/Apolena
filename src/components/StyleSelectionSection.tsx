"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { FAMOUS_CHARACTERS, type FamousCharacter } from "@/data/characters";

interface StyleSelectionSectionProps {
  initialCharacters?: FamousCharacter[];
}

const SKELETON_COUNT = 6;

export default function StyleSelectionSection({
  initialCharacters,
}: StyleSelectionSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [characters, setCharacters] = useState<FamousCharacter[]>(
    initialCharacters && initialCharacters.length > 0
      ? initialCharacters
      : FAMOUS_CHARACTERS.filter((c) => c.isAvailable !== false),
  );

  // Sincronización dinámica del cliente con la base de datos (vía /api/templates)
  useEffect(() => {
    fetch("/api/templates", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          data?.fromDatabase &&
          Array.isArray(data.templates) &&
          data.templates.length > 0
        ) {
          const active = data.templates.filter(
            (c: FamousCharacter) => c.isAvailable !== false,
          );
          setCharacters(active);
        }
      })
      .catch(() => {});
  }, []);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [characters, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -420 : 420;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  const showSkeleton = characters.length === 0;

  return (
    <section
      id="estilos"
      className="relative py-14 sm:py-20 bg-[#FFFBF2] text-[#141414] overflow-hidden scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera de Sección */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
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
        <div className="hidden sm:flex items-center justify-end gap-2 mb-3">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={showSkeleton || !canScrollLeft}
            aria-label="Ver estilos anteriores"
            className="w-9 h-9 rounded-full border border-[#D9C7AE] bg-white text-[#174B3D] hover:bg-[#FAF0E4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={showSkeleton || !canScrollRight}
            aria-label="Ver siguientes estilos"
            className="w-9 h-9 rounded-full border border-[#D9C7AE] bg-white text-[#174B3D] hover:bg-[#FAF0E4] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carrusel Compacto de Retratos Verticales Completos (aspect-[2/3]) o Skeleton */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {showSkeleton
            ? Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <div
                  key={`style-skeleton-${idx}`}
                  aria-hidden="true"
                  className="relative flex-none w-[148px] sm:w-[168px] md:w-[180px] lg:w-[192px] snap-start rounded-2xl overflow-hidden bg-white border border-[#E8DEC8]/80 shadow-sm"
                >
                  <div className="relative aspect-[2/3] w-full bg-[#EFE6D5] animate-pulse">
                    <div className="absolute bottom-2.5 inset-x-4 flex justify-center">
                      <div className="h-7 w-24 rounded-full bg-white/80 border border-[#E8DEC8]/60" />
                    </div>
                  </div>
                </div>
              ))
            : characters.map((char) => {
                const displayImage =
                  char.fusionSampleUrl || char.characterImageUrl;
                const displayName = char.name;

                return (
                  <Link
                    key={char.id}
                    href={`/products/cuadros-personalizados?character=${char.id}`}
                    className="group relative flex-none w-[148px] sm:w-[168px] md:w-[180px] lg:w-[192px] snap-start rounded-2xl overflow-hidden bg-white border border-[#E8DEC8]/80 shadow-sm hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#174B3D] focus:ring-offset-2"
                  >
                    {/* Contenedor Vertical Completo 2:3 */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#FAF0E4]">
                      <Image
                        src={displayImage}
                        alt={`Retrato personalizado de mascota en estilo ${displayName}`}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 192px, (min-width: 640px) 168px, 148px"
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
                      />

                      {/* Sombra degradada inferior para legibilidad de la píldora */}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Badge / Píldora Compacta de Nombre de Estilo */}
                      <div className="absolute bottom-2.5 inset-x-2 z-10 flex justify-center">
                        <div className="max-w-full bg-white/95 backdrop-blur-xs text-[#174B3D] group-hover:bg-[#174B3D] group-hover:text-white font-extrabold text-[11px] sm:text-xs px-3 py-1.5 rounded-full shadow-md border border-stone-200/60 transition-all duration-300 flex items-center gap-1">
                          <span className="truncate">{displayName}</span>
                          <ArrowRight className="w-3 h-3 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* Footer de la Sección con Enlace al Estudio Completo */}
        <div className="text-center mt-8">
          <Link
            href="/products/cuadros-personalizados"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#174B3D] hover:text-[#0E2F26] border-b-2 border-[#c6a26c] pb-0.5 transition-all group"
          >
            <span>Ver todos los atuendos y personajes en el Estudio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-[#c6a26c]" />
          </Link>
        </div>

        {/* Mensaje Editorial: Manos artesanas detrás de cada retrato */}
        <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 sm:gap-6 text-center">
          <div className="hidden sm:block h-px w-12 lg:w-20 bg-gradient-to-r from-transparent to-[#c6a26c]/60" />
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/95 border border-[#E8DEC8] shadow-xs">
            <Sparkles className="w-4 h-4 text-[#c6a26c] shrink-0" />
            <span className="font-serif text-sm sm:text-base lg:text-lg font-bold text-[#174B3D] tracking-tight">
              Manos artesanas detrás de cada retrato
            </span>
          </div>
          <div className="hidden sm:block h-px w-12 lg:w-20 bg-gradient-to-l from-transparent to-[#c6a26c]/60" />
        </div>
      </div>
    </section>
  );
}