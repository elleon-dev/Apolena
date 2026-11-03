"use client";

import React, { useState } from "react";

export function HeroSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <section className="py-10 sm:py-16 bg-[#FAF6F0] border-b border-[#E5C378]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        
        {/* Titular Principal */}
        <div className="space-y-3">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#D4A343] bg-[#F3EBE0] px-3 py-1 rounded-full border border-[#E5C378]/40">
            Paso 1 de 2: Tu Mascota
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#1C1B1A] leading-tight">
            Convierte a tu mascota en una obra de arte
          </h1>
          <p className="text-xs sm:text-base text-[#6B655F] max-w-xl mx-auto">
            Sube una foto clara de tu perro o gato y selecciona la celebridad o personaje histórico en el que deseas transformarlo.
          </p>
        </div>

        {/* Input de Tipo File (Caja de Carga Mobile-First) */}
        <div className="max-w-md mx-auto bg-[#F3EBE0] rounded-3xl p-6 border-2 border-dashed border-[#D4A343]/60 shadow-sm transition-all hover:border-[#D4A343]">
          <label htmlFor="pet-photo" className="cursor-pointer block space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-white border border-[#E5C378] flex items-center justify-center text-[#D4A343] font-bold text-xl shadow-xs">
              +
            </div>

            <div>
              <p className="text-sm font-bold text-[#1C1B1A]">
                {selectedFile ? selectedFile.name : "Selecciona o arrastra la foto de tu mascota"}
              </p>
              <p className="text-[11px] text-[#6B655F] mt-1">
                Formatos JPG, PNG (Recomendado buena iluminación)
              </p>
            </div>

            <input
              id="pet-photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <span className="inline-block bg-white hover:bg-[#FAF6F0] text-[#1C1B1A] text-xs font-bold px-5 py-2.5 rounded-full border border-[#E5C378]/80 shadow-2xs">
              {selectedFile ? "Cambiar Imagen" : "Examinar Archivos"}
            </span>
          </label>
        </div>

        {/* Botón para avanzar al siguiente paso */}
        {selectedFile && (
          <div className="pt-2 animate-fade-in">
            <a
              href="#estilos"
              style={{ backgroundColor: '#D4A343', color: '#FFFFFF' }}
              className="inline-block text-xs sm:text-sm font-extrabold px-8 py-3.5 rounded-full shadow-lg text-center"
            >
              Continuar a Seleccionar Personaje
            </a>
          </div>
        )}

      </div>
    </section>
  );
}

export default HeroSection;