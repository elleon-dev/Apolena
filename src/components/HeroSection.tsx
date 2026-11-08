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
    <section className="py-10 sm:py-16 bg-cream-100 border-b border-primary/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        {/* Titular Principal */}
        <div className="space-y-3">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-primary bg-primary-50 px-3 py-1 rounded-full border border-primary/30">
            Paso 1 de 2: Tu Mascota
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-secondary leading-tight">
            Convierte a tu mascota en una obra de arte
          </h1>
          <p className="text-xs sm:text-base text-secondary/70 max-w-xl mx-auto">
            Sube una foto clara de tu perro o gato y selecciona la celebridad o
            personaje histórico en el que deseas transformarlo.
          </p>
        </div>

        {/* Input de Tipo File (Caja de Carga Mobile-First) */}
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 border-2 border-dashed border-primary/60 shadow-sm transition-all hover:border-primary">
          <label htmlFor="pet-photo" className="cursor-pointer block space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-50 border border-primary/40 flex items-center justify-center text-primary font-bold text-xl shadow-xs">
              +
            </div>

            <div>
              <p className="text-sm font-bold text-secondary">
                {selectedFile
                  ? selectedFile.name
                  : "Selecciona o arrastra la foto de tu mascota"}
              </p>
              <p className="text-[11px] text-secondary/60 mt-1">
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

            <span className="inline-block bg-secondary hover:bg-secondary-800 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-2xs transition-colors">
              {selectedFile ? "Cambiar Imagen" : "Examinar Archivos"}
            </span>
          </label>
        </div>

        {/* Botón para avanzar al siguiente paso */}
        {selectedFile && (
          <div className="pt-2 animate-fade-in">
            <a
              href="#estilos"
              className="inline-block bg-primary hover:bg-primary-600 text-white text-xs sm:text-sm font-extrabold px-8 py-3.5 rounded-full shadow-lg text-center transition-colors"
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
