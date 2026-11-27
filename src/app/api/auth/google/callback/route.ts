import { NextRequest, NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/app-url";
import { upsertOAuthProfile } from "@/lib/db-service";
import {
  isAdminRole,
  resolveUserRole,
  SessionUser,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
const GOOGLE_OAUTH_STATE_COOKIE = "apolena_google_oauth_state";

export const dynamic = "force-dynamic";

function redirectWithError(
  origin: string,
  message: string,
  callbackUrl?: string,
) {
  const loginUrl = new URL("/auth/login", origin);
  loginUrl.searchParams.set("error", message);
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
  return res;
}

/**
 * GET /api/auth/google/callback
 * Recibe el código de autorización de Google directamente en apolena.shop,
 * valida el estado CSRF, obtiene el perfil verificado de Google, sincroniza
 * el usuario en Prisma (`profiles`) y emite la cookie oficial `apolena_session`.
 */
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const { searchParams } = request.nextUrl;
  const oauthError = searchParams.get("error");
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  let savedState = "";
  let savedCallbackUrl = "";
  const rawStateCookie = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  if (rawStateCookie) {
    try {
      const parsed = JSON.parse(rawStateCookie);
      savedState = String(parsed?.state || "");
      savedCallbackUrl = String(parsed?.callbackUrl || "");
    } catch {
      savedState = "";
    }
  }

  if (oauthError) {
    const friendlyMsg =
      oauthError === "access_denied"
        ? "Cancelaste el inicio de sesión con Google."
        : "No se pudo completar la autenticación con Google.";
    return redirectWithError(origin, friendlyMsg, savedCallbackUrl);
  }

  if (!code || !returnedState || !savedState || returnedState !== savedState) {
    return redirectWithError(
      origin,
      "La sesión de autenticación expiró o no es válida. Intenta ingresar nuevamente con Google.",
      savedCallbackUrl,
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return redirectWithError(
      origin,
      "Google OAuth no está configurado en el servidor.",
      savedCallbackUrl,
    );
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Intercambiar authorization code por tokens en Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "");
      console.error("[google/callback] Token exchange failed:", tokenRes.status, errText);
      return redirectWithError(
        origin,
        "No se pudo validar tu acceso con Google. Intenta nuevamente.",
        savedCallbackUrl,
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData?.access_token;
    if (!accessToken) {
      return redirectWithError(
        origin,
        "Google no devolvió un token de acceso válido.",
        savedCallbackUrl,
      );
    }

    // 2. Consultar datos verificados del usuario en Google OpenID Connect
    const userInfoRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!userInfoRes.ok) {
      return redirectWithError(
        origin,
        "No se pudo obtener tu perfil desde Google.",
        savedCallbackUrl,
      );
    }

    const googleUser = await userInfoRes.json();
    const userEmail = String(googleUser?.email || "").trim().toLowerCase();
    if (!userEmail) {
      return redirectWithError(
        origin,
        "Tu cuenta de Google no devolvió un correo electrónico válido.",
        savedCallbackUrl,
      );
    }

    const fullName =
      String(googleUser?.name || "").trim() ||
      userEmail.split("@")[0] ||
      "Usuario Apolena";
    const avatarUrl =
      typeof googleUser?.picture === "string" ? googleUser.picture : null;

    // 3. Crear o actualizar Profile en PostgreSQL (Prisma)
    const profile = await upsertOAuthProfile({
      email: userEmail,
      name: fullName,
      avatarUrl,
    });

    if (!profile.is_active) {
      return redirectWithError(
        origin,
        "Tu cuenta se encuentra desactivada. Contacta al soporte de Apolena.",
      );
    }

    const resolvedRole = resolveUserRole(profile.email, profile.role);
    const sessionUser: SessionUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name || fullName,
      role: resolvedRole,
      phone: profile.phone,
      avatar_url: profile.avatar_url || avatarUrl,
    };

    const sessionToken = await signSessionToken(sessionUser);

    const defaultDest = isAdminRole(sessionUser.role) ? "/dashboard" : "/orders";
    const safeDestination =
      savedCallbackUrl &&
      savedCallbackUrl.startsWith("/") &&
      !savedCallbackUrl.startsWith("//")
        ? savedCallbackUrl
        : defaultDest;

    const response = NextResponse.redirect(new URL(safeDestination, origin));
    response.cookies.delete(GOOGLE_OAUTH_STATE_COOKIE);
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("[google/callback] Unexpected error:", err);
    return redirectWithError(
      origin,
      "Ocurrió un error inesperado al iniciar sesión con Google.",
      savedCallbackUrl,
    );
  }
}
