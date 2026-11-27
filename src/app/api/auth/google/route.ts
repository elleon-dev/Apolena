import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export const GOOGLE_OAUTH_STATE_COOKIE = "apolena_google_oauth_state";

function sanitizeCallbackUrl(raw?: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  // Solo permitir rutas internas seguras que empiecen con "/" y no con "//"
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  return "";
}

/**
 * GET /api/auth/google
 * Inicia el flujo directo de Google OAuth 2.0 sobre el dominio oficial de Apolena
 * (https://www.apolena.shop/api/auth/google/callback), evitando mostrar dominios
 * de terceros como *.supabase.co en la pantalla de consentimiento de Google.
 */
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackUrl = sanitizeCallbackUrl(
    request.nextUrl.searchParams.get("callbackUrl"),
  );

  if (!clientId || !clientSecret) {
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set(
      "error",
      "Google OAuth directo aún no está configurado en el servidor (faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET).",
    );
    if (callbackUrl) loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  const state = crypto.randomBytes(24).toString("hex");
  const redirectUri = `${origin}/api/auth/google/callback`;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(googleAuthUrl);
  response.cookies.set(
    GOOGLE_OAUTH_STATE_COOKIE,
    JSON.stringify({ state, callbackUrl }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10, // 10 minutos
    },
  );

  return response;
}
