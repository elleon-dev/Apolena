import { NextResponse } from "next/server";
import {
  getSessionUser,
  hashPassword,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import {
  createOrderWithSplitPayment,
  findProfileByEmail,
  createProfile,
  getOrdersByBuyer,
  PaymentMethod,
} from "@/lib/db-service";
import { resolveCleanMasterArtwork } from "@/lib/server-watermark";
import { getRequestOrigin } from "@/lib/app-url";

/**
 * Strips `master_art_url` from an order when returning to a non-admin buyer
 * unless the order is 100% completed (`status === 'completed'` and `payment_status === 'paid_full'`).
 */
function sanitizeOrderArtworkForBuyer(order: any, isAdmin: boolean) {
  const isCompletedAndPaid =
    order.status === "completed" && order.payment_status === "paid_full";
  if (isAdmin || isCompletedAndPaid) {
    return order;
  }
  return {
    ...order,
    packages: (order.packages || []).map((pkg: any) => ({
      ...pkg,
      items: (pkg.items || []).map((it: any) => ({
        ...it,
        customizations: it.customizations
          ? {
              ...it.customizations,
              master_art_url: null,
            }
          : it.customizations,
      })),
    })),
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const orders = await getOrdersByBuyer(user.id, user.email);
  const safeOrders = orders.map((o) =>
    sanitizeOrderArtworkForBuyer(o, isAdmin),
  );
  return NextResponse.json({ orders: safeOrders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let sessionUser = await getSessionUser();
    let newSessionToken: string | null = null;

    const shipping = body.shipping;
    if (
      !shipping?.name ||
      !shipping?.phone ||
      !shipping?.email ||
      !shipping?.address ||
      !shipping?.district
    ) {
      return NextResponse.json(
        {
          error:
            "Completa todos tus datos de contacto y dirección de entrega para el delivery.",
        },
        { status: 400 },
      );
    }

    const paymentMethod = (body.payment_method || "yape") as PaymentMethod;
    if (!["yape", "plin", "bank_transfer"].includes(paymentMethod)) {
      return NextResponse.json(
        {
          error:
            "Selecciona un método de pago válido (Yape, Plin o Transferencia Bancaria).",
        },
        { status: 400 },
      );
    }

    if (!body.operation_number?.trim()) {
      return NextResponse.json(
        {
          error:
            "Ingresa el número de operación o referencia de tu pago del 50% de adelanto.",
        },
        { status: 400 },
      );
    }

    // Seguridad e integridad de cuentas: Se exige autenticación previa para generar la orden
    if (!sessionUser) {
      return NextResponse.json(
        {
          error:
            "Debes iniciar sesión o registrar tu cuenta antes de completar tu pedido. Esto garantiza el seguimiento seguro y resguardo de tus obras.",
          requires_auth: true,
        },
        { status: 401 },
      );
    }

    // Resolve the clean unwatermarked 300 DPI master file from the server vault (if available)
    // and store it privately inside `customizations.master_art_url` for admin production & post-completion unlock
    const selectedVariantId =
      body.selected_variant_id ||
      body.customizations?.selected_variant_id ||
      "variant-1";
    const resolvedMasterArtUrl = resolveCleanMasterArtwork(
      body.generation_job_id,
      selectedVariantId,
      body.generated_art_url || "/samples/cat-suit.jpg",
    );

    const enrichedCustomizations = {
      ...(body.customizations || {}),
      selected_variant_id: selectedVariantId,
      master_art_url: resolvedMasterArtUrl,
    };

    const createdOrder = await createOrderWithSplitPayment({
      buyer_id: sessionUser.id,
      product_id: body.product_id,
      app_url: getRequestOrigin(request),
      generation_job_id: body.generation_job_id || null,
      pet_photo_url: body.pet_photo_url || null,
      generated_art_url: body.generated_art_url || "/samples/cat-suit.jpg",
      quantity: Number(body.quantity) || 1,
      unit_price: Number(body.unit_price) || 180,
      shipping_cost: Number(body.shipping_cost) || 15,
      payment_method: paymentMethod,
      operation_number: body.operation_number,
      proof_image_url: body.proof_image_url || null,
      notes: body.notes || null,
      customizations: enrichedCustomizations,
      shipping: {
        name: shipping.name,
        phone: shipping.phone,
        email: shipping.email,
        address: shipping.address,
        department: shipping.department || "Lima",
        province: shipping.province || "Lima",
        district: shipping.district,
        reference: shipping.reference || "",
        document_type: shipping.document_type || "DNI",
        document_number: shipping.document_number || "",
      },
      invoice: {
        type: body.invoice?.type === "factura" ? "factura" : "boleta",
        doc_type: body.invoice?.type === "factura" ? "RUC" : "DNI",
        number: body.invoice?.number || shipping.document_number || "",
        legal_name: body.invoice?.legal_name || shipping.name,
        tax_address: body.invoice?.tax_address || shipping.address,
      },
    });

    const isAdmin =
      sessionUser.role === "admin" || sessionUser.role === "super_admin";
    const response = NextResponse.json({
      order: sanitizeOrderArtworkForBuyer(createdOrder, isAdmin),
      trackingId: createdOrder.tracking_id,
    });

    if (newSessionToken) {
      response.cookies.set(SESSION_COOKIE_NAME, newSessionToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo generar la orden de compra." },
      { status: 500 },
    );
  }
}
