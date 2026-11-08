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
      className="w-full py-16 bg-[#FAF6F0] text-[#1C1B1A] border-b border-[#E8E2D9] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>QUIÉNES SOMOS</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-secondary leading-tight">
            Pasión por las Mascotas y Arte Fino
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Inmortalizamos a tu mejor amigo en lienzos de algodón de bellas artes, tensados a mano sobre bastidores de madera y listos para colgar en tu hogar.
          </p>
        </div>

        {/* Narrative & Visual Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-stone-900 aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/5] max-w-md mx-auto">
              <Image
                src="/banners/canvas-living-room.jpg"
                alt="Cuadros de lienzo de algodón Apolena montados en pared"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Floating Badge */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 text-left shadow-md flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-secondary truncate">
                    Bastidor de Madera Full Screen
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">
                    Lienzo 100% algodón · Listo para colgar
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Brief Story & 4 Pillars */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
              <strong>Apolena</strong> es un atelier digital dedicado a celebrar el amor por perros y gatos. Transformamos fotografías cotidianas en retratos de calidad museo a 300 DPI, envolviendo el bastidor en formato continuo para un acabado elegante sin necesidad de marcos tradicionales.
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Palette className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary text-xs sm:text-sm">
                    Arte Fiel
                  </h3>
                  <p className="text-xs text-stone-500 leading-snug">
                    2 opciones por pedido respetando los ojos y expresión original.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Frame className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary text-xs sm:text-sm">
                    Bastidor Full Screen
                  </h3>
                  <p className="text-xs text-stone-500 leading-snug">
                    Lienzo de algodón tensado artesanalmente, listo para colgar.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary text-xs sm:text-sm">
                    Modalidad 50% / 50%
                  </h3>
                  <p className="text-xs text-stone-500 leading-snug">
                    Abonas 50% al ordenar y el 50% restante al recibir en casa.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary text-xs sm:text-sm">
                    Envíos a Todo el Perú
                  </h3>
                  <p className="text-xs text-stone-500 leading-snug">
                    Despachos protegidos desde Lima a todas las ciudades.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-1">
              <Link
                href="/products/cuadros-personalizados"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary hover:bg-secondary-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Crear el Retrato de mi Mascota</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </Link>
            </div>
          </div>
        </div>

        {/* Concise Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-[#E8E2D9]">
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] text-center space-y-0.5 shadow-xs">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-primary block">
              +1,250
            </span>
            <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
              Cuadros Entregados
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] text-center space-y-0.5 shadow-xs">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-primary block">
              100%
            </span>
            <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
              Lienzo de Algodón
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] text-center space-y-0.5 shadow-xs">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-primary block">
              300 DPI
            </span>
            <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
              Resolución Giclée
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] text-center space-y-0.5 shadow-xs">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold text-primary block">
              4.9 / 5.0
            </span>
            <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
              Satisfacción de Clientes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
