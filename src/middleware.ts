import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token);

  // 1. Protección de rutas exclusivas de Administración (/admin/* y /api/admin/*)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "No autenticado." },
          { status: 401 },
        );
      }
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Regla Inalterable RBAC: Los usuarios con rol "user" NO pueden ver ni acceder a rutas de administrador
    if (user.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Acceso denegado. Ruta exclusiva para administradores." },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // 2. Protección de rutas privadas del Panel de Usuario (/dashboard/*)
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Si el usuario ya está autenticado y visita /auth/login o /auth/register
  if (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register")) {
    if (user) {
      const target = user.role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
