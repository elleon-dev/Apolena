"use client";

import React, { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Palette,
  ArrowRight,
  Check,
} from "lucide-react";

const SLIDE_MS = 6500;
const TILT_MAX_X = 14;
const TILT_MAX_Y = 18;

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
}

const BANNERS: BannerSlide[] = [
  {
    id: "banner-living-room",
    tag: "ATELIER DIGITAL PARA MASCOTAS",
    tagIcon: <Sparkles className="w-3.5 h-3.5 text-[#174B3D]" />,
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
    imageAlt:
      "Cuadros personalizados de mascotas en bastidor de madera montados en sala",
    badge: {
      title: "Full Screen de Galería",
      subtitle: "Lienzo de algodón · Listo para colgar",
    },
  },
  {
    id: "banner-split-payment",
    tag: "CONFIANZA Y PAGO SEGURO",
    tagIcon: <ShieldCheck className="w-3.5 h-3.5 text-[#174B3D]" />,
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
    imageAlt: "Retrato personalizado de mascota en traje imperial inca",
    badge: {
      title: "Modalidad 50% / 50%",
      subtitle: "Pagas el saldo al recibir tu cuadro",
    },
  },
  {
    id: "banner-collections",
    tag: "COLECCIONES EXCLUSIVAS",
    tagIcon: <Palette className="w-3.5 h-3.5 text-[#174B3D]" />,
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
    imageAlt:
      "Retrato personalizado de mascota en estilo Capitán Jack Sparrow",
    badge: {
      title: "2 Propuestas Artísticas",
      subtitle: "Técnica óleo y claroscuro en cada orden",
    },
  },
];

function GoldOrnament() {
  return (
    <svg
      viewBox="0 0 240 28"
      className="w-44 sm:w-52 h-6 text-[#c6a26c]"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 14H88M152 14H232"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M95 14C102 6 110 6 120 14C130 6 138 6 145 14C138 22 130 22 120 14C110 22 102 22 95 14Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="120" cy="14" r="3" fill="currentColor" />
      <circle cx="88" cy="14" r="2" fill="currentColor" />
      <circle cx="152" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

function TiltCard({
  banner,
  priorityImage,
}: {
  banner: BannerSlide;
  priorityImage: boolean;
}) {
  const tiltRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    el.style.transition = "transform 120ms ease-out";
    el.style.setProperty("--rx", ((0.5 - py) * TILT_MAX_X).toFixed(2));
    el.style.setProperty("--ry", ((px - 0.5) * TILT_MAX_Y).toFixed(2));
    el.style.setProperty("--gx", (px * 100).toFixed(1));
    el.style.setProperty("--gy", (py * 100).toFixed(1));
    el.style.setProperty("--go", "1");
  };

  const handleLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transition = "transform 700ms cubic-bezier(.22,1,.36,1)";
    el.style.setProperty("--rx", "0");
    el.style.setProperty("--ry", "0");
    el.style.setProperty("--go", "0");
  };

  return (
    <div
      className="ap-m ap-card-in w-full max-w-[360px] sm:max-w-[440px] mx-auto"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="ap-m ap-float" style={{ perspective: "1100px" }}>
        <div
          ref={tiltRef}
          className="relative w-full aspect-[4/3] sm:aspect-square"
          style={{
            transformStyle: "preserve-3d",
            transform:
              "rotateX(calc(var(--rx, 0) * 1deg)) rotateY(calc(var(--ry, 0) * 1deg))",
            willChange: "transform",
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#c6a26c]/45 bg-[#174B3D]"
            style={{
              boxShadow:
                "calc(var(--ry, 0) * -2px) calc(var(--rx, 0) * 2px + 18px) 40px rgba(23, 75, 61, 0.22)",
            }}
          >
            <Image
              src={banner.imageSrc}
              alt={banner.imageAlt}
              fill
              priority={priorityImage}
              loading={priorityImage ? undefined : "eager"}
              className="ap-m ap-kenburns object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 440px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 hidden sm:block"
              style={{
                opacity: "var(--go, 0)",
                background:
                  "radial-gradient(circle at calc(var(--gx, 50) * 1%) calc(var(--gy, 50) * 1%), rgba(255,255,255,.30), transparent 55%)",
              }}
            />
          </div>

          <div
            className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#174B3D]/95 backdrop-blur-md border border-[#c6a26c]/40 text-left flex items-center justify-between gap-3 shadow-lg"
            style={{ transform: "translateZ(60px)" }}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {banner.badge.title}
              </p>
              <p className="text-[11px] text-[#FFFBF2]/80 truncate">
                {banner.badge.subtitle}
              </p>
            </div>
            <span className="w-7 h-7 rounded-full bg-[#c6a26c] text-[#174B3D] flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-[#174B3D]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawnCheck({ delay }: { delay: number }) {
  const style = { animationDelay: `${delay}ms` };
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 flex-shrink-0 mt-0.5"
      fill="none"
      stroke="#174B3D"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        pathLength={1}
        className="ap-m ap-draw"
        stroke="#c6a26c"
        style={style}
      />
      <path
        d="m8.5 12.5 2.5 2.5 4.5-5"
        pathLength={1}
        className="ap-m ap-draw"
        style={{ animationDelay: `${delay + 250}ms` }}
      />
    </svg>
  );
}

export default function BannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
  }, []);

  return (
    <section
      aria-label="Carrusel de Banners Apolena"
      className="relative w-full overflow-hidden bg-[#FFFBF2] text-[#141414] select-none border-b border-[#c6a26c]/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative min-h-[580px] sm:min-h-[560px] lg:min-h-[600px] flex items-center py-6 sm:py-8 lg:py-0">
        {/* Resplandores ambientales sutiles sobre fondo Tertiary #FFFBF2 */}
        <div
          aria-hidden="true"
          className="ap-m ap-blob-a absolute top-1/4 -left-32 w-72 sm:w-96 h-72 sm:h-96 bg-[#c6a26c]/15 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="ap-m ap-blob-b absolute bottom-10 right-10 w-72 sm:w-96 h-72 sm:h-96 bg-[#174B3D]/8 rounded-full blur-3xl pointer-events-none"
        />

        {BANNERS.map((banner, index) => {
          const isActive = index === currentIndex;
          const words = banner.headline.split(" ");

          const tagDelay = 0;
          const titleStart = 180;
          const subDelay = titleStart + words.length * 70 + 60;
          const bulletsStart = subDelay + 180;
          const ctaDelay = bulletsStart + banner.bullets.length * 130 + 80;

          return (
            <div
              key={banner.id}
              aria-hidden={!isActive}
              className={`w-full z-10 transition-all duration-500 ${
                isActive
                  ? "relative opacity-100 pointer-events-auto flex items-center"
                  : "absolute inset-0 opacity-0 pointer-events-none hidden"
              }`}
            >
              <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
                <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
                  {/* Ornamento Dorado Editorial + Tag Pill */}
                  <div
                    className="ap-m ap-rise space-y-2"
                    style={{ animationDelay: `${tagDelay}ms` }}
                  >
                    <GoldOrnament />
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#c6a26c]/20 border border-[#c6a26c]/45 text-[11px] sm:text-xs font-extrabold tracking-widest uppercase text-[#174B3D]">
                      {banner.tagIcon}
                      <span>{banner.tag}</span>
                    </div>
                  </div>

                  {/* Titular en Primary #174B3D */}
                  <h1
                    aria-label={banner.headline}
                    className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#174B3D] leading-tight tracking-tight"
                  >
                    {words.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        aria-hidden="true"
                        className="ap-m ap-word inline-block mr-[0.25em]"
                        style={{
                          animationDelay: `${titleStart + wIdx * 70}ms`,
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </h1>

                  {/* Subtítulo en Negro / Carbón */}
                  <p
                    className="ap-m ap-rise text-xs sm:text-base text-[#141414]/85 font-normal leading-relaxed max-w-xl"
                    style={{ animationDelay: `${subDelay}ms` }}
                  >
                    {banner.subheadline}
                  </p>

                  {/* Bullets */}
                  <ul className="space-y-2 sm:space-y-2.5 pt-1">
                    {banner.bullets.map((bullet, bIdx) => {
                      const d = bulletsStart + bIdx * 130;
                      return (
                        <li
                          key={bIdx}
                          className="ap-m ap-rise flex items-start sm:items-center gap-2.5 text-xs sm:text-sm font-medium text-[#141414]"
                          style={{ animationDelay: `${d}ms` }}
                        >
                          <DrawnCheck delay={d + 150} />
                          <span>{bullet}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Botones de Acción (Secondary #c6a26c con texto #174B3D, igual a la referencia) */}
                  <div className="pt-2 sm:pt-3 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4">
                    <Link
                      href={banner.ctaLink}
                      className="ap-m ap-pop inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] active:scale-95 text-center"
                      style={{ animationDelay: `${ctaDelay}ms` }}
                    >
                      <span>{banner.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={banner.secondaryCtaLink}
                      className="ap-m ap-pop inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#174B3D] text-[#174B3D] hover:text-white border border-[#174B3D]/25 font-bold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 text-center"
                      style={{ animationDelay: `${ctaDelay + 120}ms` }}
                    >
                      <span>{banner.secondaryCtaText}</span>
                    </Link>
                  </div>
                </div>

                {/* Columna de imagen */}
                <div className="lg:col-span-5 flex justify-center items-center mt-2 lg:mt-0">
                  <TiltCard banner={banner} priorityImage={index === 0} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flechas de navegación */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Banner anterior"
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#174B3D]/90 hover:bg-[#174B3D] border border-[#c6a26c]/40 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Siguiente banner"
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#174B3D]/90 hover:bg-[#174B3D] border border-[#c6a26c]/40 text-white flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Dots con barra de progreso */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-2.5">
        {BANNERS.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={banner.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Ir al banner ${index + 1}: ${banner.tag}`}
              className={`relative h-2 sm:h-2.5 rounded-full overflow-hidden transition-all duration-500 ${
                isActive
                  ? "w-8 sm:w-12 bg-[#174B3D]/20"
                  : "w-2 sm:w-2.5 bg-[#174B3D]/30 hover:bg-[#174B3D]/60"
              }`}
            >
              {isActive && (
                <span
                  className="ap-progress absolute inset-0 rounded-full bg-[#174B3D]"
                  style={{
                    animationDuration: `${SLIDE_MS}ms`,
                    animationPlayState: isPaused ? "paused" : "running",
                  }}
                  onAnimationEnd={nextSlide}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Contador */}
      <div
        aria-hidden="true"
        className="absolute bottom-3 right-3 sm:right-8 z-20 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold tracking-widest text-[#174B3D]"
      >
        <span className="inline-block overflow-hidden h-4 leading-4">
          <span
            key={currentIndex}
            className="ap-m ap-num inline-block text-[#c6a26c]"
          >
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
        </span>
        <span className="text-[#174B3D]/40">/</span>
        <span>{String(BANNERS.length).padStart(2, "0")}</span>
      </div>
    </section>
  );
}
