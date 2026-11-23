"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  FileText,
  Clock,
  Share2,
  HelpCircle,
  Scale,
  Palette,
  ArrowRight,
} from "lucide-react";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-12 w-full space-y-10">
        {/* Encabezado */}
        <div className="text-center space-y-3 pb-6 border-b border-[#E8DEC8]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#c6a26c]" />
            <span>Protección de Datos y Privacidad</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#174B3D]">
            Política de Privacidad de APOLENA
          </h1>
          <p className="text-xs sm:text-sm text-[#141414]/75 max-w-2xl mx-auto leading-relaxed">
            Cuando subes una foto a APOLENA, la usamos para crear el retrato de tu mascota. Aquí te contamos qué información necesitamos, con quién la compartimos y cómo puedes consultarnos sobre tus datos.
          </p>
          <span className="text-xs text-stone-600 block font-medium">
            Última actualización · 18/11/2026 · Lima, Perú
          </span>
        </div>

        {/* Bloque Principal de Contenido */}
        <div className="space-y-8 text-xs sm:text-sm text-[#141414]/85 leading-relaxed bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-10 shadow-soft">
          {/* Sección 1: ¿Qué información usamos? */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>¿Qué información usamos?</span>
            </h2>
            <p>
              Para crear tu retrato, usamos la foto de tu mascota y las opciones que elijas, como el estilo, el tamaño y el acabado. Si haces un pedido, usamos tu nombre, correo, teléfono y dirección para confirmarlo, coordinar la entrega y ayudarte si surge algún problema. Según el medio de pago, también podemos usar la referencia de la operación para verificarlo.
            </p>
            <p>
              Te indicaremos qué datos son necesarios en cada paso. Por ejemplo, necesitamos una foto para generar el retrato y una dirección para entregarte el cuadro.
            </p>
          </section>

          {/* Sección 2: ¿Quién recibe la foto y los datos del pedido? */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>¿Quién recibe la foto y los datos del pedido?</span>
            </h2>
            <p>
              Usamos herramientas de diseño gráfico automatizado para transformar la foto en un retrato. Cuando el cuadro pasa a producción, enviamos a impresión el archivo final y las indicaciones para imprimirlo. El servicio de reparto recibe los datos de contacto y la dirección que necesita para hacer la entrega.
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-stone-800 text-xs">
              Si queremos mostrar el retrato de tu mascota en nuestra web, redes sociales o publicidad, primero te pediremos permiso. Si ofrecemos novedades o promociones, tú decides si quieres recibirlas.
            </div>
          </section>

          {/* Sección 3: ¿Cuánto tiempo guardamos la foto? */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>¿Cuánto tiempo guardamos la foto?</span>
            </h2>
            <p>
              Guardamos la foto original y el retrato generado durante <strong>24 horas</strong>. Luego esto se cancela. Conservamos los datos del pedido durante <strong>12 meses</strong> para atender consultas, resolver incidencias y cumplir las obligaciones aplicables.
            </p>
          </section>

          {/* Sección 4: ¿Cómo puedes consultar o pedir cambios en tus datos? */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>¿Cómo puedes consultar o pedir cambios en tus datos?</span>
            </h2>
            <p>
              Escríbenos a{" "}
              <a
                href="mailto:apolenaperu@gmail.com"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                apolenaperu@gmail.com
              </a>{" "}
              o al WhatsApp:{" "}
              <a
                href="https://wa.me/51993920853"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                993 920 853
              </a>{" "}
              si quieres saber qué datos tenemos sobre ti, corregirlos, pedir su eliminación, oponerte a su uso o retirar un permiso que nos hayas dado. Si consideras que tu solicitud no fue atendida, puedes acudir a la Autoridad Nacional de Protección de Datos Personales del Perú.
            </p>
          </section>
        </div>

        {/* Acceso a otros documentos informativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Link
            href="/terminos"
            className="p-5 rounded-2xl bg-white border border-[#c6a26c]/30 hover:border-[#174B3D] flex items-center justify-between group transition-all shadow-xs"
          >
            <div>
              <span className="text-xs font-bold text-[#174B3D] flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#c6a26c]" />
                Términos y Condiciones
              </span>
              <p className="text-[11px] text-stone-500 mt-1">
                Conoce el funcionamiento del pedido, envíos, cambios y garantías.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#c6a26c] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </Link>

          <Link
            href="/products/cuadros-personalizados"
            className="p-5 rounded-2xl bg-white border border-[#c6a26c]/30 hover:border-[#174B3D] flex items-center justify-between group transition-all shadow-xs"
          >
            <div>
              <span className="text-xs font-bold text-[#174B3D] flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#c6a26c]" />
                Catálogo de Retratos
              </span>
              <p className="text-[11px] text-stone-500 mt-1">
                Explora los estilos, tamaños y acabados para tu mascota.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#c6a26c] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
