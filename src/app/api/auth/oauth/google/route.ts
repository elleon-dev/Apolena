import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { upsertOAuthProfile } from "@/lib/db-service";
import {
  isAdminRole,
  resolveUserRole,
  SessionUser,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accessToken = String(body.accessToken || "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token de sesión de Google no proporcionado." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase Auth no está configurado en el servidor." },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user || !data.user.email) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            "No se pudo verificar la identidad con Google / Supabase.",
        },
        { status: 401 },
      );
    }

    const googleUser = data.user;
    const metadata = googleUser.user_metadata || {};
    const fullName =
      metadata.full_name ||
      metadata.name ||
      googleUser.email?.split("@")[0] ||
      "Usuario Apolena";
    const avatarUrl = metadata.avatar_url || metadata.picture || null;

    const userEmail = googleUser.email || "";
    const profile = await upsertOAuthProfile({
      email: userEmail,
      name: fullName,
      avatarUrl,
    });

    if (!profile.is_active) {
      return NextResponse.json(
        { error: "Tu cuenta se encuentra desactivada." },
        { status: 403 },
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

    const token = await signSessionToken(sessionUser);
    const response = NextResponse.json({
      user: {
        ...sessionUser,
        avatar_url: profile.avatar_url,
      },
      redirectTo: isAdminRole(sessionUser.role) ? "/dashboard" : "/orders",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Error interno al autenticar con el proveedor Google.",
      },
      { status: 500 },
    );
  }
}
