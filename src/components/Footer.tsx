"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#174B3D] text-white border-t border-[#c6a26c]/35 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Fila Principal del Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Columna 1: Logo Blanco sobre Primary #174B3D y Slogan */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/" className="inline-block">
              <div className="relative w-28 h-20">
                <Image
                  src="/logo-light.png"
                  alt="Apolena — Retratos Personalizados de Mascotas"
                  fill
                  sizes="112px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <span className="text-xs font-bold uppercase tracking-widest text-[#c6a26c] block">
              Retratos Personalizados de Mascotas
            </span>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Transformamos las fotografías de tu mascota en obras de arte en
              lienzo 100% algodón a 300 DPI, tensadas sobre bastidor de madera y
              listas para colgar.
            </p>
          </div>

          {/* Columna 2: Enlaces Útiles / Info */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5">
              <span className="font-bold text-[#c6a26c] uppercase tracking-wider block">
                Descubrir
              </span>
              <ul className="space-y-2 text-white/85">
                <li>
                  <Link
                    href="/products/cuadros-personalizados"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Crear Retrato
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#como-funciona"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Cómo Funciona
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#quienes-somos"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Quiénes Somos
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-[#c6a26c] uppercase tracking-wider block">
                Soporte
              </span>
              <ul className="space-y-2 text-white/85">
                <li>
                  <Link
                    href="/track"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Rastrear Pedido
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#contacto"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Atención al Cliente
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Mis Órdenes
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Columna 3: Suscripción por Correo */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-bold text-[#c6a26c] uppercase tracking-wider block text-xs">
              Recibe novedades y ofertas
            </span>
            <p className="text-xs text-white/80">
              Ingresa tu correo para recibir descuentos exclusivos en tus
              retratos personalizados.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Tu correo electrónico aquí"
                className="w-full px-4 py-2.5 rounded-full bg-[#11382D] border border-[#c6a26c]/40 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#c6a26c]"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] text-xs font-extrabold uppercase tracking-wider shadow-sm transition-colors whitespace-nowrap"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

        {/* Separador e Información Inferior */}
        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/75">
          <p>© {currentYear} Apolena. Todos los derechos reservados.</p>
          <p className="font-bold text-[#c6a26c]">
            Modalidad 50% Adelanto y 50% Contraentrega
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
