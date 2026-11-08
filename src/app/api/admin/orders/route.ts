import { NextResponse } from "next/server";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import {
  getAllOrdersForAdmin,
  getAllProfiles,
  getEmailQueue,
  getProducts,
  getPlatformSettings,
} from "@/lib/db-service";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json(
      { error: "Acceso denegado. Exclusivo para administradores." },
      { status: 403 },
    );
  }

  const [orders, profiles, emailQueue, products, settings] = await Promise.all([
    getAllOrdersForAdmin(),
    getAllProfiles(),
    getEmailQueue(30),
    getProducts(false),
    getPlatformSettings(),
  ]);

  const sanitizedUsers = profiles.map(({ password_hash, ...rest }) => rest);

  return NextResponse.json({
    currentUser: user,
    orders,
    users: sanitizedUsers,
    emailQueue,
    products,
    settings,
  });
}
