"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  ArrowRight,
  Award,
  Palette,
  Frame,
} from "lucide-react";

export default function AboutSection() {
  return (
    <section
      id="quienes-somos"
      className="w-full py-20 bg-[#174B3D] text-white border-b border-[#c6a26c]/30 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Section con Logo Blanco (logo-light.png) sobre fondo Primary #174B3D */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="relative w-20 h-16 mx-auto mb-1">
            <Image
              src="/logo-light.png"
              alt="Apolena"
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-[#c6a26c]/40 text-[#c6a26c] text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>QUIÉNES SOMOS</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            Pasión por las Mascotas y Arte Fino
          </h2>

          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            Inmortalizamos a tu mejor amigo en lienzos de tela canvas de bellas
            artes, tensados a mano sobre bastidores de madera y listos para
            colgar en tu hogar.
          </p>
        </div>

        {/* Narrative & Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#c6a26c]/50 bg-[#0F3229] aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/5] max-w-md mx-auto">
              <Image
                src="/banners/canvas-living-room.jpg"
                alt="Cuadros de lienzo de algodón Apolena montados en pared"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Floating Badge */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-[#FFFBF2]/95 backdrop-blur-md border border-[#c6a26c]/40 text-left shadow-md flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#174B3D] truncate">
                    Bastidor de Madera Full Screen
                  </p>
                  <p className="text-[11px] text-[#141414]/70 truncate">
                    Lienzo de tela canvas · Listo para colgar
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#c6a26c]/25 text-[#174B3D] flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Brief Story & 4 Pillars */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              <strong className="text-[#c6a26c]">Apolena</strong> es un atelier
              digital dedicado a celebrar el amor por todo tipo de mascotas.
              Transformamos fotografías cotidianas en retratos de calidad museo
              a 300 DPI, envolviendo el bastidor en formato continuo para un
              acabado elegante sin necesidad de marcos tradicionales.
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c6a26c]/20 text-[#c6a26c] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Palette className="w-4 h-4 text-[#c6a26c]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    Arte Fiel
                  </h3>
                  <p className="text-xs text-white/75 leading-snug mt-0.5">
                    2 opciones por pedido respetando los ojos y expresión
                    original.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c6a26c]/20 text-[#c6a26c] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Frame className="w-4 h-4 text-[#c6a26c]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    Bastidor Full Screen
                  </h3>
                  <p className="text-xs text-white/75 leading-snug mt-0.5">
                    Lienzo de algodón tensado artesanalmente, listo para colgar.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c6a26c]/20 text-[#c6a26c] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-[#c6a26c]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    Modalidad 50% / 50%
                  </h3>
                  <p className="text-xs text-white/75 leading-snug mt-0.5">
                    Abonas 50% al ordenar y el 50% restante al recibir en casa.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#c6a26c]/20 text-[#c6a26c] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Truck className="w-4 h-4 text-[#c6a26c]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">
                    Envíos a Todo el Perú
                  </h3>
                  <p className="text-xs text-white/75 leading-snug mt-0.5">
                    Despachos protegidos desde Lima a todas las ciudades.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-1">
              <Link
                href="/products/cuadros-personalizados"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Crear el Retrato de mi Mascota</span>
                <ArrowRight className="w-4 h-4 text-[#174B3D]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Concise Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-white/15">
          <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 text-center space-y-0.5">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#c6a26c] block">
              +1,250
            </span>
            <p className="text-[11px] font-semibold text-white uppercase tracking-wider">
              Cuadros Entregados
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 text-center space-y-0.5">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#c6a26c] block">
              100%
            </span>
            <p className="text-[11px] font-semibold text-white uppercase tracking-wider">
              Lienzo de Algodón
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 text-center space-y-0.5">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#c6a26c] block">
              300 DPI
            </span>
            <p className="text-[11px] font-semibold text-white uppercase tracking-wider">
              Resolución Giclée
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c]/30 text-center space-y-0.5">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#c6a26c] block">
              4.9 / 5.0
            </span>
            <p className="text-[11px] font-semibold text-white uppercase tracking-wider">
              Satisfacción de Clientes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
