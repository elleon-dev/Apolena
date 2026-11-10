"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";

export interface SessionUserInfo {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "super_admin";
  phone?: string | null;
  avatar_url?: string | null;
  address?: string | null;
  district?: string | null;
  department?: string | null;
}

const STORAGE_KEY = "apolena_session_user_v1";
const REVALIDATE_INTERVAL_MS = 30 * 1000; // 30s background revalidation throttle

let memoryUser: SessionUserInfo | null | undefined = undefined;
let isClientHydrated = false;
let lastFetchedAt = 0;
let inFlightPromise: Promise<SessionUserInfo | null> | null = null;
const listeners = new Set<(user: SessionUserInfo | null) => void>();

function readFromStorage(): SessionUserInfo | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.id && parsed.email) {
      return parsed as SessionUserInfo;
    }
  } catch {
    // ignore storage errors
  }
  return undefined;
}

function writeToStorage(user: SessionUserInfo | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Seguro para usar en `useState(() => getHydrationSafeSessionUser())`:
 * - Durante SSR y el primer pase de hidratación (`!isClientHydrated`), devuelve `null`
 *   para que el HTML del servidor y del cliente coincidan al 100% (0 errores de hidratación).
 * - Una vez hidratada la app (`isClientHydrated === true`), al navegar entre páginas
 *   devuelve instantáneamente `memoryUser` (0ms, sin parpadeo del avatar).
 */
export function getHydrationSafeSessionUser(): SessionUserInfo | null {
  if (!isClientHydrated) {
    return null;
  }
  return memoryUser ?? null;
}

export function isSessionHydratedOnClient(): boolean {
  return isClientHydrated && memoryUser !== undefined;
}

/**
 * Marca la app como hidratada en el cliente y recupera de inmediato la sesión
 * desde memoria o localStorage (para llamarse dentro de `useEffect`).
 */
export function getCachedSessionUser(): SessionUserInfo | null {
  isClientHydrated = true;
  if (memoryUser !== undefined) {
    return memoryUser;
  }
  const stored = readFromStorage();
  if (stored !== undefined) {
    memoryUser = stored;
    return stored;
  }
  return null;
}

/**
 * Actualiza inmediatamente la caché en memoria + localStorage y notifica a todos los componentes suscritos (ej. Header).
 */
export function setCachedSessionUser(user: SessionUserInfo | null): void {
  isClientHydrated = true;
  memoryUser = user;
  lastFetchedAt = Date.now();
  writeToStorage(user);
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch {
      // ignore listener error
    }
  });
}

export function subscribeSessionUser(
  listener: (user: SessionUserInfo | null) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Revalida la sesión contra /api/auth/me deduplicando peticiones concurrentes.
 * Si ya se revalidó hace menos de 30s y no se fuerza (`force: true`), devuelve la caché al instante.
 */
export async function refreshSessionUser(options?: {
  force?: boolean;
}): Promise<SessionUserInfo | null> {
  isClientHydrated = true;
  const force = options?.force ?? false;
  const now = Date.now();

  if (
    !force &&
    memoryUser !== undefined &&
     lastFetchedAt > 0 &&
    now - lastFetchedAt < REVALIDATE_INTERVAL_MS
  ) {
    return memoryUser;
  }

  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      let user: SessionUserInfo | null = data?.user || null;

      if (user && !user.avatar_url && supabaseBrowser) {
        try {
          const { data: sb } = await supabaseBrowser.auth.getSession();
          const meta = sb.session?.user?.user_metadata;
          const googlePic = meta?.avatar_url || meta?.picture || null;
          if (googlePic) {
            user = { ...user, avatar_url: googlePic };
          }
        } catch {
          // ignore
        }
      }

      setCachedSessionUser(user);
      return user;
    } catch {
      return getCachedSessionUser();
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}
