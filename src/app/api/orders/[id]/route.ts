import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth";
import {
  findOrderById,
  getAuthoritativeSessionUser,
} from "@/lib/db-service";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getAuthoritativeSessionUser(request);
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

  const isAdmin = isAdminRole(user.role);

  // Aislamiento de datos RBAC: Un rol "user" solo puede consultar sus propias órdenes
  if (!isAdmin && order.buyer_id !== user.id) {
    return NextResponse.json(
      { error: "No tienes permiso para ver esta orden." },
      { status: 403 },
    );
  }

  // Capa 3 Anti-Fuga: Ocultar master_art_url al comprador mientras la orden no esté entregada + paid_full
  const isCompletedAndPaid =
    (order.status === "delivered" || order.status === "completed") &&
    order.payment_status === "paid_full";

  const safeOrder =
    isAdmin || isCompletedAndPaid
      ? order
      : {
          ...order,
          packages: (order.packages || []).map((pkg) => ({
            ...pkg,
            items: (pkg.items || []).map((it) => ({
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

  return NextResponse.json({ order: safeOrder });
}
