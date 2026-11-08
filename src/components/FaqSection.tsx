"use client";

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

// 1. Array de objetos con las preguntas y respuestas
const FAQS: FaqItem[] = [
  {
    id: 1,
    question: "¿El envío es gratuito?",
    answer: "El costo de envío no está incluido por defecto; se calcula al momento de la compra según tu dirección de entrega mediante una tarifa estándar."
  },
  {
    id: 2,
    question: "¿Cómo confirmo que mi compra fue realizada con éxito?",
    answer: "Una vez completado el pago, recibirás automáticamente un correo electrónico de confirmación con el resumen detallado de tu pedido y tu comprobante de compra."
  },
  {
    id: 3,
    question: "¿Cuentan con soporte o atención al cliente?",
    answer: "¡Sí! Contamos con un canal de atención directa por WhatsApp para asistirte de forma rápida ante cualquier inconveniente con tu pedido o el servicio."
  },
  {
    id: 4,
    question: "¿Cuánto tiempo tarda en llegar mi pedido?",
    answer: "Tu paquete llegará en un plazo de 2 a 3 días hábiles. Nos mantendremos en contacto contigo vía correo electrónico o teléfono para coordinar la entrega."
  },
  {
    id: 5,
    question: "¿Cuáles son sus políticas de devolución?",
    answer: "Aceptamos devoluciones únicamente si ocurre un inconveniente por parte de nuestro equipo (como el envío de un cuadro o medida incorrecta, o fallas en la calidad de impresión)."
  }
];

export default function FaqSection() {
  // Estado para controlar qué pregunta está abierta (guarda el id de la pregunta)
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="w-full py-16 bg-cream-100 text-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Encabezado de la sección */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-secondary">
            Preguntas Frecuentes
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600">
            Resolvemos tus dudas para que pidas el retrato de tu mascota con total tranquilidad.
          </p>
        </div>

        {/* 2. Acordeón mediante .map() */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div 
                key={faq.id}
                className="border border-primary/30 rounded-xl bg-white/80 backdrop-blur-sm overflow-hidden transition-all duration-200"
              >
                {/* Botón Pregunta */}
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 hover:bg-secondary/5 transition-colors"
                >
                  <span className="font-semibold text-base sm:text-lg text-secondary">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-primary transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Respuesta (Acordeón desplegable) */}
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm sm:text-base text-gray-700 border-t border-gray-100">
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
