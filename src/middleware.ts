import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  isAdminRole,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token);

  // 1. Protección de rutas exclusivas del Dashboard Administrativo (/dashboard/*, /admin/* y /api/admin/*)
  // Regla Inalterable RBAC: Solo roles "super_admin" y "admin" acceden al dashboard de gestión.
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
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

    if (!isAdminRole(user.role)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Acceso denegado. Ruta exclusiva para administradores." },
          { status: 403 },
        );
      }
      // Si es usuario estándar ("user"), redirigir a la vista común de órdenes (/orders)
      return NextResponse.redirect(new URL("/orders", request.url));
    }

    return NextResponse.next();
  }

  // 2. Protección de la vista común de órdenes (/orders/*) para todo tipo de usuarios autenticados
  if (pathname.startsWith("/orders")) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 3. Si el usuario ya está autenticado y visita /auth/login o /auth/register
  if (
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register")
  ) {
    if (user) {
      const target = isAdminRole(user.role) ? "/dashboard" : "/orders";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
    "/orders",
    "/orders/:path*",
    "/api/admin/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
