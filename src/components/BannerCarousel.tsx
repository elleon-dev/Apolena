"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Palette,
  ArrowRight,
  CheckCircle2,
  Truck,
  MessageCircle,
  Frame,
} from "lucide-react";

export default function BannerCarousel() {
  return (
    <section
      aria-label="Presentación Principal de Apolena"
      className="relative w-full overflow-hidden bg-[#FAF7F2] text-[#141414]"
    >
      {/* ========================================================= */}
      {/* 1. VERSIÓN DESKTOP: La primera imagen como fondo completo */}
      {/* ========================================================= */}
      <div className="hidden lg:flex relative w-full overflow-hidden min-h-[540px] xl:min-h-[580px] 2xl:min-h-[620px] items-center">
        {/* Imagen de Fondo Original del Slide */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/banners/hero-canvas-bg-2.png"
            alt="Retrato personalizado de mascota en cuadro canvas de tela Apolena montado en sala"
            fill
            priority
            className="object-cover object-right xl:object-center"
            sizes="100vw"
          />
        </div>

        {/* Contenido Editorial alineado a la izquierda sobre la pared iluminada */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-lg xl:max-w-xl text-left space-y-4 xl:space-y-5">
            {/* Tag / Kicker Superior */}
            <div className="inline-block">
              <span className="text-xs sm:text-sm font-bold tracking-[0.14em] text-[#174B3D] uppercase">
                Retratos personalizados de mascotas
              </span>
            </div>

            {/* Titular Serif Principal */}
            <h1 className="font-serif text-4xl lg:text-5xl xl:text-[54px] font-bold text-[#174B3D] leading-[1.12] tracking-tight">
              Tu mascota, la protagonista de tu hogar.
            </h1>

            {/* Subtítulo Descriptivo */}
            <p className="text-stone-700 text-base lg:text-lg font-normal leading-relaxed max-w-lg">
              Transformamos su foto en un cuadro único en canvas, listo para colgar.
            </p>

            {/* Contenedor de Precio y Delivery */}
            <div className="pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center bg-[#FAF0E4]/95 backdrop-blur-xs border border-[#DECFBE] px-4 py-2 rounded-xl text-[#174B3D] shadow-xs">
                  <span className="font-extrabold text-base lg:text-lg tracking-tight">
                    Desde S/ 180.00
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-[#DECFBE] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#174B3D] shadow-xs">
                  <Truck className="w-3.5 h-3.5 text-[#174B3D]" />
                  <span>Delivery incluido</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 mt-2 font-medium">
                Elige tamaño y acabado para ver tu precio final.
              </p>
            </div>

            {/* CTAs y Enlaces de Confianza */}
            <div className="pt-2 xl:pt-4 flex flex-col items-start gap-3.5">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="#estilos"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#174B3D] hover:bg-[#0E2F26] text-white px-8 py-3.5 rounded-full font-bold text-sm lg:text-base shadow-md hover:shadow-lg transition-all active:scale-95 group"
                >
                  <span>Elegir mi estilo</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <a
                href="https://wa.me/51978323984?text=Hola%20Apolena%2C%20tengo%20una%20consulta%20sobre%20los%20cuadros%20personalizados"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#174B3D] hover:text-[#0E2F26] underline underline-offset-4 decoration-[#c6a26c] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                <span>¿Dudas? Escríbenos por WhatsApp</span>
              </a>

              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700 pt-1">
                <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
                <span>Apruebas el diseño antes de imprimir</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. VERSIÓN MÓVIL / TABLET: Fiel a la maqueta del iPhone   */}
      {/* ========================================================= */}
      <div className="block lg:hidden px-4 sm:px-6 py-8 sm:py-10 bg-[#FAF7F2]">
        <div className="max-w-lg mx-auto text-left">
          {/* Tag / Kicker Superior */}
          <span className="text-xs font-bold tracking-[0.14em] text-[#174B3D] uppercase block mb-2">
            Retratos personalizados de mascotas
          </span>

          {/* Titular */}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#174B3D] leading-tight tracking-tight mb-3">
            Tu mascota, la protagonista de tu hogar.
          </h1>

          {/* Subtítulo */}
          <p className="text-stone-600 text-sm sm:text-base font-normal leading-relaxed mb-6">
            Transformamos su foto en un cuadro único en canvas, listo para colgar.
          </p>

          {/* Imagen de la composición en sala (recorte del cuadro sobre la credenza) */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-[#E8DEC8] mb-6 bg-white">
            <Image
              src="/banners/hero-canvas-mobile.jpg"
              alt="Retrato personalizado de mascota en cuadro canvas de tela Apolena montado en sala"
              width={694}
              height={501}
              priority
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Píldora de Precio y Delivery */}
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <div className="inline-flex items-center bg-[#FAF0E4] border border-[#DECFBE] px-4 py-2 rounded-xl text-[#174B3D]">
              <span className="font-extrabold text-base tracking-tight">
                Desde S/ 180.00
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-white border border-[#DECFBE] px-3.5 py-1.5 rounded-full text-xs font-bold text-[#174B3D] shadow-xs">
              <Truck className="w-3.5 h-3.5 text-[#174B3D]" />
              <span>Delivery incluido</span>
            </div>
          </div>

          <p className="text-xs text-stone-500 font-medium mb-5">
            Elige tamaño y acabado para ver tu precio final.
          </p>

          {/* Botón CTA Elegir mi estilo */}
          <Link
            href="#estilos"
            className="w-full inline-flex items-center justify-center gap-2.5 bg-[#174B3D] hover:bg-[#0E2F26] text-white py-3.5 rounded-full font-bold text-sm shadow-md active:scale-95 transition-all mb-3.5"
          >
            <span>Elegir mi estilo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Enlace WhatsApp */}
          <div className="mb-3">
            <a
              href="https://wa.me/51978323984?text=Hola%20Apolena%2C%20tengo%20una%20consulta%20sobre%20los%20cuadros%20personalizados"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174B3D] hover:text-[#0E2F26] underline underline-offset-4 decoration-[#c6a26c]"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>¿Dudas? Escríbenos por WhatsApp</span>
            </a>
          </div>

          {/* Garantía */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
            <CheckCircle2 className="w-4 h-4 text-[#174B3D] shrink-0" />
            <span>Apruebas el diseño antes de imprimir</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. FRANJA DE VALOR: 3 Columnas sin emojis                 */}
      {/* ========================================================= */}
      <div className="w-full bg-[#FAF7F2] border-y border-[#E8DEC8] py-4 sm:py-5 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-0 md:divide-x divide-[#E8DEC8] text-center">
          <div className="flex items-center justify-center gap-2.5 py-1 px-4 text-[#174B3D] font-bold text-sm sm:text-base">
            <Palette className="w-5 h-5 text-[#174B3D] shrink-0" />
            <span>Diseño personalizado</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 py-1 px-4 text-[#174B3D] font-bold text-sm sm:text-base">
            <Frame className="w-5 h-5 text-[#174B3D]" />
            <span>Canvas listo para colgar</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 py-1 px-4 text-[#174B3D] font-bold text-sm sm:text-base">
            <Truck className="w-5 h-5 text-[#174B3D]" />
            <span>Delivery incluido</span>
          </div>
        </div>
      </div>
    </section>
  );
}
