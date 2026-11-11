"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2, KeyRound } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("El enlace no contiene un token válido de recuperación.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo restablecer la contraseña.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al restablecer la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white border border-[#c6a26c]/40 rounded-3xl p-8 shadow-soft space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#174B3D]">
          Enlace no válido
        </h1>
        <p className="text-xs text-stone-600 leading-relaxed">
          No se encontró un token de recuperación en este enlace. Por favor solicita uno nuevo desde la página de recuperación.
        </p>
        <Link
          href="/auth/forgot-password"
          className="w-full py-3.5 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-soft transition-all"
        >
          <span>Solicitar nuevo enlace</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#c6a26c]/40 rounded-3xl p-8 shadow-soft space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#174B3D]/10 border border-[#174B3D]/20 text-[#174B3D] flex items-center justify-center mx-auto">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#174B3D]">
          Nueva Contraseña
        </h1>
        <p className="text-xs text-[#141414]/70 max-w-sm mx-auto leading-relaxed">
          Ingresa y confirma tu nueva contraseña para acceder a tu cuenta de Apolena.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-sage-50 border border-sage-200 text-sage-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sage-950">
              <CheckCircle2 className="w-4 h-4 text-sage-600" />
              <span>Contraseña actualizada con éxito</span>
            </div>
            <p className="text-sage-800 leading-relaxed">
              Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión y revisar tus cuadros y pedidos.
            </p>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="w-full py-3.5 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-soft transition-all"
            >
              <span>Iniciar Sesión Ahora</span>
              <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#174B3D] block">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] text-xs text-[#141414] focus:border-[#174B3D] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#174B3D] block">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu nueva contraseña"
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
                <span>Actualizando contraseña...</span>
              </>
            ) : (
              <>
                <span>Guardar Nueva Contraseña</span>
                <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="bg-white border border-[#c6a26c]/40 rounded-3xl p-8 shadow-soft flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#174B3D]" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
