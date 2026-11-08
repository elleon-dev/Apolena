import { NextResponse } from "next/server";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { findOrderById } from "@/lib/db-service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const order = await findOrderById(params.id);
  if (!order) {
    return NextResponse.json(
      { error: "Orden no encontrada." },
      { status: 404 },
    );
  }

  // Aislamiento de datos RBAC: Un rol "user" solo puede consultar sus propias órdenes
  if (!isAdminRole(user.role) && order.buyer_id !== user.id) {
    return NextResponse.json(
      { error: "No tienes permiso para ver esta orden." },
      { status: 403 },
    );
  }

  return NextResponse.json({ order });
}
