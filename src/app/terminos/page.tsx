"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  CreditCard,
  AlertTriangle,
  Scale,
  ArrowRight,
} from "lucide-react";

export default function TerminosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-12 w-full space-y-10">
        {/* Encabezado */}
        <div className="text-center space-y-3 pb-6 border-b border-[#E8DEC8]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-xs font-semibold">
            <Scale className="w-4 h-4 text-[#c6a26c]" />
            <span>Marco Legal y Condiciones del Servicio</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#174B3D]">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-xs sm:text-sm text-[#141414]/70 max-w-2xl mx-auto leading-relaxed">
            Bienvenido a <strong>Apolena</strong> (en adelante, &ldquo;Apolena Atelier&rdquo; o &ldquo;la Plataforma&rdquo;). Al navegar, generar previsualizaciones artísticas o realizar compras en nuestro sitio web, aceptas plenamente las siguientes condiciones generales y contractuales.
          </p>
          <span className="text-[11px] text-stone-500 block">
            Última actualización: Noviembre de 2026 · Lima, República del Perú
          </span>
        </div>

        {/* Contenido de Cláusulas */}
        <div className="space-y-8 text-xs sm:text-sm text-[#141414]/85 leading-relaxed bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-10 shadow-soft">
          {/* Cláusula 1 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">1.</span> Naturaleza del Servicio y Productos Confeccionados a Pedido
            </h2>
            <p>
              Apolena ofrece el servicio de creación, fusión artística digital mediante algoritmos de inteligencia artificial, impresión en alta definición (300 DPI) sobre lienzo 100% algodón y tensado artesanal sobre bastidor de madera para retratos personalizados de mascotas.
            </p>
            <p className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-stone-800 text-xs">
              <strong>Excepción de Desistimiento (Ley N° 29571 - Código de Protección y Defensa del Consumidor del Perú):</strong> Debido a que todos los cuadros y productos son <strong>estrictamente personalizados y manufacturados a la medida exacta</strong> de las solicitudes y fotografías provistas por el comprador, <strong>no aplica el derecho de retracto o devolución unilateral</strong> una vez que la orden ha ingresado a la fase de fabricación o impresión.
            </p>
          </section>

          {/* Cláusula 2 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">2.</span> Modalidad Financiera: 50% Adelanto y 50% Contraentrega
            </h2>
            <p>
              Para garantizar la exclusividad y reserva de materiales de bellas artes, Apolena opera bajo el modelo de pagos fraccionados:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-700">
              <li>
                <strong>50% de Adelanto Inicial:</strong> Exigible al confirmar la orden en el checkout a través de Yape, Plin o Transferencia Bancaria. Este monto cubre los costos inmediatos de insumos, renderizado en alta resolución, tintas pigmentadas y armado del bastidor. Dicho adelanto tiene carácter no reembolsable una vez iniciado el proceso de confección.
              </li>
              <li>
                <strong>50% Saldo Restante Contraentrega:</strong> Pagadero únicamente en efectivo, Yape o Plin al momento de recibir el producto en la dirección de entrega designada por el comprador.
              </li>
              <li>
                En caso de que el comprador se niegue injustificadamente a recibir el pedido o abonar el saldo restante acordado, Apolena se reserva el derecho de resolver la orden sin derecho a restitución del adelanto inicial y disponer del soporte físico según convenga a sus intereses.
              </li>
            </ul>
          </section>

          {/* Cláusula 3 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">3.</span> Generación Artística con IA y Fidelidad Fisonómica
            </h2>
            <p>
              Las muestras visualizadas en la pantalla del usuario constituyen aproximaciones artísticas digitales en estilo de pintura al óleo, claroscuro o técnica mixta. El resultado físico final se imprime a 300 DPI respetando el arte seleccionado por el usuario.
            </p>
            <p>
              El usuario reconoce que pueden existir ligeras variaciones cromáticas de brillo y contraste derivadas de la calibración de color de cada dispositivo móvil o monitor en comparación con la absorción física del lienzo textil de algodón. Tales variaciones sutiles son inherentes al soporte pictórico y no califican como defecto de fábrica.
            </p>
          </section>

          {/* Cláusula 4 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">4.</span> Propiedad Intelectual y Garantía del Usuario sobre las Imágenes
            </h2>
            <p>
              Al cargar fotografías de mascotas en la plataforma:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-stone-700">
              <li>
                El usuario declara y garantiza bajo juramento que es el autor, propietario o cuenta con la autorización expresa para utilizar y subir dichas imágenes.
              </li>
              <li>
                El usuario mantendrá indemne a Apolena, sus socios y representantes frente a cualquier reclamo, demanda o penalidad interpuesta por terceros vinculada a la titularidad de los derechos de imagen o propiedad intelectual de los archivos cargados.
              </li>
              <li>
                Todos los diseños, plantillas temáticas originales, marcas, logotipo de Apolena y software de la plataforma son propiedad exclusiva de Apolena Atelier y se encuentran protegidos por la legislación de propiedad industrial y derechos de autor del Perú (Decreto Legislativo N° 822).
              </li>
            </ul>
          </section>

          {/* Cláusula 5 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">5.</span> Plazos de Fabricación y Despacho Logístico
            </h2>
            <p>
              Los plazos habituales de fabricación oscilan entre <strong>3 y 5 días hábiles</strong> tras la validación del adelanto del 50%. Los tiempos de tránsito para entrega son:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700">
              <li><strong>Lima Metropolitana:</strong> 24 a 48 horas tras culminar la etapa de fabricación.</li>
              <li><strong>Provincias del Perú:</strong> 3 a 6 días hábiles adicionales vía courier nacional asociado.</li>
            </ul>
            <p>
              Apolena no será responsable por demoras atribuibles a causas de fuerza mayor o caso fortuito (bloqueos de carreteras, desastres naturales, estados de emergencia o errores en la consignación de la dirección por parte del cliente).
            </p>
          </section>

          {/* Cláusula 6 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">6.</span> Política de Garantía y Daños en Tránsito
            </h2>
            <p>
              Cada cuadro es inspeccionado y embalado con esquineros protectores y plástico burbuja de alta densidad. Si el producto llegase a presentar roturas o rajaduras físicas en el bastidor atribuibles al transporte, el comprador deberá reportarlo a{" "}
              <strong className="text-[#174B3D]">soporte@apolena.pe</strong> o vía WhatsApp dentro de las <strong>24 horas calendario</strong> posteriores a la entrega, adjuntando fotografías nítidas del empaque exterior y del desperfecto físico.
            </p>
            <p>
              Verificada la incidencia por nuestro equipo de control de calidad, Apolena procederá con la reposición del lienzo o bastidor sin costo adicional.
            </p>
          </section>

          {/* Cláusula 7 */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <span className="text-[#c6a26c]">7.</span> Ley Aplicable y Jurisdicción
            </h2>
            <p>
              Las presentes condiciones se rigen por las leyes de la República del Perú. Para cualquier controversia no resuelta de mutuo acuerdo, las partes se someten a la competencia de los jueces y tribunales del Distrito Judicial de Lima, Perú.
            </p>
          </section>
        </div>

        {/* Acceso Rápido a otros documentos legales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link
            href="/privacidad"
            className="p-5 rounded-2xl bg-white border border-[#c6a26c]/30 hover:border-[#174B3D] flex items-center justify-between group transition-all shadow-xs"
          >
            <div>
              <span className="text-xs font-bold text-[#174B3D] block">
                Política de Privacidad
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Cómo protegemos tus datos y fotos de mascotas.
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
                Conforme a la normativa de INDECOPI (Ley N° 29571).
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
