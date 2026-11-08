"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white text-secondary border-t border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Fila Principal: Logotipo + Slogan breve | Enlaces */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-7 border-b border-secondary/10">
          {/* Logotipo Oficial + Slogan muy breve */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <Link
              href="/"
              className="relative w-36 h-11 sm:w-44 sm:h-13 shrink-0 transition-transform duration-300 hover:scale-[1.02]"
            >
              <Image
                src="/logo.png"
                alt="Apolena — Retratos Personalizados de Mascotas"
                fill
                sizes="(min-width: 640px) 176px, 144px"
                className="object-contain object-left"
              />
            </Link>

            <span className="hidden sm:block h-6 w-px bg-secondary/15" />

            <p className="text-xs sm:text-sm font-medium text-secondary/75">
              Tu mascota, convertida en obra de arte.
            </p>
          </div>

          {/* Navegación y Enlaces Legales */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-secondary/80">
            <Link
              href="/products/cuadros-personalizados"
              className="hover:text-primary transition-colors"
            >
              Crear Cuadro
            </Link>
            <Link
              href="/track"
              className="hover:text-primary transition-colors"
            >
              Seguimiento
            </Link>
            <Link
              href="#"
              className="hover:text-primary transition-colors"
            >
              Políticas de Privacidad
            </Link>
            <Link
              href="#"
              className="hover:text-primary transition-colors"
            >
              Términos del Servicio
            </Link>
            <Link
              href="/#contacto"
              className="hover:text-primary transition-colors"
            >
              Contacto & Ayuda
            </Link>
          </nav>
        </div>

        {/* Barra Inferior Minimalista */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary/60">
          <p>© {currentYear} Apolena. Todos los derechos reservados.</p>
          <p className="font-semibold text-primary tracking-wide">
            Retratos Personalizados de Mascotas · Hecho en Perú
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
