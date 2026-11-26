import { NextResponse } from "next/server";
import { findOrderByTrackingId } from "@/lib/db-service";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { trackingId: string } },
) {
  const order = await findOrderByTrackingId(params.trackingId);
  if (!order) {
    return NextResponse.json(
      {
        error:
          "No encontramos ninguna orden con ese Tracking ID o código de pedido.",
      },
      { status: 404 },
    );
  }

  const sessionUser = await getSessionUser(request).catch(() => null);
  const isOwner = Boolean(
    sessionUser &&
      (sessionUser.id === order.buyer_id ||
        (order.shipping?.email &&
          sessionUser.email.toLowerCase() ===
            order.shipping.email.toLowerCase())),
  );

  const isCompletedAndPaid =
    order.status === "completed" && order.payment_status === "paid_full";

  // Solo el usuario dueño de la orden puede acceder al archivo maestro HD sin marca de agua cuando esté disponible
  const canDownloadHdMaster = isOwner && isCompletedAndPaid;

  const safeOrder = canDownloadHdMaster
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

  return NextResponse.json({
    order: safeOrder,
    isOwner,
    canDownloadHdMaster,
  });
}
