"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
      setError("No se pudo iniciar el registro con Google.");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo completar el registro.");
        return;
      }
      router.push(data.redirectTo || "/orders");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full mx-auto bg-white border border-cream-200 rounded-3xl p-8 shadow-soft space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-3xl font-semibold text-stone-900">
              Crea tu cuenta en Apolena
            </h1>
            <p className="text-xs text-stone-500">
              Guarda tus retratos generados con IA y haz seguimiento de tus
              cuadros personalizados.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-stone-50 border border-stone-200 disabled:opacity-60 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm transition-all"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
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
            <div className="border-t border-cream-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider shrink-0">
              o regístrate con tu correo
            </span>
            <div className="border-t border-cream-200 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 block">
                Nombre completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Valeria Mendoza"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

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
                Celular / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="999 888 777"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 block">
                Contraseña (mín. 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
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
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Registrarme en Apolena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-stone-500">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/auth/login"
              className="text-terracotta-600 font-semibold hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
