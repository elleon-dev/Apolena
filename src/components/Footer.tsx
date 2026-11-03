"use client";

import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#1C1B1A] text-[#FAF6F0] border-t border-[#D4A343]/40 pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        
        {/* Estructura Principal del Footer */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          
          {/* Identidad de Marca y Descripción */}
          <div className="space-y-3 max-w-lg">
            <span className="font-serif text-3xl sm:text-4xl font-extrabold tracking-wide text-white block">
              Apolena
            </span>
            <p className="text-sm sm:text-base text-[#D6D3D1] leading-relaxed">
              Atelier digital especializado en transformar retratos de mascotas en piezas artísticas de alta calidad listas para impresión y enmarcado.
            </p>
          </div>

          {/* Términos & Soporte (Tipografía más grande y clara) */}
          <div className="flex flex-wrap gap-6 text-xs sm:text-sm font-semibold text-[#F5F5F4]">
            <a href="#" className="hover:text-[#D4A343] transition-colors underline-offset-4 hover:underline">
              Políticas de Privacidad
            </a>
            <a href="#" className="hover:text-[#D4A343] transition-colors underline-offset-4 hover:underline">
              Términos del Servicio
            </a>
            <a href="#" className="hover:text-[#D4A343] transition-colors underline-offset-4 hover:underline">
              Contacto & Ayuda
            </a>
          </div>

        </div>

        {/* Separador e Información Inferior */}
        <div className="border-t border-[#A8A29E]/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#A8A29E]">
          <p>
            © {currentYear} Apolena. Todos los derechos reservados.
          </p>
          <p className="font-bold text-[#D4A343] tracking-wide">
            Retratos Personalizados de Mascotas
          </p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;