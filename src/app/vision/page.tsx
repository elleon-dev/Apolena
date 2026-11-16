"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Header"; // <-- ajusta el nombre si es Header.tsx
import Footer from "@/components/Footer";
import {
  Heart,
  Sparkles,
  Landmark,
  PawPrint,
  ArrowRight,
  ShieldCheck,
  Award,
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

export default function VisionPage() {
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
            HERO PRINCIPAL: Misión a la izquierda + Cuadro en sala a la derecha
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
                <span>Nuestra Misión</span>
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
                  Lienzo Fine Art &amp; entrega en todo el Perú
                </span>
              </div>
            </div>

            {/* LADO DERECHO: Imagen vision.jpg animada subiendo desde abajo */}
            <div
              style={{ transitionDelay: "150ms" }}
              className={`lg:col-span-6 relative transition-all duration-1000 ease-out ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
              }`}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#1B3B2B]/20 border border-[#E5DEC9] bg-white aspect-square sm:aspect-[4/3] lg:aspect-square">
                <Image
                  src="/vision.jpg"
                  alt="Cuadro personalizado de mascota Apolena colgado en sala"
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
            SECCIÓN DE PILARES: Tarjetas animadas con toda la historia
        ══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-white/70 border-y border-[#E7E0CE]">
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