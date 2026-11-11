"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Escucha global para redirecciones de OAuth (Google / Supabase).
 * Si Supabase devuelve al usuario a la raíz o a cualquier ruta con `#access_token=...`
 * o `?code=...`, lo redirige de inmediato a `/auth/callback` para sincronizar
 * la sesión y crear la cookie segura de Apolena.
 */
export function AuthHashListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/auth/callback") return;

    const hash = window.location.hash || "";
    const search = window.location.search || "";

    const hasAccessToken = hash.includes("access_token=");
    const hasCode = new URLSearchParams(search).has("code");

    if (hasAccessToken || hasCode) {
      router.replace(`/auth/callback${search}${hash}`);
    }
  }, [pathname, router]);

  return null;
}
