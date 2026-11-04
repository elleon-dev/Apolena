import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createOrderReview } from "@/lib/db-service";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const body = await request.json();
    if (!body.order_id || !body.comment?.trim()) {
      return NextResponse.json(
        { error: "Ingresa tu comentario sobre el producto." },
        { status: 400 },
      );
    }

    const updatedOrder = await createOrderReview({
      order_id: body.order_id,
      buyer_id: user.id,
      rating: Number(body.rating) || 5,
      comment: body.comment,
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "No se encontró la orden para registrar la reseña." },
        { status: 404 },
      );
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al guardar la reseña." },
      { status: 500 },
    );
  }
}
