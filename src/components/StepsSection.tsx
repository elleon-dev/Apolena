"use client";

import React from 'react';
import { Upload, Palette, Sparkles, ArrowRight } from 'lucide-react';

interface StepItem {
  number: string;
  badgeText: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentBg: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    badgeText: "Paso Inicial",
    title: "Sube una foto de tu mascota",
    description: "Elige tu estilo artístico favorito. Sube una foto clara de tu perro o gato y realiza tu pedido en minutos.",
    icon: <Upload className="w-8 h-8 text-[#174B3D] group-hover:scale-110 transition-transform duration-300" />,
    accentBg: "bg-[#F5EDE0] border-[#E9A17B]/40",
  },
  {
    number: "02",
    badgeText: "Revisión 100% Garantizada",
    title: "Aprueba tu diseño personalizado",
    description: "Recibe la propuesta digital entre 1 y 2 días. Solicita los cambios que desees hasta que quede perfecto.",
    icon: <Palette className="w-8 h-8 text-[#E9A17B] group-hover:rotate-12 transition-transform duration-300" />,
    accentBg: "bg-[#174B3D]/10 border-[#174B3D]/30",
  },
  {
    number: "03",
    badgeText: "Entrega a Domicilio",
    title: "¡Atesóralo para siempre!",
    description: "Recibe tu lienzo de museo listo para colgar. Exhibe a tu mejor amigo con orgullo o regálalo a alguien especial.",
    icon: <Sparkles className="w-8 h-8 text-[#174B3D] group-hover:scale-110 transition-transform duration-300" />,
    accentBg: "bg-[#F5EDE0] border-[#E9A17B]/40",
  }
];

export default function StepsSection() {
  return (
    <section id="como-funciona" className="w-full py-20 bg-[#F5EDE0] text-[#174B3D] relative overflow-hidden scroll-mt-20">
      
      {/* Fondo con resplandor ambiental sutil */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#E9A17B]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#174B3D]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Encabezado Principal */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] font-bold text-xs uppercase tracking-widest border border-[#174B3D]/20">
            Proceso Simple y Transparente
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#174B3D]">
            Cómo personalizar el retrato de tu mascota
          </h2>
          <p className="text-sm sm:text-base text-[#4A6B60] max-w-xl mx-auto font-medium">
            En solo 3 sencillos pasos transformamos cualquier fotografía en un lienzo exclusivo listo para colgar.
          </p>
        </div>

        {/* Grid de 3 Pasos con Conector Flotante */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 relative">
          
          {STEPS.map((step, index) => (
            <div 
              key={index}
              className="relative flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-[#174B3D]/15 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-2 cursor-pointer"
            >
              {/* Badge del Número Flotante */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#174B3D] text-white font-extrabold text-xs shadow-md border-2 border-white flex items-center gap-1.5">
                <span className="text-[#E9A17B]">{step.number}</span>
                <span>·</span>
                <span className="font-semibold text-[11px] text-[#F5EDE0]">{step.badgeText}</span>
              </div>

              {/* Contenedor del Icono con fondo decorativo */}
              <div className={`w-24 h-24 mt-3 mb-6 rounded-2xl ${step.accentBg} border flex items-center justify-center shadow-inner relative group-hover:scale-105 transition-transform duration-300`}>
                <div className="p-3 bg-white/90 backdrop-blur-md rounded-xl shadow-sm">
                  {step.icon}
                </div>
              </div>

              {/* Título del Paso */}
              <h3 className="font-serif font-bold text-xl text-[#174B3D] mb-3 group-hover:text-[#E9A17B] transition-colors">
                {step.title}
              </h3>

              {/* Descripción del Paso */}
              <p className="text-sm text-[#4A6B60] leading-relaxed">
                {step.description}
              </p>

              {/* Flecha de conexión en Desktop (Solo en pasos 1 y 2) */}
              {index < 2 && (
                <div className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#F5EDE0] border border-[#174B3D]/20 items-center justify-center text-[#174B3D] shadow-sm">
                  <ArrowRight className="w-5 h-5 text-[#E9A17B]" />
                </div>
              )}
            </div>
          ))}

        </div>

        {/* Banner Inferior de Garantía */}
        <div className="mt-14 max-w-2xl mx-auto p-4 rounded-2xl bg-white/80 border border-[#174B3D]/15 text-center flex flex-col sm:flex-row items-center justify-center gap-3 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E9A17B] animate-pulse" />
          <p className="text-xs sm:text-sm font-semibold text-[#174B3D]">
            ¿Tienes dudas sobre la foto ideal? Te asesoramos por WhatsApp antes de realizar tu pedido.
          </p>
        </div>

      </div>
    </section>
  );
}