"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  Lock,
  Eye,
  FileCheck,
  Server,
  ArrowRight,
  Sparkles,
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
            <span>Ley N° 29733 · Protección de Datos Personales (Perú)</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#174B3D]">
            Política de Privacidad y Tratamiento de Datos
          </h1>
          <p className="text-xs sm:text-sm text-[#141414]/70 max-w-2xl mx-auto leading-relaxed">
            En <strong>Apolena Atelier</strong> valoramos y protegemos la privacidad de nuestros clientes y el amor hacia sus mascotas. Esta política detalla cómo recopilamos, procesamos y resguardamos tus datos personales y fotografías.
          </p>
          <span className="text-[11px] text-stone-500 block">
            Vigente desde Noviembre de 2026 · Lima, República del Perú
          </span>
        </div>

        {/* Bloque Principal */}
        <div className="space-y-8 text-xs sm:text-sm text-[#141414]/85 leading-relaxed bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-10 shadow-soft">
          {/* Sección 1 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">1.</span> Responsable del Banco de Datos
            </h2>
            <p>
              El responsable del tratamiento de los bancos de datos personales recopilados a través de esta plataforma es <strong>APOLENA STUDIO S.A.C.</strong>, con domicilio legal en Lima, Perú, y correo oficial de contacto para temas de privacidad:{" "}
              <strong className="text-[#174B3D]">privacidad@apolena.pe</strong>.
            </p>
          </section>

          {/* Sección 2 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">2.</span> Información que Recopilamos
            </h2>
            <p>
              Para brindar nuestros servicios de confección y envío de cuadros personalizados, solicitamos los siguientes datos:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-700">
              <li>
                <strong>Datos de Identificación y Contacto:</strong> Nombre y apellidos, número de documento de identidad (DNI, CE o RUC), dirección de correo electrónico y teléfono celular/WhatsApp.
              </li>
              <li>
                <strong>Datos de Envío y Despacho:</strong> Dirección física exacta, departamento, provincia, distrito y referencias de entrega.
              </li>
              <li>
                <strong>Fotografías de Mascotas:</strong> Imágenes digitales que el usuario carga voluntariamente en el simulador para la generación artística del retrato.
              </li>
              <li>
                <strong>Datos de Transacción:</strong> Número de comprobante de operación bancaria o captura de transferencia del 50% de adelanto. Apolena <strong>no almacena números de tarjetas de crédito o débito</strong>, ya que las operaciones se efectúan mediante canales bancarios externos verificables (Yape, Plin o Transferencia).
              </li>
            </ul>
          </section>

          {/* Sección 3 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">3.</span> Procesamiento de Imágenes con Inteligencia Artificial
            </h2>
            <p>
              Las fotografías de las mascotas que subes a nuestra plataforma son procesadas de manera segura y temporal a través de nuestros modelos de generación visual con el único propósito de crear las propuestas artísticas del cuadro solicitado.
            </p>
            <p className="p-3.5 rounded-2xl bg-sage-50/80 border border-sage-200 text-sage-950 text-xs">
              <strong>Compromiso de No Comercialización:</strong> Apolena <strong>NUNCA comercializa, vende ni alquila</strong> las fotos de tus mascotas ni tus datos personales a empresas de publicidad ni a terceras partes. Las imágenes se emplean exclusivamente para la fabricación de tu pedido y visualización en tu galería personal.
            </p>
          </section>

          {/* Sección 4 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">4.</span> Finalidades del Tratamiento
            </h2>
            <p>
              Tus datos personales se tratan para las siguientes finalidades legítimas y necesarias:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-stone-700">
              <li>Fabricación, impresión Fine Art a 300 DPI y tensado sobre bastidor del cuadro adquirido.</li>
              <li>Coordinación de entrega a domicilio y seguimiento en tiempo real mediante el <strong>Tracking ID</strong>.</li>
              <li>Envío de notificaciones transaccionales a través de correo electrónico (confirmación de pedido, avances de taller y comprobante).</li>
              <li>Emisión del comprobante fiscal (Boleta o Factura) de conformidad con las disposiciones de la SUNAT.</li>
            </ol>
          </section>

          {/* Sección 5 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">5.</span> Seguridad de la Información y Almacenamiento
            </h2>
            <p>
              Implementamos rigurosas medidas técnicas, legales y organizativas para salvaguardar tu información:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700">
              <li>Cifrado de extremo a extremo mediante protocolos SSL/HTTPS en todas las páginas y formularios.</li>
              <li>Almacenamiento en bases de datos con protección de acceso por roles (RBAC) y contraseñas cifradas con algoritmos de hashing seguro (bcrypt).</li>
              <li>Almacenamiento de archivos en infraestructura Cloud aislada y protegida contra accesos no autorizados.</li>
            </ul>
          </section>

          {/* Sección 6 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">6.</span> Ejercicio de Derechos ARCO
            </h2>
            <p>
              De conformidad con la Ley N° 29733, puedes ejercer en cualquier momento tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> respecto de tus datos personales almacenados en nuestros sistemas.
            </p>
            <p>
              Para hacerlo, solo debes remitir una solicitud firmada con copia de tu documento de identidad a{" "}
              <strong className="text-[#174B3D]">privacidad@apolena.pe</strong> indicando en el asunto &ldquo;Ejercicio de Derechos ARCO&rdquo;. Tu solicitud será atendida dentro de los plazos estipulados por la ley peruana.
            </p>
          </section>
        </div>

        {/* Acceso Rápido a otros documentos legales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link
            href="/terminos"
            className="p-5 rounded-2xl bg-white border border-[#c6a26c]/30 hover:border-[#174B3D] flex items-center justify-between group transition-all shadow-xs"
          >
            <div>
              <span className="text-xs font-bold text-[#174B3D] block">
                Términos y Condiciones
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Reglas del servicio, pagos 50/50 y garantías.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#c6a26c] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/libro-de-reclamaciones"
            className="p-5 rounded-2xl bg-white border border-[#c6a26c]/30 hover:border-[#174B3D] flex items-center justify-between group transition-all shadow-xs"
          >
            <div>
              <span className="text-xs font-bold text-[#174B3D] block">
                Libro de Reclamaciones Virtual
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Conforme al Código de Consumo de INDECOPI.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#c6a26c] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
