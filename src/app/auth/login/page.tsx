"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { setCachedSessionUser } from "@/lib/client-session";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Shield,
  User,
} from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Si Supabase redirige de vuelta con #access_token o ?code a /auth/login
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasHashToken = window.location.hash.includes("access_token=");
    const hasCode = searchParams.get("code");
    if (hasHashToken || hasCode) {
      const targetCallback = `/auth/callback${window.location.search}${window.location.hash}`;
      router.replace(targetCallback);
    }
  }, [router, searchParams]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      if (!supabaseBrowser) {
        setError(
          "El cliente de Supabase no está configurado. Verifica NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
        setIsGoogleLoading(false);
        return;
      }

      const redirectUrl = new URL("/auth/callback", window.location.origin);
      if (callbackUrl) {
        redirectUrl.searchParams.set("callbackUrl", callbackUrl);
      }

      const { error: oauthError } = await supabaseBrowser.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message || "Error al conectar con Google.");
        setIsGoogleLoading(false);
      }
    } catch {
      setError("No se pudo iniciar la autenticación con Google.");
      setIsGoogleLoading(false);
    }
  };

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
      if (data.user) {
        setCachedSessionUser(data.user);
      }
      const isAdmin =
        data.user?.role === "admin" || data.user?.role === "super_admin";
      const safeCallbackUrl =
        callbackUrl &&
        !isAdmin &&
        (callbackUrl.startsWith("/dashboard") ||
          callbackUrl.startsWith("/admin"))
          ? "/orders"
          : callbackUrl;
      const target =
        safeCallbackUrl ||
        data.redirectTo ||
        (isAdmin ? "/dashboard" : "/orders");
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
    <div className="max-w-md w-full mx-auto bg-white border border-[#c6a26c]/40 rounded-3xl p-8 shadow-soft space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#174B3D]/10 border border-[#174B3D]/20 text-[#174B3D] flex items-center justify-center mx-auto">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#174B3D]">
          Bienvenido a Apolena
        </h1>
        <p className="text-xs text-[#141414]/70">
          Ingresa a tu cuenta para ver tus retratos, órdenes y seguimiento en
          vivo.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botón OAuth con Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLoading}
        className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-[#FFFBF2] border border-[#E8DEC8] disabled:opacity-60 text-[#141414] text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm transition-all"
      >
        {isGoogleLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#174B3D]" />
            <span>Redirigiendo a Google...</span>
          </>
        ) : (
          <>
            <GoogleIcon />
            <span>Continuar con Google</span>
          </>
        )}
      </button>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#E8DEC8] w-full" />
        <span className="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider shrink-0">
          o ingresa con tu correo
        </span>
        <div className="border-t border-[#E8DEC8] w-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#174B3D] block">
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
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] text-xs text-[#141414] focus:border-[#174B3D] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#174B3D] block">
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
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] text-xs text-[#141414] focus:border-[#174B3D] focus:bg-white focus:outline-none"
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
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando acceso...</span>
            </>
          ) : (
            <>
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
            </>
          )}
        </button>
      </form>

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
        <Suspense
          fallback={<div className="text-xs text-stone-500">Cargando...</div>}
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
