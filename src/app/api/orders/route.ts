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

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const orders = await getOrdersByBuyer(user.id, user.email);
  return NextResponse.json({ orders });
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

    // Si el usuario aún no había iniciado sesión, vinculamos o creamos su perfil en Prisma automáticamente
    if (!sessionUser) {
      const cleanEmail = shipping.email.trim().toLowerCase();
      let profile = await findProfileByEmail(cleanEmail);
      if (!profile) {
        const autoPass = body.account_password?.trim() || "cliente123";
        const passwordHash = await hashPassword(autoPass);
        profile = await createProfile({
          email: cleanEmail,
          passwordHash,
          name: shipping.name.trim(),
          phone: shipping.phone.trim(),
          role: "user",
        });
      }
      sessionUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name || shipping.name.trim(),
        phone: profile.phone,
        role: profile.role,
      };
      newSessionToken = await signSessionToken(sessionUser);
    }

    const createdOrder = await createOrderWithSplitPayment({
      buyer_id: sessionUser.id,
      product_id: body.product_id,
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
      customizations: body.customizations,
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

    const response = NextResponse.json({
      order: createdOrder,
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
