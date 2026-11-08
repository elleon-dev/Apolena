"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function completeGoogleLogin() {
      try {
        if (!supabaseBrowser) {
          throw new Error(
            "El cliente de Supabase no está configurado en el navegador.",
          );
        }

        const errorDescription =
          searchParams.get("error_description") || searchParams.get("error");
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        const code = searchParams.get("code");
        if (code) {
          await supabaseBrowser.auth.exchangeCodeForSession(code);
        }

        // Obtenemos la sesión activa de Supabase (funciona tanto con #access_token como con ?code)
        let {
          data: { session },
        } = await supabaseBrowser.auth.getSession();

        if (!session && typeof window !== "undefined") {
          const hashParams = new URLSearchParams(
            window.location.hash.replace(/^#/, ""),
          );
          const hashToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token") || "";
          if (hashToken) {
            const { data } = await supabaseBrowser.auth.setSession({
              access_token: hashToken,
              refresh_token: refreshToken,
            });
            session = data.session;
          }
        }

        if (!session?.access_token) {
          throw new Error(
            "No se recibió una sesión válida del proveedor Google.",
          );
        }

        const res = await fetch("/api/auth/oauth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken: session.access_token }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error || "Error al sincronizar tu cuenta de Google.",
          );
        }

        if (!active) return;

        const isAdmin =
          data.user?.role === "admin" || data.user?.role === "super_admin";
        const callbackUrl = searchParams.get("callbackUrl");
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

        router.replace(target);
        router.refresh();
      } catch (err: any) {
        if (active) {
          setError(
            err?.message || "No se pudo completar el inicio de sesión con Google.",
          );
        }
      }
    }

    completeGoogleLogin();

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-cream-200 rounded-3xl p-8 shadow-soft text-center space-y-4">
      {error ? (
        <>
          <div className="w-12 h-12 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-stone-900">
            Error de autenticación
          </h1>
          <p className="text-xs text-stone-600">{error}</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold transition-all"
          >
            Volver al inicio de sesión
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 text-terracotta-500 animate-spin mx-auto" />
          <h1 className="font-serif text-2xl font-semibold text-stone-900">
            Conectando con Google...
          </h1>
          <p className="text-xs text-stone-500">
            Verificando tu perfil y permisos en Apolena.
          </p>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4">
      <Suspense
        fallback={
          <div className="text-xs text-stone-500">Validando sesión...</div>
        }
      >
        <OAuthCallbackHandler />
      </Suspense>
    </div>
  );
}

