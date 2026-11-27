import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  isAdminRole,
  UserRole,
} from "@/lib/auth";
import {
  extractRequestCountry,
  isCountryAllowed,
  isTrustedCrawler,
  normalizeCountryCode,
} from "@/lib/geo-access";

async function resolveLiveSessionFromMe(request: NextRequest): Promise<{
  role: UserRole | null;
  isActive: boolean;
  setCookie: string | null;
} | null> {
  try {
    const meUrl = new URL("/api/auth/me", request.url);
    const meRes = await fetch(meUrl, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });
    if (!meRes.ok) return null;
    const meData = await meRes.json();
    const setCookie = meRes.headers.get("set-cookie");
    if (!meData?.user) {
      return { role: null, isActive: false, setCookie };
    }
    return {
      role: meData.user.role as UserRole,
      isActive: true,
      setCookie,
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await verifySessionToken(token);

  // 0. Restricción geográfica por país (por defecto solo Perú "PE", extensible vía NEXT_PUBLIC_ACTIVE_COUNTRIES)
  const isGeoBypassPath =
    pathname.startsWith("/no-disponible") ||
    pathname.startsWith("/privacidad") ||
    pathname.startsWith("/terminos") ||
    pathname.startsWith("/libro-de-reclamaciones") ||
    pathname.startsWith("/quienes-somos") ||
    pathname.startsWith("/api/geo-waitlist") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/callback");

  if (!isGeoBypassPath) {
    const isAdminSession = Boolean(user && isAdminRole(user.role));
    const userAgent = request.headers.get("user-agent");
    if (!isAdminSession && !isTrustedCrawler(userAgent)) {
      const devOverride =
        process.env.NODE_ENV !== "production"
          ? normalizeCountryCode(request.nextUrl.searchParams.get("__geo_country"))
          : null;
      const country = devOverride || extractRequestCountry(request.headers);

      if (country && !isCountryAllowed(country)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            {
              error: "Apolena aún no opera en tu país.",
              country,
              code: "COUNTRY_NOT_SUPPORTED",
            },
            { status: 451 },
          );
        }
        const unavailableUrl = new URL("/no-disponible", request.url);
        unavailableUrl.searchParams.set("country", country);
        return NextResponse.redirect(unavailableUrl, 307);
      }
    }
  }

  // 1. Protección de rutas exclusivas del Dashboard Administrativo (/dashboard/*, /admin/* y /api/admin/*)
  // Regla Inalterable RBAC: Solo roles "super_admin" y "admin" acceden al dashboard de gestión.
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin")
  ) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No autenticado." }, { status: 401 });
      }
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    let effectiveRole: UserRole = user.role;
    let refreshedSetCookie: string | null = null;

    // En navegación a /dashboard o /admin, o si el token en cookie aún dice "user" en /api/admin/*,
    // consultamos /api/auth/me para obtener el rol real en tiempo real desde PostgreSQL y refrescar la cookie.
    const isPageNavigation =
      pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

    if (isPageNavigation || !isAdminRole(effectiveRole)) {
      const live = await resolveLiveSessionFromMe(request);
      if (live) {
        refreshedSetCookie = live.setCookie;
        if (!live.isActive || !live.role) {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { error: "Sesión inactiva o expirada." },
              { status: 401 },
            );
          }
          const loginUrl = new URL("/auth/login", request.url);
          loginUrl.searchParams.set("callbackUrl", pathname);
          const redirectRes = NextResponse.redirect(loginUrl);
          if (refreshedSetCookie) {
            redirectRes.headers.set("set-cookie", refreshedSetCookie);
          }
          return redirectRes;
        }
        effectiveRole = live.role;
      }
    }

    if (!isAdminRole(effectiveRole)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Acceso denegado. Ruta exclusiva para administradores." },
          { status: 403 },
        );
      }
      // Si es usuario estándar ("user"), redirigir a la vista común de órdenes (/orders)
      const redirectRes = NextResponse.redirect(new URL("/orders", request.url));
      if (refreshedSetCookie) {
        redirectRes.headers.set("set-cookie", refreshedSetCookie);
      }
      return redirectRes;
    }

    const response = NextResponse.next();
    if (refreshedSetCookie) {
      response.headers.set("set-cookie", refreshedSetCookie);
    }
    return response;
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
      let effectiveRole: UserRole = user.role;
      let refreshedSetCookie: string | null = null;
      const live = await resolveLiveSessionFromMe(request);
      if (live?.isActive && live.role) {
        effectiveRole = live.role;
        refreshedSetCookie = live.setCookie;
      }
      const target = isAdminRole(effectiveRole) ? "/dashboard" : "/orders";
      const redirectRes = NextResponse.redirect(new URL(target, request.url));
      if (refreshedSetCookie) {
        redirectRes.headers.set("set-cookie", refreshedSetCookie);
      }
      return redirectRes;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)",
  ],
};
