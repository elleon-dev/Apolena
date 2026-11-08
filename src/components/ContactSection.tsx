"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  PackageCheck,
  AlertCircle,
} from "lucide-react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Consulta sobre un Cuadro Personalizado",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus("error");
      setStatusMessage("Por favor completa los campos requeridos (Nombre, Correo y Mensaje).");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitStatus("success");
        setStatusMessage(data.message || "¡Mensaje enviado con éxito!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "Consulta sobre un Cuadro Personalizado",
          message: "",
        });
      } else {
        setSubmitStatus("error");
        setStatusMessage(data.error || "No se pudo enviar el mensaje.");
      }
    } catch {
      setSubmitStatus("error");
      setStatusMessage("Error de conexión. Puedes escribirnos directamente por WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contacto"
      className="w-full py-20 bg-cream-100 text-[#1C1B1A] border-b border-[#E8E2D9] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ATENCIÓN AL CLIENTE & CONTACTO</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary leading-tight">
            ¿Tienes dudas sobre tu cuadro o pedido especial?
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Escríbenos directamente o déjanos un mensaje. Nuestro equipo te asesorará en la selección de medidas, vestuarios y fechas de entrega.
          </p>
        </div>

        {/* 2 Columns Grid: Direct Info + Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Direct Channels & Operational Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* WhatsApp Direct Card */}
            <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-soft space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Canal Más Rápido
                  </span>
                  <h3 className="font-semibold text-secondary text-base mt-1">
                    WhatsApp Oficial Apolena
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Atención personalizada con asesores de arte. Resolvemos tus dudas en minutos sobre fotografías, vestuarios y envíos.
              </p>

              <a
                href="https://wa.me/51987654321?text=Hola%20Apolena%2C%20tengo%20una%20consulta%20sobre%20los%20cuadros%20personalizados"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Chatear por WhatsApp (+51 987 654 321)</span>
              </a>
            </div>

            {/* General Info Cards List */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] flex items-start gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Correo Electrónico
                  </h4>
                  <p className="text-sm font-semibold text-stone-800">
                    contacto@apolena.pe
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Respuesta en menos de 2 horas hábiles
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] flex items-start gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Taller & Despacho
                  </h4>
                  <p className="text-sm font-semibold text-stone-800">
                    Lima, Perú
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Envíos express en Lima y despachos seguros a todas las provincias
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] flex items-start gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                    Horarios de Atención
                  </h4>
                  <p className="text-sm font-semibold text-stone-800">
                    Lunes a Sábado: 8:30 am – 8:30 pm
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Domingos: 10:00 am – 6:00 pm
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Tracking shortcut */}
            <div className="p-4 rounded-2xl bg-primary-50 border border-primary/20 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5 min-w-0">
                <PackageCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-secondary truncate">
                    ¿Ya tienes una orden activa?
                  </p>
                  <p className="text-[11px] text-stone-600 truncate">
                    Rastrea tu pedido en vivo con tu Tracking ID
                  </p>
                </div>
              </div>
              <Link
                href="/track"
                className="text-xs font-bold text-primary hover:underline whitespace-nowrap"
              >
                Rastrear →
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D9] shadow-soft text-left space-y-6">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-secondary">
                  Envíanos un mensaje
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Completa los siguientes campos y nos pondremos en contacto contigo rápidamente.
                </p>
              </div>

              {submitStatus === "success" && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">¡Mensaje enviado con éxito!</p>
                    <p className="text-emerald-700 text-xs mt-0.5">{statusMessage}</p>
                  </div>
                </div>
              )}

              {submitStatus === "error" && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p>{statusMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 block">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ej. Camila Navarro"
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-cream-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 block">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="999 888 777"
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-cream-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 block">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-cream-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-800 block">
                      Motivo de Consulta
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-cream-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                      <option value="Consulta sobre un Cuadro Personalizado">
                        Consulta sobre un Cuadro Personalizado
                      </option>
                      <option value="Estado de mi Pedido / Tracking">
                        Estado de mi Pedido / Tracking
                      </option>
                      <option value="Consulta de Envíos a Provincias">
                        Consulta de Envíos a Provincias
                      </option>
                      <option value="Retrato Dúo (2 Mascotas)">
                        Retrato Dúo (2 Mascotas)
                      </option>
                      <option value="Pedido Corporativo o por Mayor">
                        Pedido Corporativo o por Mayor
                      </option>
                      <option value="Otro motivo">Otro motivo</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-800 block">
                    Mensaje o Detalle de tu Consulta *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Cuéntanos sobre tu mascota, el estilo que te gustaría o la consulta que tengas..."
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-cream-50/50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 rounded-full bg-primary hover:bg-primary-600 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Enviando mensaje...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Consulta a Apolena</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
