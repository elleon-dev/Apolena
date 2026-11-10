"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 1,
    question: "¿El envío es gratuito?",
    answer:
      "El costo de envío no está incluido por defecto; se calcula al momento de la compra según tu dirección de entrega mediante una tarifa estándar.",
  },
  {
    id: 2,
    question: "¿Cómo confirmo que mi compra fue realizada con éxito?",
    answer:
      "Una vez completado el pago del 50% de adelanto, recibirás automáticamente un correo electrónico de confirmación con tu Tracking ID único y el resumen detallado de tu pedido.",
  },
  {
    id: 3,
    question: "¿Cuentan con soporte o atención al cliente?",
    answer:
      "Sí, contamos con un canal de atención directa por WhatsApp para asistirte de forma rápida ante cualquier consulta con tu pedido o la elección de la fotografía.",
  },
  {
    id: 4,
    question: "¿Cuánto tiempo tarda en llegar mi pedido?",
    answer:
      "Tu paquete llegará en un plazo de 2 a 3 días hábiles tras su fabricación artesanal. Nos mantendremos en contacto contigo vía correo electrónico o teléfono para coordinar la entrega.",
  },
  {
    id: 5,
    question: "¿Cuáles son sus políticas de devolución?",
    answer:
      "Aceptamos reposiciones o devoluciones si ocurre algún inconveniente atribuible a nuestro taller (como medida incorrecta o daños durante el transporte).",
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="w-full py-20 bg-[#FFFBF2] text-[#141414]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 space-y-2">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] font-bold text-xs uppercase tracking-widest border border-[#174B3D]/20">
            Resolvemos tus Dudas
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#174B3D]">
            Preguntas Frecuentes
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#141414]/75">
            Resolvemos tus dudas para que pidas el retrato de tu mascota con
            total tranquilidad.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className="border border-[#c6a26c]/40 rounded-2xl bg-white overflow-hidden transition-all duration-200 shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 hover:bg-[#FFFBF2] transition-colors"
                >
                  <span className="font-bold text-base sm:text-lg text-[#174B3D]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#c6a26c] transition-transform duration-300 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-2 text-sm sm:text-base text-[#141414]/80 border-t border-[#E8DEC8]">
                    <p className="leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
