import { NextResponse } from "next/server";
import { findProfileByEmail, createProfile } from "@/lib/db-service";
import {
  hashPassword,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const password = body.password || "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Completa tu nombre, correo electrónico y contraseña." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 },
      );
    }

    const existing = await findProfileByEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          error:
            "Ya existe una cuenta registrada con este correo electrónico. Inicia sesión.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const profile = await createProfile({
      email,
      passwordHash,
      name,
      phone,
      role: "user", // Por seguridad RBAC, todo registro público nace con rol "user"
    });

    const sessionUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name || name,
      phone: profile.phone,
      role: profile.role,
    };

    const token = await signSessionToken(sessionUser);
    const response = NextResponse.json({
      user: sessionUser,
      redirectTo: "/dashboard",
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
      { error: error?.message || "Error al crear la cuenta." },
      { status: 500 },
    );
  }
}
