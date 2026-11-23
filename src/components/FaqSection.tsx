"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Maximize2,
  X,
  Truck,
  Sparkles,
  Layers,
  ZoomIn,
} from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answerIntro?: string;
  hasImages?: boolean;
  isSizesList?: boolean;
  isDeliveryInfo?: boolean;
  isShippingTimes?: boolean;
  textAnswer?: string;
}

const FAQS: FaqItem[] = [
  {
    id: 1,
    question: "¿Cómo puedo pedir el retrato de mi mascota?",
    textAnswer:
      "Elige tu diseño favorito, selecciona el formato y sube una foto de tu mascota. Con ella nuestra plataforma creará el retrato personalizado.",
  },
  {
    id: 2,
    question: "¿Qué tipo de foto necesito enviar?",
    answerIntro:
      "Una foto nítida, con buena iluminación y donde se vea claramente su carita. Evitar fotos borrosas, oscuras, cortadas o con filtros.",
    hasImages: true,
  },
  {
    id: 3,
    question: "¿Solo hacen retratos de gatos y perros?",
    textAnswer:
      "¡También podemos trabajar con otras mascotas! ¡Cuy, tortugas, caballo, loros, conejo, ovejas y mucho más!",
  },
  {
    id: 4,
    question: "¿El retrato está pintado a mano?",
    textAnswer:
      "No. Somos una empresa de impresión digital. Creamos nuestras plantillas con una herramienta digital e impreso en lienzo por artesanos. No es una pintura hecha a mano.",
  },
  {
    id: 5,
    question: "¿Qué tamaños de retratos ofrecen?",
    answerIntro:
      "Tenemos cinco tamaños para que elijas el que mejor se adapte a tu espacio:",
    isSizesList: true,
  },
  {
    id: 6,
    question: "¿Puedo ver el diseño antes de que lo impriman?",
    textAnswer:
      "Al momento de generar las muestras, automáticamente podrás visualizar dos ejemplos finales. Si no estás satisfecho puedes volver a generar la imagenes o puedes comunicarte con nuestro equipo de diseño para ayudarte con tu imagen digital!",
  },
  {
    id: 7,
    question: "¿El precio incluye delivery?",
    isDeliveryInfo: true,
  },
  {
    id: 8,
    question: "¿Cuánto tarda en llegar mi pedido?",
    isShippingTimes: true,
  },
];

const SIZES_DATA = [
  {
    dimension: "20 cm × 30 cm",
    title: "Un detalle especial",
    badge: "Compacto",
    description:
      "Ideal para escritorios, repisas o un regalo personalizado.",
  },
  {
    dimension: "30 cm × 40 cm",
    title: "Un toque de personalidad",
    badge: "Nuestro favorito",
    isFavorite: true,
    description:
      "Perfecto para dormitorios, rincones acogedores o combinar con otros cuadros.",
  },
  {
    dimension: "40 cm × 60 cm",
    title: "El equilibrio ideal",
    badge: "Más elegido",
    description:
      "Destaca en tu pared y permite apreciar los detalles del retrato.",
  },
  {
    dimension: "50 cm × 70 cm",
    title: "Todas las miradas",
    badge: "Protagonista",
    description:
      "Ideal para darle protagonismo a tu mascota en la sala o entrada.",
  },
  {
    dimension: "60 cm × 90 cm",
    title: "A lo grande",
    badge: "Impacto visual",
    description:
      "Nuestro formato más grande, perfecto para paredes amplias y un gran impacto visual.",
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState<number | null>(2); // Abrir la pregunta 2 con imágenes por defecto
  const [activeModalImage, setActiveModalImage] = useState<{
    src: string;
    alt: string;
    title: string;
  } | null>(null);

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="w-full py-20 bg-[#FFFBF2] text-[#141414] scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header de la sección */}
        <div className="text-center mb-12 space-y-2">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] font-bold text-xs uppercase tracking-widest border border-[#174B3D]/20">
            Resolvemos tus Dudas
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#174B3D]">
            Preguntas Frecuentes
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#141414]/75 max-w-xl mx-auto">
            Todo lo que necesitas saber para pedir el cuadro personalizado de tu mascota con total tranquilidad y garantía artesanal.
          </p>
        </div>

        {/* Lista de Preguntas */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className="border border-[#c6a26c]/40 rounded-2xl bg-white overflow-hidden transition-all duration-200 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 hover:bg-[#FFFBF2] transition-colors cursor-pointer"
                >
                  <span className="font-bold text-base sm:text-lg text-[#174B3D] flex items-center gap-3">
                    <span className="text-[#c6a26c] font-serif font-bold text-sm sm:text-base">
                      {faq.id}.
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#c6a26c] transition-transform duration-300 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-[#141414]/85 border-t border-[#E8DEC8] space-y-4">
                    {/* 1. Respuesta de Texto Estándar */}
                    {faq.textAnswer && (
                      <p className="leading-relaxed text-stone-700">
                        {faq.textAnswer}
                      </p>
                    )}

                    {/* 2. Pregunta de Fotografía con Imágenes Adjuntas */}
                    {faq.hasImages && (
                      <div className="space-y-4">
                        <p className="leading-relaxed text-stone-700 font-medium">
                          {faq.answerIntro}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                          {/* Card 1: Guía rápida para fotografiar a tu mascota */}
                          <div className="bg-[#FAF0E4]/60 border border-[#DECFBE] rounded-2xl p-3 sm:p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-[#c6a26c] transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#174B3D] bg-white px-2.5 py-0.5 rounded-full border border-[#DECFBE]">
                                  <Sparkles className="w-3 h-3 text-[#c6a26c]" />
                                  <span>Guía de Fotografía</span>
                                </span>
                              </div>
                              <h4 className="font-serif text-sm font-bold text-[#174B3D]">
                                Una buena foto, un retrato increíble
                              </h4>
                              <p className="text-xs text-stone-600">
                                Luz natural, a su altura, rostro completo y foto nítida.
                              </p>
                            </div>

                            <div
                              onClick={() =>
                                setActiveModalImage({
                                  src: "/faq/guia-foto-mascota.jpg",
                                  alt: "Guía rápida para fotografiar a tu mascota",
                                  title:
                                    "Guía Oficial: Una buena foto, un retrato increíble",
                                })
                              }
                              className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-white border border-[#DECFBE] cursor-pointer group"
                            >
                              <Image
                                src="/faq/guia-foto-mascota.jpg"
                                alt="Guía rápida para fotografiar a tu mascota"
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-contain transition-transform duration-300 group-hover:scale-102"
                              />
                              <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#174B3D] text-xs font-bold shadow-md">
                                  <ZoomIn className="w-3.5 h-3.5 text-[#c6a26c]" />
                                  <span>Ampliar guía</span>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveModalImage({
                                  src: "/faq/guia-foto-mascota.jpg",
                                  alt: "Guía rápida para fotografiar a tu mascota",
                                  title:
                                    "Guía Oficial: Una buena foto, un retrato increíble",
                                })
                              }
                              className="w-full py-2 px-3 rounded-xl bg-white border border-[#DECFBE] hover:bg-[#FAF0E4] text-[#174B3D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-[#c6a26c]" />
                              <span>Ver guía completa en alta resolución</span>
                            </button>
                          </div>

                          {/* Card 2: De una foto a un retrato único */}
                          <div className="bg-[#FAF0E4]/60 border border-[#DECFBE] rounded-2xl p-3 sm:p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-[#c6a26c] transition-all">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#174B3D] bg-white px-2.5 py-0.5 rounded-full border border-[#DECFBE]">
                                  <Layers className="w-3 h-3 text-[#c6a26c]" />
                                  <span>Proceso y Acabado</span>
                                </span>
                              </div>
                              <h4 className="font-serif text-sm font-bold text-[#174B3D]">
                                De una foto a un retrato único
                              </h4>
                              <p className="text-xs text-stone-600">
                                Foto de ejemplo &rarr; Retrato APOLENA &rarr; Cuadro terminado en lienzo.
                              </p>
                            </div>

                            <div
                              onClick={() =>
                                setActiveModalImage({
                                  src: "/faq/de-foto-a-retrato.jpg",
                                  alt: "De una foto a un retrato único en cuadro terminado",
                                  title:
                                    "Transformación: De una foto a un retrato único",
                                })
                              }
                              className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-white border border-[#DECFBE] cursor-pointer group"
                            >
                              <Image
                                src="/faq/de-foto-a-retrato.jpg"
                                alt="De una foto a un retrato único en cuadro terminado"
                                fill
                                sizes="(max-width: 768px) 100vw, 400px"
                                className="object-contain transition-transform duration-300 group-hover:scale-102"
                              />
                              <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#174B3D] text-xs font-bold shadow-md">
                                  <ZoomIn className="w-3.5 h-3.5 text-[#c6a26c]" />
                                  <span>Ampliar ejemplo</span>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveModalImage({
                                  src: "/faq/de-foto-a-retrato.jpg",
                                  alt: "De una foto a un retrato único en cuadro terminado",
                                  title:
                                    "Transformación: De una foto a un retrato único",
                                })
                              }
                              className="w-full py-2 px-3 rounded-xl bg-white border border-[#DECFBE] hover:bg-[#FAF0E4] text-[#174B3D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-[#c6a26c]" />
                              <span>Ver ejemplos en alta resolución</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Pregunta de Tamaños de Cuadros */}
                    {faq.isSizesList && (
                      <div className="space-y-3">
                        <p className="leading-relaxed text-stone-700 font-medium">
                          {faq.answerIntro}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                          {SIZES_DATA.map((size) => (
                            <div
                              key={size.dimension}
                              className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 ${
                                size.isFavorite
                                  ? "bg-[#FAF0E4] border-[#174B3D] ring-1 ring-[#174B3D]/20 shadow-xs"
                                  : "bg-white border-[#E8DEC8] hover:border-[#c6a26c]"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="font-extrabold text-[#174B3D] text-sm">
                                    {size.dimension}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      size.isFavorite
                                        ? "bg-[#174B3D] text-white"
                                        : "bg-[#FFFBF2] text-[#94713F] border border-[#DECFBE]"
                                    }`}
                                  >
                                    {size.badge}
                                  </span>
                                </div>
                                <h4 className="font-serif font-bold text-xs text-stone-800">
                                  {size.title}
                                </h4>
                              </div>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                {size.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Pregunta de Delivery */}
                    {faq.isDeliveryInfo && (
                      <div className="space-y-4 leading-relaxed text-stone-700">
                        <div className="p-4 rounded-xl bg-sage-50/60 border border-sage-200 text-stone-800 space-y-1">
                          <p className="font-bold text-[#174B3D] text-base flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[#174B3D]" />
                            <span>¡Sí! El delivery está incluido para entregas en Lima Metropolitana.</span>
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#FAF0E4]/60 border border-[#DECFBE] space-y-2">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#174B3D]">
                            Entregas a provincias
                          </h4>
                          <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                            Hay un recargo adicional de <strong>20 soles</strong> para envíos a provincia. Recibirás tu pedido en un plazo estimado de <strong>5 a 7 días hábiles</strong>, según el destino y la cobertura de la empresa de transporte. Antes de confirmar tu pedido, te indicaremos si la entrega será a domicilio o mediante recojo en agencia.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 5. Pregunta de Tiempos de Entrega y Transporte */}
                    {faq.isShippingTimes && (
                      <div className="space-y-4 leading-relaxed text-stone-700">
                        <div className="space-y-2">
                          <p>
                            El plazo es de <strong>3 a 5 días hábiles</strong>, contados desde la confirmación del pedido en <strong>Lima Metropolitana</strong>.
                          </p>
                          <p>
                            <strong>Provincias:</strong> de <strong>5 a 7 días hábiles</strong>. Nos apoyamos con la empresa de transportes <strong>OLVA COURIER o SHALOM</strong>, y el recojo será en agencia.
                          </p>
                          <p className="text-xs sm:text-sm text-stone-600">
                            Una vez despachado tu pedido, te enviaremos la confirmación por <strong>WhatsApp o correo electrónico</strong>, junto con los datos de seguimiento disponibles (Tracking ID y número de guía).
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#FAF0E4]/60 border border-[#DECFBE] space-y-1.5 text-xs sm:text-sm">
                          <h4 className="font-serif font-bold text-[#174B3D]">
                            Días hábiles y posibles demoras
                          </h4>
                          <p className="text-stone-700 leading-relaxed">
                            Los plazos se cuentan de lunes a viernes, sin incluir feriados. El tiempo que tardes en aprobar el diseño o solicitar cambios se suma al plazo total. Si surge alguna demora en la producción o el transporte, te informaremos y coordinaremos una nueva fecha estimada.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal para Ampliar las Imágenes de la Guía */}
      {activeModalImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActiveModalImage(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[92vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#FAF0E4] border-b border-[#DECFBE] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94713F] block">
                  Apolena Atelier
                </span>
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#174B3D]">
                  {activeModalImage.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalImage(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="relative flex-1 min-h-[380px] sm:min-h-[520px] max-h-[78vh] bg-[#FFFBF2] p-2 flex items-center justify-center overflow-auto">
              <Image
                src={activeModalImage.src}
                alt={activeModalImage.alt}
                width={800}
                height={1000}
                className="w-auto h-auto max-h-full max-w-full object-contain rounded-xl"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
