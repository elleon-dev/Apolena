/**
 * Helper para resolver dinámicamente la URL base de Apolena
 * Evita enlaces a localhost en producción y se adapta automáticamente
 * al hostname actual (ej: https://apolena.vercel.app o https://apolena.shop).
 */

export function resolveAppUrl(explicitOrigin?: string | null): string {
  // 1. Si viene un origin explícito de la petición HTTP actual, usarlo de inmediato
  if (explicitOrigin && explicitOrigin.startsWith("http")) {
    return explicitOrigin.replace(/\/$/, "");
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

  // 2. Si NEXT_PUBLIC_APP_URL está configurado y es válido para el entorno actual
  if (envUrl) {
    const isLocal = envUrl.includes("localhost") || envUrl.includes("127.0.0.1");
    if (!isProd || !isLocal) {
      return envUrl.replace(/\/$/, "");
    }
  }

  // 3. Variables de entorno automáticas provistas por Vercel
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  // 4. Dominio oficial de producción de Apolena
  if (isProd) {
    return "https://apolena.shop";
  }

  return envUrl || "http://localhost:3000";
}

/**
 * Extrae la URL de origen a partir de los headers de una Request de Next.js
 */
export function getRequestOrigin(req: Request): string {
  const headers = req.headers;
  const xForwardedProto = headers.get("x-forwarded-proto") || "https";
  const xForwardedHost = headers.get("x-forwarded-host");
  const host = headers.get("host");

  const effectiveHost = xForwardedHost || host;
  if (effectiveHost) {
    return `${xForwardedProto}://${effectiveHost}`.replace(/\/$/, "");
  }

  return resolveAppUrl();
}
