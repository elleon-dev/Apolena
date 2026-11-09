"use client";

import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#174B3D] text-[#F5EDE0] border-t border-[#E9A17B]/40 pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        
        {/* Fila Principal del Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Columna 1: Logo, Slogan y Nota Contraentrega (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <div>
              <span className="font-serif text-3xl font-extrabold tracking-wide text-white block">
                Apolena
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#E9A17B]">
                Retratos Personalizados de Mascotas
              </span>
            </div>
            <p className="text-xs text-[#F5EDE0]/80 leading-relaxed max-w-sm">
              Transformamos las fotos de tu perro o gato en obras de arte únicas listas para imprimir y enmarcar.
            </p>
          
            
          </div>

          {/* Columna 2: Enlaces Útiles / Info (4 cols) */}
          <div className="md:col-span-4 grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider block">
                Descubrir
              </span>
              <ul className="space-y-1.5 text-[#F5EDE0]/80">
                <li><a href="#" className="hover:text-[#E9A17B] transition-colors">Nuestra Misión</a></li>
                <li><a href="#estilos" className="hover:text-[#E9A17B] transition-colors">Catálogo de Estilos</a></li>
                <li><a href="#pasos" className="hover:text-[#E9A17B] transition-colors">Cómo Funciona</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider block">
                Soporte
              </span>
              <ul className="space-y-1.5 text-[#F5EDE0]/80">
                <li><a href="#" className="hover:text-[#E9A17B] transition-colors">Preguntas Frecuentes</a></li>
                <li><a href="#" className="hover:text-[#E9A17B] transition-colors">Políticas de Privacidad</a></li>
                <li><a href="#" className="hover:text-[#E9A17B] transition-colors">Términos del Servicio</a></li>
              </ul>
            </div>
          </div>

          {/* Columna 3: Suscripción por Correo (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block text-xs">
              Recibe novedades y ofertas
            </span>
            <p className="text-xs text-[#F5EDE0]/80">
              Ingresa tu correo para recibir descuentos exclusivos en tus retratos.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Tu correo electrónico aquí"
                className="w-full px-4 py-2.5 rounded-full bg-[#0F3229] border border-[#E9A17B]/40 text-xs text-white placeholder-[#F5EDE0]/50 focus:outline-none focus:border-[#E9A17B]"
              />
              <button
                type="submit"
                style={{ backgroundColor: '#E9A17B', color: '#FFFFFF' }}
                className="px-5 py-2.5 rounded-full text-xs font-bold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Enviar
              </button>
            </form>
          </div>

        </div>

        {/* Separador e Información Inferior */}
        <div className="border-t border-[#F5EDE0]/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F5EDE0]/70">
          <p>© {currentYear} Apolena. Todos los derechos reservados.</p>
          <p className="font-semibold text-[#E9A17B]">Pago Seguro y Contraentrega</p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;