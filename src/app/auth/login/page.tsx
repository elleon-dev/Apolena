"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  User,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión.");
        return;
      }
      const target =
        callbackUrl ||
        data.redirectTo ||
        (data.user?.role === "admin" ? "/admin" : "/dashboard");
      router.push(target);
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-cream-200 rounded-3xl p-8 shadow-soft space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="font-serif text-3xl font-semibold text-stone-900">
          Bienvenido a Apolena
        </h1>
        <p className="text-xs text-stone-500">
          Ingresa a tu cuenta para ver tus retratos, órdenes y seguimiento en
          vivo.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-800 block">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-800 block">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-soft transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando acceso...</span>
            </>
          ) : (
            <>
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Credentials Box */}
      <div className="pt-4 border-t border-cream-200 space-y-2.5">
        <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider text-center">
          Accesos rápidos de prueba (Prisma RBAC)
        </p>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => fillDemo("cliente@apolena.pe", "cliente123")}
            className="p-2.5 rounded-2xl border border-cream-200 bg-cream-50 hover:bg-cream-100 text-stone-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Rol Usuario</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemo("admin@apolena.pe", "admin123")}
            className="p-2.5 rounded-2xl border border-cream-200 bg-cream-50 hover:bg-cream-100 text-stone-800 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-stone-900" />
            <span>Rol Admin</span>
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-stone-500">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/auth/register"
          className="text-terracotta-600 font-semibold hover:underline"
        >
          Crear cuenta gratis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-xs text-stone-500">Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
