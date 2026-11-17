import { NextResponse } from "next/server";
import {
  getSessionUser,
  isAdminRole,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import {
  getAuthoritativeSessionUser,
  getAllOrdersForAdmin,
  getAllProfiles,
  getEmailQueue,
  getProducts,
  getPlatformSettings,
  getNewsletterSubscribers,
} from "@/lib/db-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tokenSession = await getSessionUser(request);
  const user = await getAuthoritativeSessionUser(request);

  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json(
      { error: "Acceso denegado. Exclusivo para administradores." },
      { status: 403 },
    );
  }

  const [orders, profiles, emailQueue, products, settings, subscribers] =
    await Promise.all([
      getAllOrdersForAdmin(),
      getAllProfiles(),
      getEmailQueue(30),
      getProducts(false),
      getPlatformSettings(),
      getNewsletterSubscribers(),
    ]);

  const sanitizedUsers = profiles.map(({ password_hash, ...rest }) => rest);

  const response = NextResponse.json({
    currentUser: user,
    orders,
    users: sanitizedUsers,
    emailQueue,
    products,
    settings,
    subscribers,
  });

  if (tokenSession && tokenSession.role !== user.role) {
    const newToken = await signSessionToken(user);
    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
