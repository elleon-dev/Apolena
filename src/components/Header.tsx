"use client";

import React, { useState } from "react";
import Image from "next/image";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E5C378]/50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-3">
        
        {/* Identidad de Marca */}
        <a href="#" className="flex items-center gap-2.5 focus:outline-none">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-[#D4A343] bg-white flex items-center justify-center p-0.5 shrink-0">
            <Image
              src="/logo.png"
              alt="Apolena Logo"
              width={52}
              height={52}
              className="object-cover rounded-full"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-extrabold tracking-tight text-[#1C1B1A] leading-none">
              Apolena
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-[#D4A343] mt-0.5">
              RETRATOS PERSONALIZADOS
            </span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1 bg-[#F3EBE0] px-4 py-2 rounded-full border border-[#E5C378]/40">
          <a
            href="#estilos"
            className="px-4 py-2 rounded-full text-xs font-bold text-[#1C1B1A] hover:bg-white hover:text-[#D4A343] transition-all"
          >
            Estilos
          </a>
          <a
            href="#retrato-final"
            className="px-4 py-2 rounded-full text-xs font-bold text-[#1C1B1A] hover:bg-white hover:text-[#D4A343] transition-all"
          >
            Retrato Final
          </a>
          <a
            href="#testimonios"
            className="px-4 py-2 rounded-full text-xs font-bold text-[#1C1B1A] hover:bg-white hover:text-[#D4A343] transition-all"
          >
            Casos de Éxito
          </a>
          <a
            href="#faq"
            className="px-4 py-2 rounded-full text-xs font-bold text-[#1C1B1A] hover:bg-white hover:text-[#D4A343] transition-all"
          >
            Preguntas Frecuentes
          </a>
        </nav>

        <div className="flex items-center gap-2">

          <a
            href="#crear"
            style={{ backgroundColor: '#D4A343', color: '#FFFFFF' }}
            className="text-xs sm:text-sm font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-md text-center whitespace-nowrap active:scale-95 transition-transform"
          >
            Crear Retrato
          </a>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden px-3 py-2 rounded-full bg-[#F3EBE0] border border-[#E5C378]/40 text-xs font-bold text-[#1C1B1A]"
            aria-label="Menú"
          >
            {isMenuOpen ? "Cerrar" : "Menú"}
          </button>
        </div>

      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-[#FAF6F0] border-b border-[#E5C378]/40 px-4 py-3 space-y-2">
          <a
            href="#estilos"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-[#1C1B1A] bg-[#F3EBE0]/70"
          >
            Estilos
          </a>
          <a
            href="#retrato-final"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-[#1C1B1A] bg-[#F3EBE0]/70"
          >
            Retrato Final
          </a>
          <a
            href="#testimonios"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-[#1C1B1A] bg-[#F3EBE0]/70"
          >
            Casos de Éxito
          </a>
          <a
            href="#faq"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-bold text-[#1C1B1A] bg-[#F3EBE0]/70"
          >
            Preguntas Frecuentes
          </a>
        </div>
      )}
    </header>
  );
}

export default Header;