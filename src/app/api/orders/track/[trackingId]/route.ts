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

  return NextResponse.json({ order });
}
