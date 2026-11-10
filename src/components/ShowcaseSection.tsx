"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Palette,
  ArrowRight,
  MoveHorizontal,
  Sparkles,
  CheckCircle2,
  Ruler,
  Layers,
} from "lucide-react";

interface TransformationCase {
  id: string;
  petName: string;
  speciesLabel: string;
  characterName: string;
  collectionName: string;
  beforeImage: string;
  afterImage: string;
  description: string;
}

const CASES: TransformationCase[] = [
  {
    id: "case-dog-pirate",
    petName: "Max",
    speciesLabel: "Retrato Individual",
    characterName: "Capitán Jack Sparrow",
    collectionName: "Colección Cine & Leyendas",
    beforeImage: "/samples/dog-sample.jpg",
    afterImage: "/fusions/jack-sparrow-dog.jpg",
    description:
      "Conservamos la expresión noble, los rasgos y la mirada original de Max, integrándolo en el atuendo de capitán con iluminación de galería.",
  },
  {
    id: "case-cat-inca",
    petName: "Inti & Killa",
    speciesLabel: "Retrato Dúo Imperial",
    characterName: "Sapa Inca Imperial",
    collectionName: "Colección Historia Andina",
    beforeImage: "/samples/cat-sample.jpg",
    afterImage: "/fusions/inca-empire-cats.jpg",
    description:
      "Atuendo ceremonial del Tahuantinsuyo con tocado de oro y textiles andinos sobre el paisaje de Machu Picchu al atardecer.",
  },
  {
    id: "case-dog-gala",
    petName: "Bruno",
    speciesLabel: "Retrato de Época",
    characterName: "Don Vito Corleone",
    collectionName: "Colección Cine Clásico",
    beforeImage: "/samples/dog-sample.jpg",
    afterImage: "/fusions/godfather-dog.jpg",
    description:
      "Esmoquin formal con rosa roja en la solapa y claroscuro clásico digno de una sala principal o estudio ejecutivo.",
  },
];

const CHARACTER_GALLERY = [
  {
    id: "inca",
    title: "Sapa Inca Imperial",
    category: "Historia Andina",
    image: "/personajes/inca.jpg",
  },
  {
    id: "faraon",
    title: "Faraón de Egipto",
    category: "Antiguo Egipto",
    image: "/personajes/faraon.jpg",
  },
  {
    id: "jack-sparrow",
    title: "Capitán Pirata",
    category: "Cine & Aventura",
    image: "/personajes/jackSparrow.jpg",
  },
  {
    id: "afrodita",
    title: "Diosa Afrodita",
    category: "Mitología Clásica",
    image: "/personajes/afrodita.jpg",
  },
  {
    id: "zeus",
    title: "Zeus del Olimpo",
    category: "Mitología Clásica",
    image: "/personajes/zeus.jpg",
  },
  {
    id: "poseidon",
    title: "Rey Poseidón",
    category: "Mitología Clásica",
    image: "/personajes/poseidon.jpg",
  },
];

const SIZES_SUMMARY = [
  { code: "S", name: "Escritorio", dims: "20 × 30 cm", price: "S/ 90" },
  { code: "Sq", name: "Cuadrado", dims: "30 × 30 cm", price: "S/ 130" },
  { code: "M", name: "Mediano", dims: "30 × 40 cm", price: "S/ 140" },
  {
    code: "L",
    name: "Grande",
    dims: "40 × 50 cm",
    price: "S/ 180",
    popular: true,
  },
  { code: "XL", name: "Extra Grande", dims: "50 × 70 cm", price: "S/ 220" },
];

export default function ShowcaseSection() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeCase = CASES[selectedCaseIndex];

  const updateSliderFromClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(
      5,
      Math.min(95, ((clientX - rect.left) / rect.width) * 100),
    );
    setSliderPos(pct);
  };

  return (
    <section
      id="colecciones"
      className="w-full py-20 bg-[#FFFBF2] text-[#141414] border-b border-[#c6a26c]/25 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Encabezado Principal */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#174B3D]/10 border border-[#174B3D]/20 text-[#174B3D] text-xs font-bold tracking-widest uppercase">
            <Palette className="w-3.5 h-3.5" />
            <span>GALERÍA & TRANSFORMACIÓN REAL</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#174B3D]">
            Tu mascota siempre es la protagonista
          </h2>
          <p className="text-[#141414]/75 text-sm sm:text-base leading-relaxed">
            Los personajes son guías de vestuario y atmósfera: respetamos
            rigurosamente la especie, rostro, rasgos y expresión única de tu
            mascota.
          </p>
        </div>

        {/* Bloque 1: Comparador Interactivo Antes / Después + Casos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Columna Izquierda: Visor Deslizante Antes / Después */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div
              ref={containerRef}
              onMouseDown={(e) => {
                setIsDragging(true);
                updateSliderFromClientX(e.clientX);
              }}
              onMouseMove={(e) => {
                if (isDragging) updateSliderFromClientX(e.clientX);
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={(e) => updateSliderFromClientX(e.touches[0].clientX)}
              onTouchMove={(e) => updateSliderFromClientX(e.touches[0].clientX)}
              className="relative w-full max-w-[460px] aspect-[4/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-[#174B3D] cursor-ew-resize select-none"
            >
              {/* Imagen Después (Retrato Final) */}
              <Image
                src={activeCase.afterImage}
                alt={`Retrato final de ${activeCase.petName}`}
                fill
                sizes="(max-width: 1024px) 100vw, 460px"
                className="object-cover pointer-events-none"
              />

              {/* Capa Antes (Foto Original recortada por clipPath) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <Image
                  src={activeCase.beforeImage}
                  alt={`Foto original de ${activeCase.petName}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 460px"
                  className="object-cover"
                />
              </div>

              {/* Etiquetas Antes / Después */}
              <span className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/15">
                Foto Original
              </span>
              <span className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-[#174B3D] text-white text-[11px] font-bold uppercase tracking-wider shadow-md border border-[#c6a26c]/40">
                Lienzo Apolena
              </span>

              {/* Línea Divisoria con Control Central */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#FFFBF2] text-[#174B3D] shadow-xl border-2 border-[#c6a26c] flex items-center justify-center">
                  <MoveHorizontal className="w-5 h-5 text-[#174B3D]" />
                </div>
              </div>
            </div>

            <p className="text-xs text-[#141414]/65 mt-3 font-medium flex items-center gap-1.5">
              <MoveHorizontal className="w-3.5 h-3.5 text-[#174B3D]" />
              Desliza el control hacia los lados para comparar la foto original
              con el retrato
            </p>
          </div>

          {/* Columna Derecha: Selector de Casos y Especificaciones */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c6a26c]">
                CASOS DE ESTUDIO REALES
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#174B3D]">
                Fidelidad anatómica y acabado de museo
              </h3>
              <p className="text-xs sm:text-sm text-[#141414]/75 leading-relaxed">
                Selecciona uno de los ejemplos para inspeccionar cómo
                preservamos la identidad de cada mascota mientras vestimos la
                escena con el personaje elegido:
              </p>
            </div>

            {/* Botones de Casos */}
            <div className="space-y-3">
              {CASES.map((item, idx) => {
                const isSelected = idx === selectedCaseIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedCaseIndex(idx);
                      setSliderPos(50);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                      isSelected
                        ? "bg-white border-[#174B3D] shadow-sm ring-1 ring-[#174B3D]/20"
                        : "bg-white/70 border-[#E8DEC8] hover:border-[#c6a26c]"
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E8DEC8] bg-[#FFFBF2]">
                      <Image
                        src={item.afterImage}
                        alt={item.petName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-[#174B3D]">
                          {item.petName} —{" "}
                          <span className="text-[#94713F]">
                            {item.characterName}
                          </span>
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#174B3D]/10 text-[#174B3D]">
                          {item.speciesLabel}
                        </span>
                      </div>
                      <p className="text-xs text-[#141414]/75 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Garantías de Identidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E8DEC8] flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                <span className="text-xs font-semibold text-[#174B3D]">
                  Sin alteración de raza ni especie
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-[#E8DEC8] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#c6a26c] shrink-0" />
                <span className="text-xs font-semibold text-[#174B3D]">
                  2 propuestas artísticas por orden
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque 2: Vitrina de Personajes y Temáticas */}
        <div className="space-y-6 pt-6 border-t border-[#E8DEC8]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94713F]">
                CATÁLOGO DE VESTUARIOS Y ESCENAS
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#174B3D] mt-1">
                Estilos destacados listos en el estudio
              </h3>
            </div>
            <Link
              href="/products/cuadros-personalizados"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#174B3D] hover:text-[#94713F] transition-colors"
            >
              <span>Ver todos los personajes o subir mi propio estilo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CHARACTER_GALLERY.map((char) => (
              <Link
                key={char.id}
                href="/products/cuadros-personalizados"
                className="group bg-white rounded-2xl p-2.5 border border-[#E8DEC8] hover:border-[#c6a26c] hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#FFFBF2] mb-2.5">
                  <Image
                    src={char.image}
                    alt={char.title}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="text-left px-1 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94713F] block truncate">
                    {char.category}
                  </span>
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-[#174B3D] truncate group-hover:text-[#94713F] transition-colors">
                    {char.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bloque 3: Resumen Transparente de Medidas 300 DPI */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8DEC8] space-y-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#94713F]">
                <Ruler className="w-4 h-4 text-[#174B3D]" />
                <span>FORMATOS EN BASTIDOR DE MADERA (300 DPI)</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#174B3D]">
                Medidas disponibles en Lienzo 100% Algodón Full Screen
              </h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-xs font-semibold text-[#174B3D]">
              <Layers className="w-4 h-4 text-[#c6a26c]" />
              <span>Acabado Mate de Museo o Satinado Protector</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {SIZES_SUMMARY.map((sz) => (
              <Link
                key={sz.code}
                href="/products/cuadros-personalizados"
                className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md flex flex-col justify-between ${
                  sz.popular
                    ? "bg-[#FFFBF2] border-[#174B3D] ring-1 ring-[#174B3D]/25"
                    : "bg-[#FFFBF2]/60 border-[#E8DEC8] hover:border-[#c6a26c]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#174B3D] uppercase">
                      {sz.name} ({sz.code})
                    </span>
                    {sz.popular && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#c6a26c] text-[#174B3D]">
                        Más elegido
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#141414]/65 mt-1 font-medium">
                    {sz.dims} · 300 DPI
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E8DEC8] flex items-baseline justify-between">
                  <span className="font-serif text-lg font-extrabold text-[#174B3D]">
                    {sz.price}
                  </span>
                  <span className="text-[10px] font-bold text-[#94713F]">
                    50% adelanto
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
