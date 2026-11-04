"use client";

import React from "react";
import Image from "next/image";

const PERSONAJES = [
  {
    id: "afrodita",
    title: "Afrodita",
    category: "Mitología Griega",
    image: "/personajes/afrodita.jpg",
  },
  {
    id: "faraon",
    title: "Faraón",
    category: "Egipto Antiguo",
    image: "/personajes/faraon.jpg",
  },
  {
    id: "inca",
    title: "Inca Imperial",
    category: "Historia Andina",
    image: "/personajes/inca.jpg",
  },
  {
    id: "jack-sparrow",
    title: "Jack Sparrow",
    category: "Pirata de Leyenda",
    image: "/personajes/jackSparrow.jpg",
  },
  {
    id: "poseidon",
    title: "Poseidón",
    category: "Rey del Océano",
    image: "/personajes/poseidon.jpg",
  },
  {
    id: "zeus",
    title: "Zeus",
    category: "Dios del Olimpo",
    image: "/personajes/zeus.jpg",
  },
];

export function SliderSection() {
  return (
    <section id="estilos" className="py-12 sm:py-16 bg-[#FAF6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Encabezado del Paso 2 */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#D4A343] bg-[#F3EBE0] px-3 py-1 rounded-full border border-[#E5C378]/40">
            Paso 2: Elige el Personaje
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#1C1B1A] mt-2">
            Catálogo de Celebridades
          </h2>
          <p className="text-xs sm:text-sm text-[#6B655F] mt-2">
            Desliza para explorar los personajes disponibles para personalizar el cuadro de tu mascota.
          </p>
        </div>

        {/* Carrusel Deslizable Responsivo (Mobile-First) */}
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory">
          {PERSONAJES.map((personaje) => (
            <div
              key={personaje.id}
              className="snap-center shrink-0 w-[260px] sm:w-[280px] bg-[#F3EBE0] rounded-3xl p-3 border border-[#E5C378]/40 shadow-sm transition-all hover:shadow-md"
            >
              {/* Imagen Real del Personaje */}
              <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden bg-stone-200">
                <Image
                  src={personaje.image}
                  alt={personaje.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Información y Botón de Selección */}
              <div className="p-3 text-center space-y-2">
                <div>
                  <span className="text-[10px] font-semibold text-[#D4A343] uppercase tracking-wider block">
                    {personaje.category}
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#1C1B1A] mt-0.5">
                    {personaje.title}
                  </h3>
                </div>

                <button
                  type="button"
                  style={{ backgroundColor: '#D4A343', color: '#FFFFFF' }}
                  className="w-full py-2.5 text-xs font-bold rounded-full shadow-xs active:scale-95 transition-transform"
                >
                  Seleccionar Personaje
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default SliderSection;