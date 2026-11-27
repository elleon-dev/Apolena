import React from "react";
import type { Metadata } from "next";
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
  Lock,
  UserCheck,
  Cookie,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Política de Privacidad y Protección de Datos Personales de Apolena (www.apolena.shop): recopilación, uso, inicio de sesión con Google, seguridad, retención y derechos de los usuarios.",
};

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
            Política de Privacidad de Apolena
          </h1>
          <p className="text-xs sm:text-sm text-[#141414]/75 max-w-2xl mx-auto leading-relaxed">
            En Apolena (<strong>https://www.apolena.shop</strong>) respetamos tu privacidad y protegemos tus datos personales conforme a la Ley N.º 29733 (Ley de Protección de Datos Personales del Perú) y las políticas de uso de datos de plataformas de autenticación como Google.
          </p>
          <span className="text-xs text-stone-600 block font-medium">
            Última actualización · 26/11/2026 · Lima, Perú
          </span>
        </div>

        {/* Bloque Principal de Contenido */}
        <div className="space-y-8 text-xs sm:text-sm text-[#141414]/85 leading-relaxed bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-10 shadow-soft">
          {/* Sección 1: Datos que recopilamos */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>1. Información que recopilamos</span>
            </h2>
            <p>
              Recopilamos únicamente los datos necesarios para brindarte el servicio de diseño, personalización, producción y entrega de cuadros personalizados de mascotas:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
              <li>
                <strong>Datos de cuenta y autenticación:</strong> nombre completo, dirección de correo electrónico y fotografía de perfil cuando te registras o inicias sesión con correo o mediante Google.
              </li>
              <li>
                <strong>Fotografías y preferencias de personalización:</strong> la foto de tu mascota que subes voluntariamente, especie, estilo/personaje elegido, medida del cuadro, marco y nombre opcional en el lienzo.
              </li>
              <li>
                <strong>Datos de pedido y envío:</strong> nombre del destinatario, teléfono/WhatsApp, dirección exacta, distrito/provincia/departamento, referencia o ubicación GPS aproximada, documento para comprobante (DNI/CE/RUC) y captura del voucher de pago para su verificación.
              </li>
              <li>
                <strong>Datos técnicos y analítica:</strong> información básica de navegación (páginas visitadas, dispositivo, país de conexión) para garantizar la seguridad, disponibilidad regional y mejora continua de la tienda.
              </li>
            </ul>
          </section>

          {/* Sección 2: Inicio de sesión con Google (Google OAuth) */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>2. Uso de datos obtenidos mediante Google (Google Sign-In)</span>
            </h2>
            <p>
              Si eliges acceder a Apolena utilizando tu cuenta de Google, solicitamos únicamente los permisos básicos de identidad (<code>openid</code>, <code>email</code> y <code>profile</code>), que nos proporcionan tu <strong>nombre</strong>, <strong>correo electrónico</strong> y <strong>foto de perfil</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
              <li>
                Usamos esta información exclusivamente para crear y autenticar tu cuenta en Apolena, guardar tus retratos generados, vincular tus pedidos y enviarte notificaciones transaccionales sobre el estado de tu compra.
              </li>
              <li>
                <strong>No vendemos, alquilamos ni compartimos</strong> tus datos de Google con terceros para fines publicitarios, de perfilado comercial o ajenos a la operación de Apolena.
              </li>
              <li>
                El uso de la información recibida de las APIs de Google por parte de Apolena cumple con la{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2"
                >
                  Política de Datos de Usuario de los Servicios de API de Google
                </a>
                , incluidos los requisitos de Uso Limitado.
              </li>
            </ul>
          </section>

          {/* Sección 3: Cómo usamos y compartimos tu información */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>3. Finalidad del tratamiento y proveedores autorizados</span>
            </h2>
            <p>
              Compartimos datos únicamente con proveedores tecnológicos y logísticos estrictamente indispensables para completar tu servicio:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
              <li>
                <strong>Procesamiento artístico de imágenes:</strong> las fotos de mascotas se procesan mediante motores de generación visual para crear las propuestas de retrato solicitadas por el usuario.
              </li>
              <li>
                <strong>Infraestructura y almacenamiento seguro:</strong> alojamiento web, base de datos y almacenamiento en la nube con cifrado en tránsito (HTTPS/TLS).
              </li>
              <li>
                <strong>Notificaciones y entrega física:</strong> envío de correos transaccionales sobre tu pedido y coordinación de despacho con nuestro servicio de reparto o agencia de envíos (reciben únicamente nombre, teléfono y dirección de entrega).
              </li>
            </ul>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-stone-800 text-xs">
              Nunca publicamos la fotografía de tu mascota ni tu retrato en redes sociales o publicidad sin tu autorización previa.
            </div>
          </section>

          {/* Sección 4: Seguridad y cookies */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>4. Seguridad, almacenamiento y cookies</span>
            </h2>
            <p>
              Implementamos medidas técnicas y organizativas para resguardar tu información: comunicaciones cifradas mediante HTTPS, cookies de sesión seguras (<code>httpOnly</code> y <code>SameSite</code>), control de acceso por roles para administración y acceso restringido a archivos maestros en alta resolución (solo disponibles para el titular autenticado de la orden).
            </p>
            <p className="flex items-start gap-2 text-stone-700">
              <Cookie className="w-4 h-4 text-[#c6a26c] shrink-0 mt-0.5" />
              <span>
                Utilizamos cookies esenciales para mantener tu sesión activa y herramientas de analítica web (Google Analytics 4) para medir el funcionamiento general del sitio y mejorar la experiencia de compra.
              </span>
            </p>
          </section>

          {/* Sección 5: Retención y eliminación automática */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>5. Conservación y eliminación de datos</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
              <li>
                <strong>Retratos no comprados:</strong> las fotografías subidas y los retratos generados que no estén asociados a una orden se eliminan automáticamente de nuestros servidores y almacenamiento pasado un plazo de <strong>30 días</strong>.
              </li>
              <li>
                <strong>Órdenes y comprobantes:</strong> conservamos los datos del pedido durante <strong>12 meses</strong> (o el plazo requerido por normativa tributaria y de defensa del consumidor) para garantizar el seguimiento, la descarga de tu recuerdo digital HD y la atención postventa.
              </li>
              <li>
                <strong>Eliminación a solicitud del usuario:</strong> puedes solicitar en cualquier momento la eliminación de tu cuenta y de tus datos personales escribiéndonos a nuestro correo oficial.
              </li>
            </ul>
          </section>

          {/* Sección 6: Derechos del usuario y contacto */}
          <section className="space-y-3">
            <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#c6a26c] shrink-0" />
              <span>6. Tus derechos y canales de contacto</span>
            </h2>
            <p>
              Puedes ejercer tus derechos de acceso, rectificación, cancelación, oposición (derechos ARCO) o solicitar la revocación de permisos y eliminación de tu cuenta escribiéndonos a{" "}
              <a
                href="mailto:apolenaperu@gmail.com"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                apolenaperu@gmail.com
              </a>{" "}
              o vía WhatsApp al{" "}
              <a
                href="https://wa.me/51993920853"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#174B3D] font-semibold underline decoration-[#c6a26c] underline-offset-2 hover:text-[#c6a26c] transition-colors"
              >
                +51 993 920 853
              </a>
              . Atenderemos tu solicitud en un plazo máximo de 5 días hábiles. Si consideras que tu solicitud no fue atendida conforme a ley, puedes acudir a la Autoridad Nacional de Protección de Datos Personales del Perú.
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
            href="/products/cuadros-personalizados?step=1"
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
