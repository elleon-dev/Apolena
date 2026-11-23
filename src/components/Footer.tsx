"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2, Instagram } from "lucide-react";

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 6.27c0 3.5 2.841 6.341 6.341 6.341 3.5 0 6.341-2.841 6.341-6.341V8.71a8.19 8.19 0 0 0 4.945 1.637V6.892a4.82 4.82 0 0 1-2.999-.206z" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, source: "footer" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar tu suscripción.");
      }

      setIsSubscribed(true);
      setResponseMsg(
        data.message || "¡Gracias! Te avisaremos de promociones exclusivas.",
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar tu solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="w-full bg-[#174B3D] text-white border-t border-[#c6a26c]/35 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        {/* Fila Principal del Footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Columna 1: Logo Blanco sobre Primary #174B3D y Slogan */}
          <div className="md:col-span-4 space-y-3">
            <Link href="/" className="inline-block">
              <div className="relative w-28 h-20">
                <Image
                  src="/logo-light.png"
                  alt="Apolena — Retratos Personalizados de Mascotas"
                  fill
                  sizes="112px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
            <span className="text-xs font-bold uppercase tracking-widest text-[#c6a26c] block">
              Retratos Personalizados de Mascotas
            </span>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Transformamos las fotografías de tu mascota en obras de arte
              elaboradas en lienzo de tela canvas a 300 DPI, tensadas sobre
              bastidor de madera y listas para colgar.
            </p>

            {/* Redes Sociales Oficiales */}
            <div className="pt-1 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c6a26c] block">
                Síguenos
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="https://www.tiktok.com/@apolenaperu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok @apolenaperu"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#11382D] hover:bg-[#11382D]/80 border border-[#c6a26c]/40 hover:border-[#c6a26c] text-white/90 hover:text-white transition-all text-xs font-semibold shadow-xs group cursor-pointer"
                >
                  <TikTokIcon className="w-3.5 h-3.5 text-[#c6a26c] group-hover:scale-110 transition-transform" />
                  <span>TikTok</span>
                </a>

                <a
                  href="https://www.instagram.com/apolenaperu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram @apolenaperu"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#11382D] hover:bg-[#11382D]/80 border border-[#c6a26c]/40 hover:border-[#c6a26c] text-white/90 hover:text-white transition-all text-xs font-semibold shadow-xs group cursor-pointer"
                >
                  <Instagram className="w-3.5 h-3.5 text-[#c6a26c] group-hover:scale-110 transition-transform" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>

          {/* Columna 2: Enlaces de Navegación, Soporte y Legal */}
          <div className="md:col-span-5 grid grid-cols-3 gap-3 text-xs">
            <div className="space-y-2.5">
              <span className="font-bold text-[#c6a26c] uppercase tracking-wider block">
                Descubrir
              </span>
              <ul className="space-y-2 text-white/85">
                <li>
                  <Link
                    href="/products/cuadros-personalizados"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Crear Retrato
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#como-funciona"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Cómo Funciona
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#quienes-somos"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Quiénes Somos
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-[#c6a26c] uppercase tracking-wider block">
                Soporte
              </span>
              <ul className="space-y-2 text-white/85">
                <li>
                  <Link
                    href="/track"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Rastrear Pedido
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#contacto"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Atención al Cliente
                  </Link>
                </li>
                <li>
                  <Link
                    href="/orders"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Mis Órdenes
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-[#c6a26c] uppercase tracking-wider block">
                Legal
              </span>
              <ul className="space-y-2 text-white/85">
                <li>
                  <Link
                    href="/terminos"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacidad"
                    className="hover:text-[#c6a26c] transition-colors"
                  >
                    Política de Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Columna 3: Suscripción por Correo */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-bold text-[#c6a26c] uppercase tracking-wider block text-xs">
              Recibe novedades
            </span>
            <p className="text-xs text-white/80">
              Ingresa tu correo para recibir descuentos exclusivos en tus
              retratos personalizados.
            </p>
            {isSubscribed ? (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#11382D] border border-[#c6a26c]/40 text-xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-[#c6a26c] shrink-0" />
                <span className="font-medium text-white/95">
                  {responseMsg ||
                    "¡Gracias! Te avisaremos de promociones exclusivas."}
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                className="space-y-2"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-3.5 py-2 rounded-full bg-[#11382D] border border-[#c6a26c]/40 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#c6a26c] disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] text-xs font-extrabold uppercase tracking-wider shadow-sm transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 min-w-[76px]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Enviar"
                    )}
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-[11px] text-amber-300 font-medium pl-1">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Separador e Información Inferior con Libro de Reclamaciones */}
        <div className="border-t border-white/15 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/75">
          <p>© {currentYear} Apolena Todos los derechos reservados.</p>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <Link href="/terminos" className="hover:text-[#c6a26c] transition-colors">
              Términos
            </Link>
            <span>·</span>
            <Link href="/privacidad" className="hover:text-[#c6a26c] transition-colors">
              Privacidad
            </Link>

            <span className="text-white/30">|</span>

            {/* Redes Sociales en Barra Inferior */}
            <div className="flex items-center gap-2">
              <a
                href="https://www.tiktok.com/@apolenaperu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok @apolenaperu"
                title="TikTok @apolenaperu"
                className="w-7 h-7 rounded-full bg-[#11382D] hover:bg-[#1a4a3c] border border-[#c6a26c]/40 hover:border-[#c6a26c] flex items-center justify-center text-[#c6a26c] hover:text-white transition-all cursor-pointer"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://www.instagram.com/apolenaperu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @apolenaperu"
                title="Instagram @apolenaperu"
                className="w-7 h-7 rounded-full bg-[#11382D] hover:bg-[#1a4a3c] border border-[#c6a26c]/40 hover:border-[#c6a26c] flex items-center justify-center text-[#c6a26c] hover:text-white transition-all cursor-pointer"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
