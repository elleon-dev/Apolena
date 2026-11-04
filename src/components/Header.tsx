"use client";

import React, { useState } from "react";
import Image from "next/image";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  const navItems = [
    { id: "inicio", label: "Inicio", href: "#" },
    { id: "estilos", label: "Estilos", href: "#estilos" },
    { id: "retrato-final", label: "Retrato Final", href: "#retrato-final" },
    { id: "testimonios", label: "Casos de Éxito", href: "#testimonios" },
    { id: "faq", label: "Preguntas Frecuentes", href: "#faq" },
  ];

  const handleScrollToTop = () => {
    setActiveSection("inicio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E5C378]/50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-3">

        {/* Identidad de Marca: Redirige al Inicio */}
        <a
          href="#"
          onClick={handleScrollToTop}
          className="flex items-center gap-2.5 focus:outline-none group"
        >
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden border-2 border-[#D4A343] bg-white flex items-center justify-center p-0.5 shrink-0 transition-transform group-hover:scale-105">
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

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F3EBE0] px-3 py-1.5 rounded-full border border-[#E5C378]/40">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setActiveSection(item.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-[#D4A343] shadow-xs"
                    : "text-[#1C1B1A] hover:bg-white/60 hover:text-[#D4A343]"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Acción de Reinicio Rápido */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleScrollToTop}
            style={{ backgroundColor: '#D4A343', color: '#FFFFFF' }}
            className="text-xs sm:text-sm font-extrabold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-md text-center whitespace-nowrap active:scale-95 transition-transform"
          >
            Nuevo Retrato
          </button>

          {/* Menú Móvil */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden px-3 py-2 rounded-full bg-[#F3EBE0] border border-[#E5C378]/40 text-xs font-bold text-[#1C1B1A]"
            aria-label="Menú"
          >
            {isMenuOpen ? "Cerrar" : "Menú"}
          </button>
        </div>

      </div>

      {/* Menú Desplegable Móvil */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#FAF6F0] border-b border-[#E5C378]/40 px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsMenuOpen(false);
                }}
                className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isActive
                    ? "bg-white text-[#D4A343] border border-[#E5C378]/40"
                    : "text-[#1C1B1A] bg-[#F3EBE0]/70"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}

export default Header;