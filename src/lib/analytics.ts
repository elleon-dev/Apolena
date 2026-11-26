/**
 * Helper centralizado de Google Analytics 4 (GA4) para Apolena.
 * Incluye tracking de vistas SPA, embudo de creación de retratos,
 * eventos virales de compartido y eventos estándar de e-commerce GA4 (PEN).
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

export const isGaEnabled = Boolean(
  GA_MEASUREMENT_ID &&
    /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID) &&
    !GA_MEASUREMENT_ID.includes("XXXX"),
);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(url: string): void {
  if (!isGaEnabled || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (!isGaEnabled || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params || {});
}

export function trackPetPhotoUploaded(species: string): void {
  trackEvent("pet_photo_uploaded", {
    pet_species: species,
  });
}

export function trackPortraitGenerated(params: {
  characterId: string;
  characterName: string;
  species: string;
  jobId?: string | null;
}): void {
  trackEvent("portrait_generated", {
    character_id: params.characterId,
    character_name: params.characterName,
    pet_species: params.species,
    job_id: params.jobId || undefined,
  });
}

export function trackSocialShare(params: {
  method: "modal_open" | "native_share" | "download_card" | "whatsapp" | "copy_link";
  characterId: string;
  format?: "story" | "post";
}): void {
  trackEvent("share", {
    method: params.method,
    content_type: "pet_portrait_card",
    item_id: params.characterId,
    card_format: params.format || "story",
  });
}

export function trackBeginCheckout(params: {
  value: number;
  characterId: string;
  characterName: string;
  sizeLabel: string;
  frameName: string;
}): void {
  trackEvent("begin_checkout", {
    currency: "PEN",
    value: Number(params.value.toFixed(2)),
    items: [
      {
        item_id: params.characterId,
        item_name: `Cuadro Personalizado - ${params.characterName}`,
        item_category: "cuadros-personalizados",
        item_variant: `${params.sizeLabel} | ${params.frameName}`,
        price: Number(params.value.toFixed(2)),
        quantity: 1,
      },
    ],
  });
}

export function trackPurchase(params: {
  transactionId: string;
  value: number;
  shipping: number;
  paymentMethod: string;
  itemName: string;
  itemVariant?: string;
}): void {
  trackEvent("purchase", {
    transaction_id: params.transactionId,
    currency: "PEN",
    value: Number(params.value.toFixed(2)),
    shipping: Number(params.shipping.toFixed(2)),
    payment_type: params.paymentMethod,
    items: [
      {
        item_id: params.transactionId,
        item_name: params.itemName,
        item_category: "cuadros-personalizados",
        item_variant: params.itemVariant || undefined,
        price: Number(Math.max(0, params.value - params.shipping).toFixed(2)),
        quantity: 1,
      },
    ],
  });
}
