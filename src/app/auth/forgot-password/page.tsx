"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo procesar la solicitud.");
      }

      setSuccessMessage(
        data.message ||
          "Si tu correo está registrado en Apolena, recibirás un enlace seguro para restablecer tu contraseña.",
      );
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#174B3D] hover:text-[#c6a26c] transition-colors mb-6 mx-auto block w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al inicio</span>
        </Link>

        <div className="bg-white border border-[#c6a26c]/40 rounded-3xl p-8 shadow-soft space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#174B3D]/10 border border-[#174B3D]/20 text-[#174B3D] flex items-center justify-center mx-auto">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#174B3D]">
              Recuperar Contraseña
            </h1>
            <p className="text-xs text-[#141414]/70 max-w-sm mx-auto leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta de Apolena y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200 text-sage-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sage-950">
                  <CheckCircle2 className="w-4 h-4 text-sage-600" />
                  <span>Solicitud enviada</span>
                </div>
                <p className="text-sage-800 leading-relaxed">
                  {successMessage}
                </p>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/auth/login"
                  className="w-full py-3.5 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-soft transition-all"
                >
                  <ArrowLeft className="w-4 h-4 text-[#c6a26c]" />
                  <span>Volver a Iniciar Sesión</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#174B3D] block">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] text-xs text-[#141414] focus:border-[#174B3D] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-soft transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#c6a26c]" />
                    <span>Enviando enlace...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar enlace de recuperación</span>
                    <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-cream-200">
                <Link
                  href="/auth/login"
                  className="text-xs text-[#174B3D] hover:text-[#c6a26c] font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Recordé mi contraseña</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
