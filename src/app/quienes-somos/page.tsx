"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Heart,
  Sparkles,
  Landmark,
  PawPrint,
  ArrowRight,
  ShieldCheck,
  Award,
  Compass,
  Eye,
  Gem,
  CheckCircle2,
  Hammer,
  Layers,
  SunMedium,
} from "lucide-react";

const PILLARS = [
  {
    number: "01",
    icon: Sparkles,
    tag: "Identidad Única",
    title: "Su personalidad, protagonista",
    description:
      "Esa mirada curiosa, su expresión seria o su aire de dueño de la casa. Nos inspiran los detalles que hacen única a tu mascota para convertirla en protagonista: un emperador inca, una reina, un detective o el personaje que mejor le quede.",
  },
  {
    number: "02",
    icon: Heart,
    tag: "Vínculo Eterno",
    title: "Un recuerdo con significado",
    description:
      "Creamos retratos para celebrar su compañía, sorprender a alguien que ama a su mascota o recordar con cariño a quien dejó huella. Más que decorar un espacio, queremos darle un significado especial.",
  },
  {
    number: "03",
    icon: Landmark,
    tag: "Orgullo Peruano",
    title: "Creatividad con raíces",
    description:
      "Nuestra propuesta combina estilos clásicos y modernos con diseños inspirados en la cultura peruana. Una forma de unir el amor por las mascotas con los colores, las historias y las tradiciones que nos representan.",
  },
  {
    number: "04",
    icon: PawPrint,
    tag: "Nuestra Inspiración",
    title: "De nuestra familia a la tuya",
    description:
      "APOLENA nace del cariño por Apolo y Athena, nuestros gatos y la inspiración detrás de este proyecto. Ese vínculo nos mueve a crear algo que otros amantes de los animales puedan disfrutar en sus propios hogares.",
  },
];

const CORE_VALUES = [
  {
    title: "Amor por los animales",
    detail:
      "Cada retrato nace desde el respeto y la admiración por el vínculo genuino que compartes con tu mascota.",
  },
  {
    title: "Calidad artesanal",
    detail:
      "Cuidamos cada trazo digital, impresión en tela lienzo canvas y acabado para que tu cuadro perdure en el tiempo.",
  },
  {
    title: "Identidad y creatividad",
    detail:
      "Fusionamos arte clásico, tendencias actuales y esencia peruana en piezas únicas pensadas a medida.",
  },
  {
    title: "Cercanía y confianza",
    detail:
      "Te acompañamos en todo el proceso y revisas tu diseño antes de imprimir para garantizar tu satisfacción.",
  },
];

function RevealOnScroll({
  children,
  delayMs = 0,
  className = "",
  initialOffsetClass = "translate-y-10",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  initialOffsetClass?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : `opacity-0 ${initialOffsetClass}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function QuienesSomosPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#1C241E]">
      <Navbar />

      <main className="flex-1 overflow-x-hidden">
        {/* ══════════════════════════════════════════════════════════════════
            HERO PRINCIPAL: Misión a la izquierda + Cuadro perro policía a la derecha
        ══════════════════════════════════════════════════════════════════ */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 right-0 w-[420px] h-[420px] rounded-full bg-[#C6A26C]/15 blur-3xl"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* LADO IZQUIERDO: Misión y Propuesta de Valor */}
            <div
              className={`lg:col-span-6 space-y-6 transition-all duration-700 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B3B2B]/10 border border-[#1B3B2B]/15 text-[#1B3B2B] text-xs font-semibold tracking-[0.18em] uppercase">
                <PawPrint className="w-3.5 h-3.5 text-[#9A7438]" />
                <span>Quiénes Somos</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-bold text-[#1B3B2B] leading-[1.12] tracking-tight">
                Celebrar ese amor que tiene nombre, patas y personalidad.
              </h1>

              <div className="space-y-4 text-base sm:text-lg text-[#3D4740] leading-relaxed">
                <p>
                  En <strong className="font-semibold text-[#1B3B2B]">APOLENA</strong>{" "}
                  transformamos las fotos de tus mascotas en retratos llenos de
                  carácter, creatividad y cariño. Queremos que cada cuadro te haga
                  sonreír y refleje lo que tu compañero significa para ti.
                </p>
                <p className="font-medium text-[#1B3B2B] border-l-2 border-[#C6A26C] pl-4 italic">
                  “Porque quien ocupa un lugar tan especial en tu vida también
                  merece uno en tu pared.”
                </p>
              </div>

              {/* Botón de acción principal */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                <Link
                  href="/products/cuadros-personalizados"
                  className="group inline-flex items-center justify-center gap-3 px-7 py-4 rounded-full bg-[#1B3B2B] hover:bg-[#142D20] text-[#FAF6F0] font-semibold text-base shadow-lg shadow-[#1B3B2B]/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span>Crear el retrato de mi mascota</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Micro-indicadores de confianza */}
              <div className="pt-4 border-t border-[#1B3B2B]/10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-[#4B554E]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1B3B2B]" />
                  Apruebas el diseño antes de imprimir
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#9A7438]" />
                  Lienzo canvas y entrega en todo el Perú
                </span>
              </div>
            </div>

            {/* LADO DERECHO: Imagen principal perro-policia.jpg */}
            <div
              style={{ transitionDelay: "150ms" }}
              className={`lg:col-span-6 relative transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
              }`}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#1B3B2B]/20 border border-[#E5DEC9] bg-white aspect-square sm:aspect-[4/3] lg:aspect-square">
                <Image
                  src="/images/quienes-somos/perro-policia.jpg"
                  alt="Cuadro personalizado de perro policía Apolena en lienzo canvas"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B3B2B]/40 via-transparent to-transparent pointer-events-none" />

                {/* Etiqueta flotante elegante sobre la foto */}
                <div
                  style={{ transitionDelay: "550ms" }}
                  className={`absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto bg-[#FAF6F0]/95 backdrop-blur-md border border-[#E5DEC9] rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 transition-all duration-700 ${
                    mounted
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-6"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1B3B2B] text-[#FAF6F0] flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#E3C184]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#9A7438]">
                      Arte hecho a medida
                    </p>
                    <p className="text-sm font-semibold text-[#1B3B2B]">
                      Inspirado en Apolo &amp; Athena
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            MISIÓN, VISIÓN Y VALORES
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-white/80 border-t border-[#E7E0CE]">
          <div className="max-w-7xl mx-auto space-y-12">
            <RevealOnScroll className="max-w-2xl mx-auto text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A7438]">
                Nuestro Propósito
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B3B2B]">
                Misión, Visión y Valores
              </h2>
              <p className="text-base text-[#4D5750]">
                Los principios que guían cada retrato personalizado que creamos
                para tu hogar.
              </p>
            </RevealOnScroll>

            {/* Tarjetas de Misión y Visión */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <RevealOnScroll delayMs={80}>
                <div className="h-full rounded-3xl bg-[#FAF6F0] p-8 sm:p-10 border border-[#E5DEC9] shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B3B2B] text-[#FAF6F0] flex items-center justify-center mb-6 shadow-md shadow-[#1B3B2B]/15">
                    <Compass className="w-6 h-6 text-[#E3C184]" />
                  </div>
                  <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#9A7438] mb-2">
                    Lo que hacemos hoy
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B3B2B] mb-4">
                    Nuestra Misión
                  </h3>
                  <p className="text-[#3F4942] text-base sm:text-lg leading-relaxed">
                    Inmortalizar el amor y la personalidad única de cada mascota
                    a través de retratos artísticos personalizados de alta
                    calidad, brindando una experiencia cercana, creativa y
                    memorable que convierta cada recuerdo en una pieza especial
                    para el hogar.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll delayMs={180}>
                <div className="h-full rounded-3xl bg-[#FAF6F0] p-8 sm:p-10 border border-[#E5DEC9] shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-[#1B3B2B] text-[#FAF6F0] flex items-center justify-center mb-6 shadow-md shadow-[#1B3B2B]/15">
                    <Eye className="w-6 h-6 text-[#E3C184]" />
                  </div>
                  <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#9A7438] mb-2">
                    Hacia dónde vamos
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B3B2B] mb-4">
                    Nuestra Visión
                  </h3>
                  <p className="text-[#3F4942] text-base sm:text-lg leading-relaxed">
                    Ser la marca referente en arte personalizado de mascotas en
                    el Perú y Latinoamérica, reconocida por fusionar el cariño
                    por los animales, el diseño contemporáneo y nuestras raíces
                    culturales en cada obra creada.
                  </p>
                </div>
              </RevealOnScroll>
            </div>

            {/* Bloque de Valores */}
            <RevealOnScroll delayMs={220}>
              <div className="rounded-3xl bg-[#FAF6F0] p-8 sm:p-10 border border-[#E5DEC9] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E5DEC9]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#1B3B2B] text-[#FAF6F0] flex items-center justify-center shrink-0">
                      <Gem className="w-6 h-6 text-[#E3C184]" />
                    </div>
                    <div>
                      <span className="block text-xs font-semibold uppercase tracking-widest text-[#9A7438]">
                        Lo que nos define
                      </span>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1B3B2B]">
                        Nuestros Valores
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {CORE_VALUES.map((val) => (
                    <div
                      key={val.title}
                      className="rounded-2xl bg-white/90 p-5 border border-[#E7E0CE] hover:border-[#C6A26C] transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[#1B3B2B] font-bold text-base mb-2">
                        <CheckCircle2 className="w-4 h-4 text-[#9A7438] shrink-0" />
                        <span>{val.title}</span>
                      </div>
                      <p className="text-sm text-[#4B554E] leading-relaxed">
                        {val.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            NUEVA SECCIÓN (PUNTO 13): CALIDAD ARTESANAL Y ¿QUÉ ES CANVAS?
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#FAF6F0] border-t border-[#E7E0CE]">
          <div className="max-w-7xl mx-auto space-y-16 lg:space-y-20">
            {/* BLOQUE 1: Calidad que se ve. Cuidado que perdura. */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <RevealOnScroll className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1B3B2B]/10 border border-[#1B3B2B]/15 text-[#1B3B2B] text-xs font-semibold tracking-[0.18em] uppercase">
                  <Hammer className="w-3.5 h-3.5 text-[#9A7438]" />
                  <span>Oficio &amp; Materiales</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-[#1B3B2B] leading-tight">
                  Calidad que se ve. Cuidado que perdura.
                </h2>

                <p className="text-base sm:text-lg text-[#3F4942] leading-relaxed">
                  En <strong className="font-semibold text-[#1B3B2B]">APOLENA</strong>{" "}
                  combinamos la impresión sobre canvas con tintas ecosolventes y
                  el cuidado del montaje artesanal. Trabajamos con un
                  especialista con{" "}
                  <strong className="font-semibold text-[#1B3B2B]">
                    20 años de experiencia
                  </strong>{" "}
                  y con manos artesanas que ensamblan el bastidor de madera,
                  tensan la tela y cuidan cada acabado. Así creamos retratos
                  pensados para acompañarte durante muchos años.
                </p>

                {/* Tarjeta sutil de recomendación de conservación */}
                <div className="rounded-2xl bg-white/90 border border-[#E5DEC9] p-5 flex items-start gap-3.5 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E5DEC9] text-[#9A7438] flex items-center justify-center shrink-0 mt-0.5">
                    <SunMedium className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#1B3B2B]">
                      Tip de conservación
                    </p>
                    <p className="text-sm text-[#4B554E] leading-relaxed">
                      Para conservarlos, colócalos en interiores, lejos del sol
                      directo, la humedad y las fuentes de calor; retira el polvo
                      suavemente con un paño seco y suave, sin frotar ni aplicar
                      productos de limpieza.
                    </p>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Galería doble del taller artesanal */}
              <RevealOnScroll delayMs={150} className="lg:col-span-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="relative rounded-3xl overflow-hidden border border-[#E5DEC9] bg-white shadow-lg shadow-[#1B3B2B]/10 aspect-[4/3] sm:aspect-[4/5] group">
                    <Image
                      src="/images/quienes-somos/taller-bastidor.jpg"
                      alt="Ensamblaje artesanal de bastidor de madera con escuadra en taller Apolena"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1B3B2B]/75 via-[#1B3B2B]/20 to-transparent p-4">
                      <span className="text-xs font-semibold text-[#FAF6F0] tracking-wide">
                        Ensamblaje de precisión
                      </span>
                    </div>
                  </div>

                  <div className="relative rounded-3xl overflow-hidden border border-[#E5DEC9] bg-white shadow-lg shadow-[#1B3B2B]/10 aspect-[4/3] sm:aspect-[4/5] sm:translate-y-6 group">
                    <Image
                      src="/images/quienes-somos/taller-lijado.jpg"
                      alt="Lijado y acabado manual de bastidores de madera en Apolena"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1B3B2B]/75 via-[#1B3B2B]/20 to-transparent p-4">
                      <span className="text-xs font-semibold text-[#FAF6F0] tracking-wide">
                        Acabado pulido a mano
                      </span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* BLOQUE 2: ¿Qué es canvas? */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center pt-4 lg:pt-8">
              {/* Galería doble de textura canvas y montaje 3D (izquierda en desktop) */}
              <RevealOnScroll
                delayMs={120}
                className="lg:col-span-6 order-2 lg:order-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div className="relative rounded-3xl overflow-hidden border border-[#E5DEC9] bg-white shadow-lg shadow-[#1B3B2B]/10 aspect-[4/3] sm:aspect-[4/5] group">
                    <Image
                      src="/images/quienes-somos/textura-canvas.jpg"
                      alt="Detalle de la textura de tela lienzo canvas de alta calidad"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1B3B2B]/75 via-[#1B3B2B]/20 to-transparent p-4">
                      <span className="text-xs font-semibold text-[#FAF6F0] tracking-wide">
                        Trama de lienzo natural
                      </span>
                    </div>
                  </div>

                  <div className="relative rounded-3xl overflow-hidden border border-[#E5DEC9] bg-white shadow-lg shadow-[#1B3B2B]/10 aspect-[4/3] sm:aspect-[4/5] sm:translate-y-6 group">
                    <Image
                      src="/images/quienes-somos/borde-canvas.jpg"
                      alt="Cuadro canvas montado a mano sobre bastidor de madera con profundidad"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1B3B2B]/75 via-[#1B3B2B]/20 to-transparent p-4">
                      <span className="text-xs font-semibold text-[#FAF6F0] tracking-wide">
                        Montaje con profundidad 3D
                      </span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>

              {/* Texto explicativo ¿Qué es canvas? */}
              <RevealOnScroll className="lg:col-span-6 order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C6A26C]/20 border border-[#C6A26C]/40 text-[#1B3B2B] text-xs font-semibold tracking-[0.18em] uppercase">
                  <Layers className="w-3.5 h-3.5 text-[#9A7438]" />
                  <span>Nuestro Soporte</span>
                </div>

                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B3B2B] leading-tight">
                  ¿Qué es canvas?
                </h3>

                <p className="text-base sm:text-lg text-[#3F4942] leading-relaxed">
                  <strong className="font-semibold text-[#1B3B2B]">
                    Canvas significa lienzo:
                  </strong>{" "}
                  una tela con textura sobre la que imprimimos el retrato de tu
                  mascota. Luego la tensamos y montamos a mano sobre un bastidor
                  de madera para darle forma y profundidad.
                </p>

                <p className="font-serif text-xl sm:text-2xl text-[#1B3B2B] border-l-2 border-[#C6A26C] pl-4 italic leading-snug">
                  “¿El resultado? Un cuadro con presencia de museo… y un
                  protagonista que probablemente duerme en tu sofá.”
                </p>
              </RevealOnScroll>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN DE PILARES: Tarjetas animadas con toda la historia
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-white/50 border-y border-[#E7E0CE]">
          <div className="max-w-7xl mx-auto">
            <RevealOnScroll className="max-w-2xl mx-auto text-center mb-14 space-y-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9A7438]">
                Nuestra Esencia
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1B3B2B]">
                Cada trazo cuenta su historia
              </h2>
              <p className="text-base text-[#4D5750]">
                Unimos arte, identidad peruana y el amor incondicional por
                quienes llenan de alegría nuestros días.
              </p>
            </RevealOnScroll>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {PILLARS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <RevealOnScroll key={item.number} delayMs={idx * 120}>
                    <article className="group relative h-full bg-[#FAF6F0] rounded-3xl p-7 sm:p-9 border border-[#E5DEC9] shadow-sm hover:shadow-xl hover:shadow-[#1B3B2B]/10 transition-all duration-300 hover:-translate-y-1.5">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#1B3B2B] text-[#FAF6F0] flex items-center justify-center shadow-md shadow-[#1B3B2B]/15 group-hover:scale-105 transition-transform duration-300">
                          <Icon className="w-6 h-6 text-[#E3C184]" />
                        </div>
                        <span className="font-serif text-3xl font-bold text-[#1B3B2B]/15 group-hover:text-[#9A7438]/40 transition-colors">
                          {item.number}
                        </span>
                      </div>

                      <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#9A7438] mb-2">
                        {item.tag}
                      </span>

                      <h3 className="font-serif text-2xl font-bold text-[#1B3B2B] mb-3">
                        {item.title}
                      </h3>

                      <p className="text-[#3F4942] text-base leading-relaxed">
                        {item.description}
                      </p>
                    </article>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            BANNER DE CIERRE Y LLAMADO A LA ACCIÓN
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1B3B2B] text-[#FAF6F0] px-6 py-12 sm:px-12 sm:py-16 lg:px-16 text-center shadow-2xl shadow-[#1B3B2B]/25">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#C6A26C]/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#C6A26C]/15 blur-3xl"
              />

              <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#E3C184] text-xs font-semibold uppercase tracking-[0.18em]">
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  Apolena Studio · Perú
                </span>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-bold leading-tight text-white">
                  Tú nos compartes su foto. Nosotros te ayudamos a convertirla en
                  un recuerdo único.
                </h2>

                <p className="text-base sm:text-lg text-[#DCE3DD] max-w-xl mx-auto">
                  Elige su personaje favorito, personaliza el tamaño y recibe un
                  cuadro listo para colgar en tu hogar.
                </p>

                <div className="pt-3">
                  <Link
                    href="/products/cuadros-personalizados"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#E3C184] hover:bg-[#d6b170] text-[#1B3B2B] font-bold text-base sm:text-lg shadow-xl transition-all duration-300 hover:scale-[1.03]"
                  >
                    <span>Crear el retrato de mi mascota</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </section>
      </main>

      <Footer />
    </div>
  );
}