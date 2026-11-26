/**
 * Control centralizado de países habilitados para operar en Apolena.
 * Edge-safe (sin dependencias de Node.js) para uso directo en middleware, APIs y UI.
 *
 * Para habilitar nuevos países en el futuro:
 * 1. Agrega el código ISO-3166-1 alpha-2 en DEFAULT_ACTIVE_COUNTRIES (ej. ["PE", "CO", "CL", "MX"])
 *    o configúralo en la variable de entorno NEXT_PUBLIC_ACTIVE_COUNTRIES="PE,CO,CL".
 * 2. Opcionalmente dispara POST /api/admin/country-launch { countryCode: "CO" } para notificar
 *    por correo a todos los usuarios registrados en la lista de espera de ese país.
 */

export const DEFAULT_ACTIVE_COUNTRIES: readonly string[] = ["PE"];

export const WAITLIST_SOURCE_PREFIX = "country_waitlist:";

export const COUNTRY_NAMES_ES: Record<string, string> = {
  PE: "Perú",
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brasil",
  CA: "Canadá",
  CL: "Chile",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  DO: "República Dominicana",
  EC: "Ecuador",
  ES: "España",
  FR: "Francia",
  GB: "Reino Unido",
  GT: "Guatemala",
  HN: "Honduras",
  IT: "Italia",
  MX: "México",
  NI: "Nicaragua",
  PA: "Panamá",
  PY: "Paraguay",
  SV: "El Salvador",
  US: "Estados Unidos",
  UY: "Uruguay",
  VE: "Venezuela",
};

const TRUSTED_CRAWLER_PATTERN =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|applebot|pinterest/i;

export function normalizeCountryCode(code?: string | null): string | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(clean)) return null;
  return clean;
}

export function getActiveCountries(): string[] {
  const raw = process.env.NEXT_PUBLIC_ACTIVE_COUNTRIES?.trim();
  if (!raw) {
    return [...DEFAULT_ACTIVE_COUNTRIES];
  }
  const parsed = raw
    .split(",")
    .map((item) => normalizeCountryCode(item))
    .filter((item): item is string => Boolean(item));

  return parsed.length > 0 ? Array.from(new Set(parsed)) : [...DEFAULT_ACTIVE_COUNTRIES];
}

export function isCountryAllowed(countryCode?: string | null): boolean {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return true;
  return getActiveCountries().includes(normalized);
}

export function getCountryNameEs(countryCode?: string | null): string {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return "tu país";
  return COUNTRY_NAMES_ES[normalized] || normalized;
}

export function extractRequestCountry(headers: Headers): string | null {
  const candidates = [
    headers.get("x-vercel-ip-country"),
    headers.get("cf-ipcountry"),
    headers.get("x-country-code"),
  ];
  for (const candidate of candidates) {
    const normalized = normalizeCountryCode(candidate);
    if (normalized && normalized !== "XX" && normalized !== "T1") {
      return normalized;
    }
  }
  return null;
}

export function isTrustedCrawler(userAgent?: string | null): boolean {
  if (!userAgent) return false;
  return TRUSTED_CRAWLER_PATTERN.test(userAgent);
}

export function buildWaitlistSource(countryCode?: string | null): string {
  const normalized = normalizeCountryCode(countryCode) || "INTL";
  return `${WAITLIST_SOURCE_PREFIX}${normalized}`;
}

export function parseCountryFromWaitlistSource(source?: string | null): string | null {
  if (!source || !source.startsWith(WAITLIST_SOURCE_PREFIX)) return null;
  return normalizeCountryCode(source.slice(WAITLIST_SOURCE_PREFIX.length));
}
