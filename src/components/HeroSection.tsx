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
    <section className="py-10 sm:py-16 bg-[#FFFBF2] border-b border-[#c6a26c]/25">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        {/* Titular Principal */}
        <div className="space-y-3">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#174B3D] bg-[#c6a26c]/20 px-3 py-1 rounded-full border border-[#c6a26c]/40">
            Paso 1 de 2: Tu Mascota
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#174B3D] leading-tight">
            Convierte a tu mascota en una obra de arte
          </h1>
          <p className="text-xs sm:text-base text-[#141414]/75 max-w-xl mx-auto">
            Sube una foto clara de tu perro o gato y selecciona la celebridad o
            personaje histórico en el que deseas transformarlo.
          </p>
        </div>

        {/* Input de Tipo File (Caja de Carga Mobile-First) */}
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border-2 border-dashed border-[#c6a26c] shadow-sm transition-all hover:border-[#174B3D]">
          <label htmlFor="pet-photo" className="cursor-pointer block space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#174B3D]/10 border border-[#174B3D]/30 flex items-center justify-center text-[#174B3D] font-bold text-xl shadow-xs">
              +
            </div>

            <div>
              <p className="text-sm font-bold text-[#174B3D]">
                {selectedFile
                  ? selectedFile.name
                  : "Selecciona o arrastra la foto de tu mascota"}
              </p>
              <p className="text-[11px] text-[#141414]/65 mt-1">
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

            <span className="inline-block bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] text-xs font-extrabold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-2xs transition-colors">
              {selectedFile ? "Cambiar Imagen" : "Examinar Archivos"}
            </span>
          </label>
        </div>

        {/* Botón para avanzar al siguiente paso */}
        {selectedFile && (
          <div className="pt-2 animate-fade-in">
            <a
              href="#estilos"
              className="inline-block bg-[#174B3D] hover:bg-[#134034] text-white text-xs sm:text-sm font-extrabold px-8 py-3.5 rounded-full shadow-lg text-center transition-colors"
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
