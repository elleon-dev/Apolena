import crypto from "crypto";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export type CouponType = "percentage" | "fixed";

export interface DiscountCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  description?: string | null;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    type: CouponType;
    value: number;
    description?: string | null;
  };
  discountAmount: number;
  finalSubtotal: number;
}

const SETTING_KEY = "DISCOUNT_COUPONS";
let memoryCouponsFallback: DiscountCoupon[] = [];

export function normalizeCouponCode(raw: string): string {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

export function calculateCouponDiscount(
  coupon: Pick<DiscountCoupon, "type" | "value">,
  subtotal: number,
): { discountAmount: number; finalSubtotal: number } {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (safeSubtotal <= 0) {
    return { discountAmount: 0, finalSubtotal: 0 };
  }

  let rawDiscount = 0;
  if (coupon.type === "percentage") {
    const pct = Math.min(100, Math.max(1, Number(coupon.value) || 0));
    rawDiscount = (safeSubtotal * pct) / 100;
  } else {
    rawDiscount = Math.max(0, Number(coupon.value) || 0);
  }

  // Permite descuentos hasta el 100% del subtotal (cortesías / canjes con influencers = S/ 0.00)
  const maxAllowedDiscount = safeSubtotal;
  const discountAmount =
    Math.round(Math.min(rawDiscount, maxAllowedDiscount) * 100) / 100;
  const finalSubtotal =
    Math.round(Math.max(0, safeSubtotal - discountAmount) * 100) / 100;

  return { discountAmount, finalSubtotal };
}

export function evaluateCouponForSubtotal(
  coupon: DiscountCoupon | undefined,
  subtotal: number,
): CouponValidationResult {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (!coupon) {
    return {
      valid: false,
      error: "El código de cupón no existe o es incorrecto.",
      discountAmount: 0,
      finalSubtotal: safeSubtotal,
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      error: "Este cupón se encuentra pausado o inactivo.",
      discountAmount: 0,
      finalSubtotal: safeSubtotal,
    };
  }

  if (coupon.expiresAt) {
    const expTime = new Date(coupon.expiresAt).getTime();
    if (!Number.isNaN(expTime) && Date.now() > expTime) {
      return {
        valid: false,
        error: "Este cupón ya ha vencido.",
        discountAmount: 0,
        finalSubtotal: safeSubtotal,
      };
    }
  }

  if (
    typeof coupon.maxUses === "number" &&
    coupon.maxUses > 0 &&
    coupon.usedCount >= coupon.maxUses
  ) {
    return {
      valid: false,
      error: "Este cupón alcanzó el límite máximo de usos.",
      discountAmount: 0,
      finalSubtotal: safeSubtotal,
    };
  }

  if (coupon.minOrderAmount > 0 && safeSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `Este cupón requiere un pedido mínimo de S/ ${coupon.minOrderAmount.toFixed(2)}.`,
      discountAmount: 0,
      finalSubtotal: safeSubtotal,
    };
  }

  const { discountAmount, finalSubtotal } = calculateCouponDiscount(
    coupon,
    safeSubtotal,
  );

  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      description: coupon.description || null,
    },
    discountAmount,
    finalSubtotal,
  };
}

export async function getAllCoupons(): Promise<DiscountCoupon[]> {
  if (!isDatabaseConfigured()) {
    return memoryCouponsFallback;
  }

  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: SETTING_KEY },
    });
    const rawList = (row?.value as any)?.coupons;
    if (!Array.isArray(rawList)) return [];
    return rawList as DiscountCoupon[];
  } catch (err) {
    console.warn("[coupons] getAllCoupons error:", err);
    return [];
  }
}

export async function saveAllCoupons(coupons: DiscountCoupon[]): Promise<void> {
  memoryCouponsFallback = coupons;
  if (!isDatabaseConfigured()) return;

  await prisma.platformSetting.upsert({
    where: { key: SETTING_KEY },
    update: { value: { coupons } as any },
    create: {
      key: SETTING_KEY,
      value: { coupons } as any,
      description: "Cupones de descuento para campañas y colaboraciones",
    },
  });
}

export async function validateCouponCode(
  rawCode: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const cleanCode = normalizeCouponCode(rawCode);
  if (!cleanCode) {
    return {
      valid: false,
      error: "Ingresa un código de cupón.",
      discountAmount: 0,
      finalSubtotal: Math.max(0, Number(subtotal) || 0),
    };
  }

  const coupons = await getAllCoupons();
  const match = coupons.find((c) => c.code === cleanCode);
  return evaluateCouponForSubtotal(match, subtotal);
}

export async function incrementCouponUsage(rawCode: string): Promise<void> {
  const cleanCode = normalizeCouponCode(rawCode);
  if (!cleanCode) return;

  try {
    const coupons = await getAllCoupons();
    let changed = false;
    const updated = coupons.map((c) => {
      if (c.code === cleanCode) {
        changed = true;
        return {
          ...c,
          usedCount: (c.usedCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    if (changed) {
      await saveAllCoupons(updated);
    }
  } catch (err) {
    console.warn("[coupons] incrementCouponUsage error:", err);
  }
}

export function buildNewCouponRecord(input: {
  code: string;
  type: CouponType;
  value: number;
  description?: string | null;
  minOrderAmount?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
}): DiscountCoupon {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    code: normalizeCouponCode(input.code),
    type: input.type === "fixed" ? "fixed" : "percentage",
    value:
      input.type === "percentage"
        ? Math.min(100, Math.max(1, Number(input.value) || 10))
        : Math.max(1, Number(input.value) || 10),
    description: input.description?.trim().slice(0, 140) || null,
    minOrderAmount: Math.max(0, Number(input.minOrderAmount) || 0),
    maxUses:
      input.maxUses !== null &&
      input.maxUses !== undefined &&
      Number(input.maxUses) > 0
        ? Math.floor(Number(input.maxUses))
        : null,
    usedCount: 0,
    expiresAt: input.expiresAt ? input.expiresAt : null,
    isActive: input.isActive !== false,
    createdAt: now,
    updatedAt: now,
  };
}
