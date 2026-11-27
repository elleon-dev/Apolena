import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { getAuthoritativeSessionUser } from "@/lib/db-service";
import {
  resolveUserRole,
  SESSION_COOKIE_NAME,
  SessionUser,
  signSessionToken,
} from "@/lib/auth";
import { externalizeBase64Image } from "@/lib/image-storage";
import { deleteUserAccountAndData } from "@/lib/user-deletion";

export const dynamic = "force-dynamic";

/**
 * GET /api/account
 * Devuelve el perfil completo del usuario autenticado y sus contadores básicos.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getAuthoritativeSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        profile: {
          ...sessionUser,
          address: null,
          department: null,
          province: null,
          district: null,
          created_at: new Date().toISOString(),
        },
        stats: { ordersCount: 0, jobsCount: 0 },
      });
    }

    const [profile, ordersCount, jobsCount] = await Promise.all([
      prisma.profile.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar_url: true,
          role: true,
          address: true,
          department: true,
          province: true,
          district: true,
          created_at: true,
        },
      }),
      prisma.order.count({ where: { buyer_id: sessionUser.id } }),
      prisma.generationJob.count({ where: { user_id: sessionUser.id } }),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      profile: {
        ...profile,
        role: resolveUserRole(profile.email, profile.role),
        created_at: profile.created_at.toISOString(),
      },
      stats: { ordersCount, jobsCount },
    });
  } catch (err) {
    console.error("[GET /api/account] Error:", err);
    return NextResponse.json(
      { error: "No se pudo cargar tu perfil." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/account
 * Actualiza los datos personales, dirección predeterminada y foto de perfil del usuario autenticado.
 */
export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getAuthoritativeSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const name =
      typeof body.name === "string" ? body.name.trim().slice(0, 120) : undefined;
    const phone =
      typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : undefined;
    const address =
      typeof body.address === "string"
        ? body.address.trim().slice(0, 220)
        : undefined;
    const department =
      typeof body.department === "string"
        ? body.department.trim().slice(0, 80)
        : undefined;
    const province =
      typeof body.province === "string"
        ? body.province.trim().slice(0, 80)
        : undefined;
    const district =
      typeof body.district === "string"
        ? body.district.trim().slice(0, 80)
        : undefined;

    if (name !== undefined && name.length < 2) {
      return NextResponse.json(
        { error: "Por favor ingresa un nombre válido (mínimo 2 caracteres)." },
        { status: 400 },
      );
    }

    let resolvedAvatarUrl: string | null | undefined = undefined;
    if (body.removeAvatar === true) {
      resolvedAvatarUrl = null;
    } else if (
      typeof body.avatarDataUrl === "string" &&
      body.avatarDataUrl.startsWith("data:image/")
    ) {
      if (body.avatarDataUrl.length > 4_200_000) {
        return NextResponse.json(
          { error: "La foto de perfil es demasiado pesada (máximo 3 MB)." },
          { status: 400 },
        );
      }
      const uploaded = await externalizeBase64Image(
        body.avatarDataUrl,
        "uploads",
        { maxDimension: 512, quality: 85 },
      );
      if (!uploaded || uploaded.startsWith("data:")) {
        return NextResponse.json(
          {
            error:
              "No se pudo almacenar la foto de perfil en el servidor de medios. Intenta nuevamente.",
          },
          { status: 500 },
        );
      }
      resolvedAvatarUrl = uploaded;
    }

    const updated = await prisma.profile.update({
      where: { id: sessionUser.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
        ...(department !== undefined ? { department: department || null } : {}),
        ...(province !== undefined ? { province: province || null } : {}),
        ...(district !== undefined ? { district: district || null } : {}),
        ...(resolvedAvatarUrl !== undefined
          ? { avatar_url: resolvedAvatarUrl }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar_url: true,
        role: true,
        address: true,
        department: true,
        province: true,
        district: true,
        created_at: true,
      },
    });

    const effectiveRole = resolveUserRole(updated.email, updated.role);
    const refreshedSession: SessionUser = {
      id: updated.id,
      email: updated.email,
      name: updated.name || updated.email.split("@")[0],
      role: effectiveRole,
      phone: updated.phone,
      avatar_url: updated.avatar_url,
    };

    const newToken = await signSessionToken(refreshedSession);
    const response = NextResponse.json({
      success: true,
      profile: {
        ...updated,
        role: effectiveRole,
        created_at: updated.created_at.toISOString(),
      },
      user: refreshedSession,
    });

    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[PATCH /api/account] Error:", err);
    return NextResponse.json(
      { error: "No se pudieron guardar los cambios del perfil." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/account
 * Baja voluntaria del usuario autenticado: reutiliza `deleteUserAccountAndData`
 * para limpiar exclusivamente sus datos y archivos propios, cierra sesión y
 * permite volver a registrarse como una cuenta nueva.
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getAuthoritativeSessionUser(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    if (sessionUser.role === "super_admin") {
      return NextResponse.json(
        {
          error:
            "Las cuentas Super Admin están protegidas contra auto-eliminación.",
        },
        { status: 403 },
      );
    }

    const result = await deleteUserAccountAndData(sessionUser.id);
    const response = NextResponse.json({
      success: true,
      ...result,
    });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (err: any) {
    console.error("[DELETE /api/account] Error:", err);
    return NextResponse.json(
      { error: err?.message || "No se pudo completar la baja de tu cuenta." },
      { status: 500 },
    );
  }
}
