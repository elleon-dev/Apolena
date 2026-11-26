"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Globe, Mail, CheckCircle2, ArrowRight, Loader2, MapPin } from "lucide-react";
import {
  COUNTRY_NAMES_ES,
  getActiveCountries,
  getCountryNameEs,
  normalizeCountryCode,
} from "@/lib/geo-access";

function UnavailableCountryContent() {
  const searchParams = useSearchParams();
  const detectedCode = normalizeCountryCode(searchParams.get("country"));
  const [selectedCountry, setSelectedCountry] = useState<string>(
    detectedCode || "",
  );
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayCountryName = getCountryNameEs(selectedCountry || detectedCode);
  const activeCountryNames = getActiveCountries()
    .map((code) => getCountryNameEs(code))
    .join(", ");

  const countryOptions = Object.entries(COUNTRY_NAMES_ES)
    .filter(([code]) => !getActiveCountries().includes(code))
    .sort((a, b) => a[1].localeCompare(b[1], "es"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico para avisarte.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/geo-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          countryCode: selectedCountry || detectedCode || "INTL",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "No pudimos registrar tu correo.");
        return;
      }
      setSubmittedMessage(
        data?.message ||
          `Te avisaremos apenas Apolena empiece a operar en ${displayCountryName}.`,
      );
      setEmail("");
    } catch {
      setError("Error de conexión. Intenta nuevamente en unos segundos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF2] text-[#141414] flex flex-col justify-between">
      {/* Barra superior */}
      <div className="bg-[#0e362b] text-white py-2.5 px-4 text-center border-b border-[#174B3D]/40">
        <p className="text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase">
          Apolena · Cobertura actual: {activeCountryNames}
        </p>
      </div>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-xl bg-white border border-[#E8DEC8] rounded-3xl shadow-xl p-7 sm:p-10 space-y-7 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative w-44 h-12">
              <Image
                src="/logo-green.png"
                alt="Apolena"
                fill
                sizes="176px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-xs font-bold">
            <Globe className="w-3.5 h-3.5 text-[#c6a26c]" />
            <span>
              {detectedCode
                ? `Detectamos tu visita desde ${getCountryNameEs(detectedCode)}`
                : "Acceso disponible por cobertura geográfica"}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174B3D] leading-tight">
              Próximamente en{" "}
              <span className="text-[#94713F]">{displayCountryName}</span>
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md mx-auto">
              En este momento nuestros retratos personalizados en lienzo Fine Art
              están disponibles únicamente en{" "}
              <strong className="text-[#174B3D]">{activeCountryNames}</strong>.
              Estamos expandiendo nuestros envíos internacionales muy pronto.
            </p>
          </div>

          {submittedMessage ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-950">
                  Te avisaremos primero
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {submittedMessage}
                </p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-3.5 text-left bg-[#FFFBF2] border border-[#E8DEC8] rounded-2xl p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[#174B3D]">
                Avísenme cuando lleguen a {displayCountryName}
              </p>

              <div className="space-y-2.5">
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    aria-label="País de interés"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E8DEC8] text-sm text-stone-800 focus:border-[#174B3D] focus:outline-none"
                  >
                    <option value="">Selecciona tu país</option>
                    {countryOptions.map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E8DEC8] text-sm text-stone-900 focus:border-[#174B3D] focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-[#174B3D] hover:bg-[#123B30] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <span>Notificarme al abrir en mi país</span>
                    <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-stone-500">
            ¿Tienes una consulta especial? Escríbenos a{" "}
            <a
              href="mailto:apolenaperu@gmail.com"
              className="font-semibold text-[#174B3D] underline underline-offset-2"
            >
              apolenaperu@gmail.com
            </a>
          </p>
        </div>
      </main>

      {/* Footer discreto con acceso administrativo */}
      <footer className="py-5 px-4 text-center border-t border-[#E8DEC8] text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>© {new Date().getFullYear()} Apolena · Todos los derechos reservados</span>
        <span className="hidden sm:inline text-stone-300">·</span>
        <Link
          href="/auth/login"
          className="text-stone-500 hover:text-[#174B3D] underline underline-offset-2 transition-colors"
        >
          Acceso de administradores
        </Link>
      </footer>
    </div>
  );
}

export default function CountryUnavailablePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFBF2] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#174B3D]" />
        </div>
      }
    >
      <UnavailableCountryContent />
    </Suspense>
  );
}
