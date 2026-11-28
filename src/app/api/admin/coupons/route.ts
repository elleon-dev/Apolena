import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth";
import { getAuthoritativeSessionUser } from "@/lib/db-service";
import {
  buildNewCouponRecord,
  CouponType,
  getAllCoupons,
  normalizeCouponCode,
  saveAllCoupons,
} from "@/lib/coupons";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    const coupons = await getAllCoupons();
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error("[GET /api/admin/coupons] Error:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los cupones." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const cleanCode = normalizeCouponCode(body.code || "");
    if (!cleanCode || cleanCode.length < 3) {
      return NextResponse.json(
        { error: "El código debe tener al menos 3 caracteres (letras o números)." },
        { status: 400 },
      );
    }

    const type: CouponType = body.type === "fixed" ? "fixed" : "percentage";
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json(
        { error: "Ingresa un valor de descuento mayor a 0." },
        { status: 400 },
      );
    }
    if (type === "percentage" && value > 90) {
      return NextResponse.json(
        { error: "El descuento porcentual máximo permitido es 90%." },
        { status: 400 },
      );
    }

    const existing = await getAllCoupons();
    if (existing.some((c) => c.code === cleanCode)) {
      return NextResponse.json(
        { error: `Ya existe un cupón con el código "${cleanCode}".` },
        { status: 409 },
      );
    }

    const newCoupon = buildNewCouponRecord({
      code: cleanCode,
      type,
      value,
      description: body.description,
      minOrderAmount: body.minOrderAmount,
      maxUses: body.maxUses,
      expiresAt: body.expiresAt || null,
      isActive: body.isActive !== false,
    });

    const nextList = [newCoupon, ...existing];
    await saveAllCoupons(nextList);

    return NextResponse.json(
      { success: true, coupon: newCoupon, coupons: nextList },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/coupons] Error:", err);
    return NextResponse.json(
      { error: "No se pudo crear el cupón." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "ID de cupón requerido." },
        { status: 400 },
      );
    }

    const existing = await getAllCoupons();
    const target = existing.find((c) => c.id === id);
    if (!target) {
      return NextResponse.json(
        { error: "Cupón no encontrado." },
        { status: 404 },
      );
    }

    const nextCode =
      body.code !== undefined ? normalizeCouponCode(body.code) : target.code;
    if (!nextCode || nextCode.length < 3) {
      return NextResponse.json(
        { error: "El código debe tener al menos 3 caracteres." },
        { status: 400 },
      );
    }
    if (existing.some((c) => c.id !== id && c.code === nextCode)) {
      return NextResponse.json(
        { error: `Ya existe otro cupón con el código "${nextCode}".` },
        { status: 409 },
      );
    }

    const nextType: CouponType =
      body.type !== undefined
        ? body.type === "fixed"
          ? "fixed"
          : "percentage"
        : target.type;
    const nextValue =
      body.value !== undefined ? Number(body.value) : target.value;
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return NextResponse.json(
        { error: "Ingresa un valor de descuento válido." },
        { status: 400 },
      );
    }
    if (nextType === "percentage" && nextValue > 90) {
      return NextResponse.json(
        { error: "El descuento porcentual máximo es 90%." },
        { status: 400 },
      );
    }

    const updatedCoupon = {
      ...target,
      code: nextCode,
      type: nextType,
      value: nextValue,
      description:
        body.description !== undefined
          ? String(body.description || "").trim().slice(0, 140) || null
          : target.description,
      minOrderAmount:
        body.minOrderAmount !== undefined
          ? Math.max(0, Number(body.minOrderAmount) || 0)
          : target.minOrderAmount,
      maxUses:
        body.maxUses !== undefined
          ? body.maxUses !== null && Number(body.maxUses) > 0
            ? Math.floor(Number(body.maxUses))
            : null
          : target.maxUses,
      expiresAt:
        body.expiresAt !== undefined
          ? body.expiresAt || null
          : target.expiresAt,
      isActive:
        typeof body.isActive === "boolean" ? body.isActive : target.isActive,
      updatedAt: new Date().toISOString(),
    };

    const nextList = existing.map((c) => (c.id === id ? updatedCoupon : c));
    await saveAllCoupons(nextList);

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon,
      coupons: nextList,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/coupons] Error:", err);
    return NextResponse.json(
      { error: "No se pudo actualizar el cupón." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "ID de cupón requerido." },
        { status: 400 },
      );
    }

    const existing = await getAllCoupons();
    const nextList = existing.filter((c) => c.id !== id);
    await saveAllCoupons(nextList);

    return NextResponse.json({ success: true, coupons: nextList });
  } catch (err) {
    console.error("[DELETE /api/admin/coupons] Error:", err);
    return NextResponse.json(
      { error: "No se pudo eliminar el cupón." },
      { status: 500 },
    );
  }
}
