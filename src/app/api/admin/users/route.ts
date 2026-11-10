import { NextRequest, NextResponse } from "next/server";
import {
  getSessionUser,
  hashPassword,
  isAdminRole,
  UserRole,
} from "@/lib/auth";
import {
  createProfile,
  findProfileByEmail,
  getAllProfiles,
  updateProfileByAdmin,
} from "@/lib/db-service";

export async function GET() {
  const actor = await getSessionUser();
  if (!actor || !isAdminRole(actor.role)) {
    return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
  }

  const profiles = await getAllProfiles();
  const users = profiles.map(({ password_hash, ...rest }) => rest);
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getSessionUser();
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
    const actor = await getSessionUser();
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
