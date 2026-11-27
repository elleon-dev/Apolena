import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  isAdminRole,
  UserRole,
} from "@/lib/auth";
import {
  createProfile,
  findProfileByEmail,
  getAllProfiles,
  getAuthoritativeSessionUser,
  updateProfileByAdmin,
} from "@/lib/db-service";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { deleteUserAccountAndData } from "@/lib/user-deletion";

export async function GET(request: NextRequest) {
  const actor = await getAuthoritativeSessionUser(request);
  if (!actor || !isAdminRole(actor.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const profiles = await getAllProfiles();
  const users = profiles.map(({ password_hash, ...rest }) => rest);
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getAuthoritativeSessionUser(request);
    if (!actor || !isAdminRole(actor.role)) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "apolena123").trim();
    const requestedRole = (body.role || "user") as UserRole;

    if (!email || !name) {
      return NextResponse.json(
        { error: "El nombre y correo electrónico son obligatorios." },
        { status: 400 },
      );
    }

    if (actor.role === "admin" && requestedRole === "super_admin") {
      return NextResponse.json(
        {
          error:
            "Permiso denegado: Un administrador solo puede crear usuarios con rol user o admin.",
        },
        { status: 403 },
      );
    }

    const existing = await findProfileByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario registrado con ese correo." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const created = await createProfile({
      email,
      passwordHash,
      name,
      phone,
      role: requestedRole,
    });

    const { password_hash, ...sanitized } = created;
    return NextResponse.json({ user: sanitized }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No se pudo crear el usuario." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await getAuthoritativeSessionUser(request);
    if (!actor || !isAdminRole(actor.role)) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }

    const body = await request.json();
    const targetProfileId = String(body.userId || "").trim();
    if (!targetProfileId) {
      return NextResponse.json(
        { error: "ID de usuario requerido." },
        { status: 400 },
      );
    }

    const updated = await updateProfileByAdmin({
      actorRole: actor.role,
      targetProfileId,
      role: body.role as UserRole | undefined,
      is_active:
        typeof body.is_active === "boolean" ? body.is_active : undefined,
      name: body.name,
      phone: body.phone,
    });

    const { password_hash, ...sanitized } = updated;
    return NextResponse.json({ user: sanitized });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al actualizar el usuario." },
      { status: 400 },
    );
  }
}

/**
 * DELETE /api/admin/users
 * Exclusivo para super_admin: delega la limpieza segura en `deleteUserAccountAndData`
 * (mismo servicio reutilizable para baja voluntaria del propio usuario).
 */
export async function DELETE(request: NextRequest) {
  try {
    const actor = await getAuthoritativeSessionUser(request);
    if (!actor || actor.role !== "super_admin") {
      return NextResponse.json(
        {
          error:
            "Acceso denegado. Solo un Super Admin puede eliminar usuarios definitivamente.",
        },
        { status: 403 },
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetUserId = String(body.userId || "").trim();
    if (!targetUserId) {
      return NextResponse.json(
        { error: "ID de usuario requerido." },
        { status: 400 },
      );
    }

    if (targetUserId === actor.id) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta de Super Admin." },
        { status: 400 },
      );
    }

    const targetProfile = await prisma.profile.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    if (targetProfile.role === "super_admin") {
      return NextResponse.json(
        { error: "No se puede eliminar una cuenta con rol Super Admin." },
        { status: 403 },
      );
    }

    const result = await deleteUserAccountAndData(targetProfile.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[DELETE /api/admin/users] Error:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar el usuario." },
      { status: 500 },
    );
  }
}
