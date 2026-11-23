"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Scale,
  Store,
  Palette,
  Camera,
  CreditCard,
  Truck,
  RotateCcw,
  MessageCircle,
  Mail,
  ArrowRight,
  ShieldCheck,
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
            <span>Condiciones del Servicio</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#174B3D]">
            Términos y Condiciones de APOLENA
          </h1>
          <span className="text-xs text-stone-600 block font-medium">
            Última actualización · 18/11/2026 · Lima, Perú
          </span>
        </div>

        {/* Contenido de Cláusulas */}
        <div className="space-y-8 text-xs sm:text-sm text-[#141414]/85 leading-relaxed bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-10 shadow-soft">
          {/* Sección 1: Quiénes somos */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>1. Quiénes somos</span>
            </h2>
            <p>
              APOLENA es una tienda en línea de retratos personalizados de mascotas en Lima, Perú. Para consultas sobre tu pedido puedes escribirnos a{" "}
              <a
                href="mailto:apolenaperu@gmail.com"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                apolenaperu@gmail.com
              </a>{" "}
              o al WhatsApp:{" "}
              <a
                href="https://wa.me/51949743059"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                949 743 059
              </a>
              .
            </p>
          </section>

          {/* Sección 2: Cómo funciona tu pedido */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>2. Cómo funciona tu pedido</span>
            </h2>
            <p>
              Elige un estilo, tamaño y acabado entre las opciones disponibles y sube la foto de tu mascota. Usamos herramientas de diseño gráfico automatizados para generar un retrato personalizado a partir de la imagen y el estilo que elegiste. Si la foto no tiene la calidad suficiente para trabajar el retrato, te pediremos otra y te informaremos si esto afecta el plazo de entrega.
            </p>
            <p>
              Las imágenes de la galería muestran ejemplos de cada estilo. La pose, el fondo y otros detalles pueden variar según la foto y el diseño elegido. Las diferencias de brillo y color entre pantallas y materiales pueden producir variaciones leves en la impresión. El cuadro entregado debe ajustarse a las características ofrecidas y a las opciones que seleccionaste.
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-stone-800 text-xs">
              <strong>Vista previa y producción:</strong> Podrás visualizar el diseño y aprobar. El diseño no entra en producción hasta que se apruebe y se realice el pago correspondiente.
            </div>
          </section>

          {/* Sección 3: Fotos que subes */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>3. Fotos que subes</span>
            </h2>
            <p>
              Al subir una foto, confirmas que tienes permiso para usarla y autorizas a APOLENA a utilizarla para generar, preparar e imprimir tu retrato y atender consultas relacionadas con ese pedido. Sube imágenes centradas en tu mascota. Si aparecen personas identificables, recorta la imagen antes de enviarla. Para publicar tu foto o retrato en nuestra web, redes sociales o publicidad, te pediremos una autorización aparte.
            </p>
          </section>

          {/* Sección 4: Precios, pago y confirmación */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>4. Precios, pago y confirmación</span>
            </h2>
            <p>
              Los precios se muestran en soles e incluyen los impuestos aplicables. Antes de pagar podrás revisar el estilo, tamaño, acabado y precio final, así como la cobertura y el plazo de entrega. El envío está incluido en el precio para zona de Lima Metropolitana. Cualquier costo adicional aplicable a tu dirección se mostrará antes de que confirmes el pago.
            </p>
            <p>
              Una vez confirmado el pedido, te enviaremos su número y los detalles de la compra por correo. Si detectas un error en la foto, la dirección o las opciones seleccionadas, escríbenos cuanto antes para revisar si todavía podemos corregirlo.
            </p>
          </section>

          {/* Sección 5: Producción y entrega */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>5. Producción y entrega</span>
            </h2>
            <p>
              El plazo informado al comprar incluye la preparación, impresión y entrega del cuadro según la zona seleccionada. El plazo se cuenta desde el pago de su totalidad.
            </p>
            <p>
              Verifica que la dirección y los datos de contacto estén completos. Si surge un retraso o una incidencia con el envío, te contactaremos para informarte y coordinar la solución. Si la entrega falla por una dirección incorrecta o porque no fue posible contactar a la persona que debía recibir el cuadro, coordinaremos contigo la reprogramación y te informaremos de cualquier costo aplicable.
            </p>
          </section>

          {/* Sección 6: Cambios, cancelaciones y problemas con tu cuadro */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>6. Cambios, cancelaciones y problemas con tu cuadro</span>
            </h2>
            <p>
              <strong>Si cambias de opinión:</strong> Escríbenos cuanto antes para solicitar un cambio o una cancelación antes de que empiece la producción. Una vez iniciada la producción, los pedidos personalizados no admiten cambios ni devoluciones por un cambio de opinión, sin perjuicio de los derechos que te reconoce la ley.
            </p>
            <p>
              <strong>Si tu cuadro llega dañado, presenta un defecto o difiere de lo ofrecido:</strong> Escríbenos a{" "}
              <a
                href="mailto:apolenaperu@gmail.com"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                apolenaperu@gmail.com
              </a>{" "}
              con tu número de pedido y una descripción del problema. Puedes adjuntar fotos del cuadro y del empaque si las tienes. Revisaremos el caso y coordinaremos, según corresponda, la corrección, reposición o devolución del importe, conforme al Código de Protección y Defensa del Consumidor.
            </p>
          </section>

          {/* Sección 7: Atención y Reclamaciones */}
          <section className="space-y-2">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>7. Atención y Reclamos</span>
            </h2>
            <p>
              Puedes comunicarte con nosotros en{" "}
              <a
                href="mailto:apolenaperu@gmail.com"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                apolenaperu@gmail.com
              </a>{" "}
              o al WhatsApp:{" "}
              <a
                href="https://wa.me/51949743059"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                949 743 059
              </a>
              . Recibirás una respuesta en un plazo máximo de 15 días hábiles.
            </p>
            <p className="text-xs text-stone-600">
              Las condiciones informadas al momento de la compra se aplican a tu pedido. Las actualizaciones que publiquemos se aplicarán a los pedidos confirmados a partir de su entrada en vigor.
            </p>
          </section>
        </div>

        {/* Acceso a otros documentos informativos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Link
            href="/privacidad"
            className="p-5 rounded-2xl bg-white border border-[#c6a26c]/30 hover:border-[#174B3D] flex items-center justify-between group transition-all shadow-xs"
          >
            <div>
              <span className="text-xs font-bold text-[#174B3D] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#c6a26c]" />
                Política de Privacidad
              </span>
              <p className="text-[11px] text-stone-500 mt-1">
                Conoce qué información usamos y cómo cuidamos tus datos y fotos.
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
