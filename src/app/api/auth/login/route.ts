import { NextResponse } from "next/server";
import { findProfileByEmail } from "@/lib/db-service";
import {
  verifyPassword,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresa tu correo electrónico y contraseña." },
        { status: 400 },
      );
    }

    const profile = await findProfileByEmail(email);
    if (!profile || !profile.is_active) {
      return NextResponse.json(
        { error: "Credenciales inválidas. Verifica tu correo o contraseña." },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, profile.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas. Verifica tu correo o contraseña." },
        { status: 401 },
      );
    }

    const sessionUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      phone: profile.phone,
      role: profile.role,
    };

    const token = await signSessionToken(sessionUser);
    const response = NextResponse.json({
      user: sessionUser,
      redirectTo: profile.role === "admin" ? "/admin" : "/dashboard",
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
      { error: error?.message || "Error al iniciar sesión." },
      { status: 500 },
    );
  }
}
