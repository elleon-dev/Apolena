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

/* ------------------------------------------------------------------ */
/*  AJUSTES RÁPIDOS                                                    */
/* ------------------------------------------------------------------ */
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
  bgGradient: string;
}

const BANNERS: BannerSlide[] = [
  {
    id: "banner-living-room",
    tag: "ATELIER DIGITAL PARA MASCOTAS",
    tagIcon: <Sparkles className="w-3.5 h-3.5 text-[#E9A17B]" />,
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
    bgGradient: "from-[#0A1F19] via-[#174B3D] to-[#0A1F19]",
  },
  {
    id: "banner-split-payment",
    tag: "CONFIANZA Y PAGO SEGURO",
    tagIcon: <ShieldCheck className="w-3.5 h-3.5 text-[#E9A17B]" />,
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
    bgGradient: "from-[#122A22] via-[#174B3D] to-[#0D211B]",
  },
  {
    id: "banner-collections",
    tag: "COLECCIONES EXCLUSIVAS",
    tagIcon: <Palette className="w-3.5 h-3.5 text-[#E9A17B]" />,
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
    bgGradient: "from-[#0F261F] via-[#174B3D] to-[#0A1C17]",
  },
];

const PARTICLES = [
  { left: 6, size: 3, dur: 14, delay: -2 },
  { left: 14, size: 2, dur: 18, delay: -9 },
  { left: 23, size: 4, dur: 16, delay: -5 },
  { left: 31, size: 2, dur: 20, delay: -12 },
  { left: 42, size: 3, dur: 15, delay: -7 },
  { left: 51, size: 2, dur: 19, delay: -1 },
  { left: 60, size: 4, dur: 17, delay: -10 },
  { left: 68, size: 2, dur: 13, delay: -4 },
  { left: 76, size: 3, dur: 21, delay: -14 },
  { left: 84, size: 2, dur: 16, delay: -6 },
  { left: 91, size: 3, dur: 18, delay: -11 },
  { left: 97, size: 2, dur: 15, delay: -3 },
];

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
      className="ap-m ap-card-in w-full max-w-[340px] sm:max-w-[420px] mx-auto"
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
            className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/20 bg-[#0A1F19]"
            style={{
              boxShadow:
                "calc(var(--ry, 0) * -2px) calc(var(--rx, 0) * 2px + 18px) 45px rgba(0,0,0,.5)",
            }}
          >
            <Image
              src={banner.imageSrc}
              alt={banner.imageAlt}
              fill
              priority={priorityImage}
              loading={priorityImage ? undefined : "eager"}
              className="ap-m ap-kenburns object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 420px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

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
            className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#0A1F19]/80 backdrop-blur-md border border-white/20 text-left flex items-center justify-between gap-3 shadow-lg"
            style={{ transform: "translateZ(60px)" }}
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {banner.badge.title}
              </p>
              <p className="text-[11px] text-[#F5EDE0]/80 truncate">
                {banner.badge.subtitle}
              </p>
            </div>
            <span className="w-7 h-7 rounded-full bg-[#E9A17B] text-white flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
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
      stroke="#E9A17B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" pathLength={1} className="ap-m ap-draw" style={style} />
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
      className="relative w-full overflow-hidden bg-[#0A1F19] text-[#F5EDE0] select-none border-b border-[#174B3D]/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative min-h-[580px] sm:min-h-[560px] lg:min-h-[600px] flex items-center py-6 sm:py-8 lg:py-0">
        {/* Tu fondo original */}
        {BANNERS.map((banner, index) => (
          <div
            key={`bg-${banner.id}`}
            aria-hidden="true"
            className={`ap-m ap-aurora absolute inset-0 bg-gradient-to-r ${banner.bgGradient} transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-95" : "opacity-0"
            }`}
          />
        ))}

        {/* Tus Blobs originales */}
        <div
          aria-hidden="true"
          className="ap-m ap-blob-a absolute top-1/4 -left-32 w-72 sm:w-96 h-72 sm:h-96 bg-[#174B3D]/30 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="ap-m ap-blob-b absolute bottom-10 right-10 w-72 sm:w-96 h-72 sm:h-96 bg-[#E9A17B]/15 rounded-full blur-3xl pointer-events-none"
        />

        {/* Tus Partículas originales */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="ap-m ap-particle absolute bottom-0 rounded-full bg-[#E9A17B]"
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Slides adaptados para móvil sin tocar estilos de texto */}
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
                <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
                  {/* Tag Pill */}
                  <div
                    className="ap-m ap-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[#E9A17B]"
                    style={{ animationDelay: `${tagDelay}ms` }}
                  >
                    {banner.tagIcon}
                    <span>{banner.tag}</span>
                  </div>

                  {/* Titular */}
                  <h1
                    aria-label={banner.headline}
                    className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight !text-white"
                  >
                    {words.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        aria-hidden="true"
                        className="ap-m ap-word inline-block mr-[0.25em]"
                        style={{ animationDelay: `${titleStart + wIdx * 70}ms` }}
                      >
                        {word}
                      </span>
                    ))}
                  </h1>

                  {/* Subtitle */}
                  <p
                    className="ap-m ap-rise text-xs sm:text-base text-[#F5EDE0]/85 font-light leading-relaxed"
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
                          className="ap-m ap-rise flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-[#F5EDE0]"
                          style={{ animationDelay: `${d}ms` }}
                        >
                          <DrawnCheck delay={d + 150} />
                          <span>{bullet}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {/* CTA Buttons */}
                  <div className="pt-2 sm:pt-3 flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4">
                    <Link
                      href={banner.ctaLink}
                      className="ap-m ap-pop inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#E9A17B] hover:bg-[#d88e68] text-white font-bold text-xs sm:text-sm shadow-lg transition-colors hover:scale-[1.02] active:scale-95 text-center"
                      style={{ animationDelay: `${ctaDelay}ms` }}
                    >
                      <span>{banner.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href={banner.secondaryCtaLink}
                      className="ap-m ap-pop inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-[#F5EDE0] border border-white/20 font-semibold text-xs sm:text-sm backdrop-blur-sm transition-colors hover:scale-[1.02] active:scale-95 text-center"
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

      {/* Flechas de navegación: se adaptan para no tapar contenido en pantalla chica */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Banner anterior"
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Siguiente banner"
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95"
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
                  ? "w-8 sm:w-12 bg-white/30"
                  : "w-2 sm:w-2.5 bg-white/40 hover:bg-white/70"
              }`}
            >
              {isActive && (
                <span
                  className="ap-progress absolute inset-0 rounded-full bg-[#E9A17B]"
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
        className="absolute bottom-3 right-3 sm:right-8 z-20 flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold tracking-widest text-white/70"
      >
        <span className="inline-block overflow-hidden h-4 leading-4">
          <span key={currentIndex} className="ap-m ap-num inline-block text-[#E9A17B]">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
        </span>
        <span className="text-white/40">/</span>
        <span>{String(BANNERS.length).padStart(2, "0")}</span>
      </div>
    </section>
  );
}