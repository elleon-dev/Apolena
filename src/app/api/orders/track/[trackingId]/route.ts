import { NextResponse } from "next/server";
import { findOrderByTrackingId } from "@/lib/db-service";

export async function GET(
  _request: Request,
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

  const isCompletedAndPaid =
    order.status === "completed" && order.payment_status === "paid_full";

  const safeOrder = isCompletedAndPaid
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
