import { NextResponse } from "next/server";
import {
  getSessionUser,
  resolveUserRole,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import { findProfileByEmail, findProfileById } from "@/lib/db-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const profile =
    (await findProfileById(session.id)) ||
    (await findProfileByEmail(session.email));

  if (profile && profile.is_active === false) {
    const res = NextResponse.json({ user: null });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }

  const liveRole = resolveUserRole(
    profile?.email || session.email,
    profile?.role || session.role,
  );

  const userPayload = {
    id: profile?.id || session.id,
    email: profile?.email || session.email,
    name: profile?.name || session.name,
    phone: profile?.phone || session.phone || null,
    avatar_url: profile?.avatar_url || session.avatar_url || null,
    address: profile?.address || null,
    district: profile?.district || null,
    department: profile?.department || null,
    role: liveRole,
  };

  const response = NextResponse.json({ user: userPayload });

  // Si el rol, ID o nombre en la BD cambió respecto al token en cookie,
  // re-firmar y actualizar inmediatamente la cookie apolena_session
  if (
    liveRole !== session.role ||
    userPayload.id !== session.id ||
    userPayload.name !== session.name
  ) {
    const newToken = await signSessionToken({
      id: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
      phone: userPayload.phone,
      avatar_url: userPayload.avatar_url,
      role: liveRole,
    });
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
