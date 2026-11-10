"use client";

import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  PackageCheck,
} from "lucide-react";

export default function ContactSection() {
  return (
    <section
      id="contacto"
      className="w-full py-20 bg-[#FFFBF2] text-[#141414] border-b border-[#c6a26c]/25 scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#174B3D]/10 border border-[#174B3D]/20 text-[#174B3D] text-xs font-bold tracking-widest uppercase">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ATENCIÓN AL CLIENTE & CONTACTO</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#174B3D] leading-tight">
            ¿Tienes dudas sobre tu cuadro o pedido especial?
          </h2>

          <p className="text-[#141414]/75 text-sm sm:text-base leading-relaxed">
            Escríbenos directamente por nuestros canales oficiales. Nuestro
            equipo te asesorará en la selección de medidas, vestuarios y fechas
            de entrega.
          </p>
        </div>

        {/* Layout Centrado: Canal Principal WhatsApp + Grilla de Información */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Tarjeta Destacada de WhatsApp */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#c6a26c]/40 shadow-soft text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center font-bold flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-[#174B3D]" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-[#174B3D] tracking-wider uppercase bg-[#c6a26c]/25 px-2.5 py-0.5 rounded-full border border-[#c6a26c]/50">
                  Canal Más Rápido
                </span>
                <h3 className="font-bold text-[#174B3D] text-base mt-1">
                  WhatsApp Oficial Apolena
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#141414]/75 leading-relaxed max-w-lg mx-auto">
              Atención personalizada con asesores de arte. Resolvemos tus dudas
              en minutos sobre fotografías, vestuarios y envíos.
            </p>

            <a
              href="https://wa.me/51987654321?text=Hola%20Apolena%2C%20tengo%20una%20consulta%20sobre%20los%20cuadros%20personalizados"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Chatear por WhatsApp (+51 987 654 321)</span>
            </a>
          </div>

          {/* Grilla de 3 Columnas: Correo, Taller y Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#c6a26c]/35 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#174B3D] uppercase tracking-wider">
                Correo Electrónico
              </h4>
              <p className="text-sm font-semibold text-[#141414]">
                contacto@apolena.pe
              </p>
              <p className="text-[11px] text-[#141414]/65">
                Respuesta en menos de 2 horas hábiles
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#c6a26c]/35 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#174B3D] uppercase tracking-wider">
                Taller & Despacho
              </h4>
              <p className="text-sm font-semibold text-[#141414]">Lima, Perú</p>
              <p className="text-[11px] text-[#141414]/65">
                Envíos express en Lima y a provincias
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#c6a26c]/35 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-[#174B3D] uppercase tracking-wider">
                Horarios de Atención
              </h4>
              <p className="text-sm font-semibold text-[#141414]">
                Lun a Sáb: 8:30am – 8:30pm
              </p>
              <p className="text-[11px] text-[#141414]/65">
                Domingos: 10:00am – 6:00pm
              </p>
            </div>
          </div>

          {/* Acceso Rápido a Tracking */}
          <div className="p-4 rounded-2xl bg-[#174B3D] text-white border border-[#c6a26c]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <PackageCheck className="w-5 h-5 text-[#c6a26c] flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">
                  ¿Ya tienes una orden activa?
                </p>
                <p className="text-[11px] text-white/80">
                  Rastrea tu pedido en vivo con tu Tracking ID
                </p>
              </div>
            </div>
            <Link
              href="/track"
              className="px-4 py-1.5 rounded-full bg-[#c6a26c] text-[#174B3D] text-xs font-extrabold uppercase tracking-wider hover:bg-[#b58f56] transition-colors whitespace-nowrap"
            >
              Rastrear Pedido
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
