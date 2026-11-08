"use client";

import React from 'react';
import { Upload, Palette, Frame } from 'lucide-react';

interface StepItem {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  animation: string;
}

const STEPS: StepItem[] = [
  {
    number: "1",
    title: "Sube una foto de tu mascota",
    description: "Elige tu estilo artístico favorito. Sube una foto de tu mascota y haz tu pedido.",
    icon: <Upload className="w-10 h-10 text-primary" />,
    bgColor: "bg-primary-50 border-primary-200",
    animation: "step-from-left"
  },
  {
    number: "2",
    title: "Aprueba tu diseño personalizado",
    description: "Recibe la prueba de tu diseño entre 1 y 2 días después de realizar tu pedido. Solicita cualquier modificación o aprueba el diseño.",
    icon: <Palette className="w-10 h-10 text-secondary" />,
    bgColor: "bg-secondary-50 border-secondary-100",
    animation: "step-from-bottom"
  },
  {
    number: "3",
    title: "¡Atesóralo para siempre!",
    description: "Exhibe a tu mejor amigo en tu pared o regálalo a un ser querido. Comparte tu cuadro en redes sociales.",
    icon: <Frame className="w-10 h-10 text-primary" />,
    bgColor: "bg-primary-50 border-primary-200",
    animation: "step-from-right"
  }
];

export default function StepsSection() {
  return (
    <section id="como-funciona" className="w-full py-16 bg-cream-100 text-secondary overflow-x-hidden scroll-mt-20">
      
      <style>{`
        @keyframes stepFromLeft {
          from { opacity: 0; transform: translateX(-80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes stepFromBottom {
          from { opacity: 0; transform: translateY(80px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepFromRight {
          from { opacity: 0; transform: translateX(80px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .step-from-left   { animation: stepFromLeft 0.8s ease-out 0.1s backwards; }
        .step-from-bottom { animation: stepFromBottom 0.8s ease-out 0.3s backwards; }
        .step-from-right  { animation: stepFromRight 0.8s ease-out 0.5s backwards; }

        @media (prefers-reduced-motion: reduce) {
          .step-from-left, .step-from-bottom, .step-from-right { animation: none; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-secondary">
            Cómo personalizar el retrato de tu mascota
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((step, index) => (
            <div 
              key={index}
              className={`${step.animation} flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-primary/20 shadow-sm transition-all duration-300 relative group cursor-pointer hover:scale-105 hover:shadow-xl hover:border-primary/60 hover:z-10`}
            >
              <div className={`w-full h-48 rounded-xl ${step.bgColor} border flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105`}>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
                  {step.icon}
                </div>
              </div>

              <h3 className="font-bold text-lg sm:text-xl text-secondary mb-3">
                {step.number}. {step.title}
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}