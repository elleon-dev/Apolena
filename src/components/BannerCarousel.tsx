"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Palette,
  ArrowRight,
  CheckCircle2,
  Check,
} from "lucide-react";

interface BannerSlide {
  id: string;
  tag: string;
  tagIcon: React.ReactNode;
  headline: string;
  subheadline: string;
  bullets: string[];
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  imageSrc: string;
  imageAlt: string;
  badge: {
    title: string;
    subtitle: string;
  };
  bgGradient: string;
}

const BANNERS: BannerSlide[] = [
  {
    id: "banner-living-room",
    tag: "ATELIER DIGITAL PARA MASCOTAS",
    tagIcon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
    headline: "El retrato de tu mascota en un lienzo de museo",
    subheadline:
      "Lienzo 100% algodón de bellas artes tensado a mano sobre bastidor de madera (Full Screen sin marco). Listo para colgar con orgullo en tu sala o dormitorio.",
    bullets: [
      "Lienzo tensado en bastidor de madera de 3.5 cm",
      "Impresión giclée a 300 DPI con preservación total de mirada",
      "Envío seguro y embalado a Lima y todas las provincias",
    ],
    ctaText: "Crear Retrato Ahora",
    ctaLink: "/products/cuadros-personalizados",
    secondaryCtaText: "Ver Cómo Funciona",
    secondaryCtaLink: "#como-funciona",
    imageSrc: "/banners/canvas-living-room.jpg",
    imageAlt: "Cuadros personalizados de mascotas en bastidor de madera montados en sala",
    badge: {
      title: "Full Screen de Galería",
      subtitle: "Lienzo de algodón · Listo para colgar",
    },
    bgGradient: "from-[#13253B] via-[#1A2F49] to-[#0F1E31]",
  },
  {
    id: "banner-split-payment",
    tag: "CONFIANZA Y PAGO SEGURO",
    tagIcon: <ShieldCheck className="w-3.5 h-3.5 text-primary" />,
    headline: "Pagas 50% de adelanto y 50% contraentrega al recibir",
    subheadline:
      "Aprobación previa garantizada: elaboramos 2 propuestas artísticas exclusivas por cada pedido antes de enviar a imprenta y empaque.",
    bullets: [
      "50% al ordenar para iniciar la fabricación artesanal",
      "50% restante contraentrega al recibir tu cuadro en casa",
      "Seguimiento en vivo en 3 etapas con tu Tracking ID único",
    ],
    ctaText: "Personalizar Mi Cuadro",
    ctaLink: "/products/cuadros-personalizados",
    secondaryCtaText: "Rastrear Pedido",
    secondaryCtaLink: "/track",
    imageSrc: "/fusions/inca-empire-cats.jpg",
    imageAlt: "Retrato personalizado de gato en traje imperial inca",
    badge: {
      title: "Modalidad 50% / 50%",
      subtitle: "Pagas el saldo al recibir tu cuadro",
    },
    bgGradient: "from-[#2A1810] via-[#381F13] to-[#1C120B]",
  },
  {
    id: "banner-collections",
    tag: "COLECCIONES EXCLUSIVAS",
    tagIcon: <Palette className="w-3.5 h-3.5 text-primary" />,
    headline: "De soberanos andinos a leyendas del cine",
    subheadline:
      "Explora nuestra cuidada galería de personajes históricos, reyes y cineastas, o sube tu propia fotografía temática para personalizar el vestuario.",
    bullets: [
      "Colecciones: Imperio Inca, Egipto, Cine Clásico y Época",
      "Disponible para 1 o 2 mascotas (individual o dúo)",
      "Medidas desde formato escritorio (S) hasta sala principal (XL)",
    ],
    ctaText: "Explorar la Colección",
    ctaLink: "/products/cuadros-personalizados",
    secondaryCtaText: "Quiénes Somos",
    secondaryCtaLink: "#quienes-somos",
    imageSrc: "/fusions/jack-sparrow-cat.jpg",
    imageAlt: "Retrato personalizado de mascota en estilo Capitán Jack Sparrow",
    badge: {
      title: "2 Propuestas Artísticas",
      subtitle: "Técnica óleo y claroscuro en cada orden",
    },
    bgGradient: "from-[#191F26] via-[#232B35] to-[#141920]",
  },
];

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  // Autoplay timer (every 6.5 seconds, pauses when hovering)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <section
      aria-label="Carrusel de Banners Apolena"
      className="relative w-full overflow-hidden bg-stone-900 text-white select-none border-b border-stone-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Container Slides */}
      <div className="relative min-h-[580px] sm:min-h-[560px] lg:min-h-[600px] flex items-center">
        {BANNERS.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex items-center ${
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Dynamic Gradient Background with Texture */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${banner.bgGradient} opacity-95`}
              />

              {/* Subtle ambient lighting effect */}
              <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Text Content Column (Left on Desktop) */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  {/* Tag Pill */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-primary-200">
                    {banner.tagIcon}
                    <span>{banner.tag}</span>
                  </div>

                  {/* Main Title */}
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
                    {banner.headline}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base text-stone-300 max-w-2xl font-light leading-relaxed">
                    {banner.subheadline}
                  </p>

                  {/* Bullets List */}
                  <ul className="space-y-2.5 pt-1">
                    {banner.bullets.map((bullet, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Buttons Row */}
                  <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
                    <Link
                      href={banner.ctaLink}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary hover:bg-primary-600 text-white font-bold text-sm shadow-lg hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <span>{banner.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={banner.secondaryCtaLink}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <span>{banner.secondaryCtaText}</span>
                    </Link>
                  </div>
                </div>

                {/* Visual Image Presentation Column (Right on Desktop) */}
                <div className="lg:col-span-5 flex justify-center items-center">
                  <div className="relative w-full max-w-[420px] aspect-[4/3] sm:aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-white/15 bg-stone-950 group">
                    <Image
                      src={banner.imageSrc}
                      alt={banner.imageAlt}
                      fill
                      priority={index === 0}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 420px"
                    />

                    {/* Subtle inner vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Floating Badge Card inside image */}
                    <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-left flex items-center justify-between gap-3 shadow-lg">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {banner.badge.title}
                        </p>
                        <p className="text-[11px] text-stone-300 truncate">
                          {banner.badge.subtitle}
                        </p>
                      </div>
                      <span className="w-7 h-7 rounded-full bg-primary/90 text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Banner anterior"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Siguiente banner"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pagination Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {BANNERS.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={banner.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir al banner ${index + 1}: ${banner.tag}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "w-8 bg-primary shadow-sm"
                  : "w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
