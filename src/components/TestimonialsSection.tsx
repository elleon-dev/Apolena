"use client";

import React from 'react';

interface Testimonial {
  id: number;
  clientName: string;
  petName: string;
  rating: number;
  comment: string;
  videoId: string; 
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    clientName: "Andrea M.",
    petName: "Max (Golden Retriever)",
    rating: 5,
    comment: "¡Quedé impresionada con los detalles del cuadro! Capturaron la mirada de Max tal cual es.",
    videoId: "7683304112737226004?_r=1&_t=ZS-9B7zYVjlPk8"
    },
  {
    id: 2,
    clientName: "Carlos G.",
    petName: "Luna (Gato Persa)",
    rating: 5,
    comment: "El paquete llegó súper rápido a Lima y la calidad del marco superó totalmente mis expectativas.",
    videoId: "7512067676089421078?_r=1&_t=ZS-9B7zQ55Q2o3" 
  },
  {
    id: 3,
    clientName: "Valeria R.",
    petName: "Toby (French Poodle)",
    rating: 5,
    comment: "Un regalo hermoso para la casa. La atención por WhatsApp para elegir el diseño fue un 10/10.",
    videoId: "7669976015036239124?_r=1&_t=ZS-9B7zYSX4Cgy" 
  },
  {
    id: 4,
    clientName: "Mateo S.",
    petName: "Simba (Beagle)",
    rating: 5,
    comment: "Increíble trabajo con la pintura digital. Mis amigos siempre me preguntan dónde lo mandé a hacer.",
    videoId: "7566088412436892946?_r=1&_t=ZS-9B80SrMNMNL"  
  },
  {
    id: 5,
    clientName: "Lucía P.",
    petName: "Mimi (Siamés)",
    rating: 5,
    comment: "Superó lo que esperaba. Recomendadísimos si quieren inmortalizar a sus mascotas.",
    videoId: "7430472140584930593?_r=1&_t=ZS-9B80T9ex5D6" 
  }
];

export default function TestimonialsSection() {
  return (
    <section className="w-full py-16 bg-[#FAF6F0] text-[#1C1B1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1C1B1A]">
            Lo que dicen nuestros clientes
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600">
            Mira las reacciones reales de quienes ya recibieron el retrato personalizado de su mascota.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 justify-items-center">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-[#D4A343]/20 p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-full aspect-[9/16] rounded-xl overflow-hidden bg-black mb-4 relative shadow-inner">
                <iframe
                  src={`https://www.tiktok.com/player/v1/${item.videoId}?autoplay=0&music_info=0&description=0&rel=0`}
                  className="w-full h-full border-0"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`Testimonio de ${item.clientName}`}
                ></iframe>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-[#1C1B1A] text-base sm:text-lg">
                    {item.clientName}
                  </h3>
                  <span className="text-xs font-semibold bg-[#D4A343]/10 text-[#D4A343] px-2.5 py-1 rounded-full">
                    {item.petName}
                  </span>
                </div>

                <div className="flex text-amber-400 text-sm mb-2">
                  {"★".repeat(item.rating)}
                </div>

                <p className="text-sm text-gray-600 leading-relaxed italic">
                  "{item.comment}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}