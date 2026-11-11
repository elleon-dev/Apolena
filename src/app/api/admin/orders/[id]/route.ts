import { NextResponse } from "next/server";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { updateOrderAdminLifecycle, PaymentMethod } from "@/lib/db-service";
import { getRequestOrigin } from "@/lib/app-url";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getSessionUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Acceso denegado. Exclusivo para administradores." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const updated = await updateOrderAdminLifecycle({
      orderId: params.id,
      adminId: user.id,
      action: body.action,
      courier: body.courier,
      carrierPhone: body.carrierPhone,
      finalPaymentMethod: body.finalPaymentMethod as PaymentMethod | undefined,
      finalOperationNumber: body.finalOperationNumber,
      notes: body.notes,
      app_url: getRequestOrigin(request),
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Orden no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al actualizar la orden." },
      { status: 500 },
    );
  }
}
