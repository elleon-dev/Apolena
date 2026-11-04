import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getAllOrdersForAdmin,
  getEmailQueue,
  getProducts,
  getPlatformSettings,
} from "@/lib/db-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Acceso denegado. Exclusivo para administradores." },
      { status: 403 },
    );
  }

  const [orders, emailQueue, products, settings] = await Promise.all([
    getAllOrdersForAdmin(),
    getEmailQueue(30),
    getProducts(false),
    getPlatformSettings(),
  ]);

  return NextResponse.json({
    orders,
    emailQueue,
    products,
    settings,
  });
}
