import { NextRequest, NextResponse } from "next/server";
import { validateCouponCode } from "@/lib/coupons";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = String(body.code || "");
    const subtotal = Number(body.subtotal || 0);

    const result = await validateCouponCode(code, subtotal);
    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error || "Cupón no válido.",
          discountAmount: 0,
          finalSubtotal: result.finalSubtotal,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/coupons/validate] Error:", err);
    return NextResponse.json(
      { valid: false, error: "No se pudo validar el cupón." },
      { status: 500 },
    );
  }
}
