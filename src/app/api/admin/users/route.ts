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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function extractSupabaseStorageTarget(
  url?: string | null,
): { bucket: string; path: string } | null {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return null;
  const match = url.match(
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?.*)?$/,
  );
  if (!match) return null;
  const bucket = decodeURIComponent(match[1]);
  const filePath = decodeURIComponent(match[2]);
  if (!bucket || !filePath) return null;
  if (
    filePath.startsWith("characters/") ||
    filePath.startsWith("frames/") ||
    filePath.startsWith("catalog/")
  ) {
    return null;
  }
  return { bucket, path: filePath };
}

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
 * Exclusivo para super_admin: elimina definitivamente un usuario y limpia en cascada
 * todos sus retratos generados, órdenes, archivos en Supabase Storage, reseñas y
 * suscripciones, permitiendo que el correo vuelva a registrarse desde cero.
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
      select: { id: true, email: true, role: true, name: true },
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

    // 1. Recolectar todos los jobs y órdenes del usuario para limpiar Supabase Storage
    const [userJobs, userOrders] = await Promise.all([
      prisma.generationJob.findMany({
        where: { user_id: targetProfile.id },
        select: {
          id: true,
          pet_image_url: true,
          second_pet_image_url: true,
          output_image_url: true,
          hd_output_image_url: true,
          variants: true,
          settings: true,
        },
      }),
      prisma.order.findMany({
        where: { buyer_id: targetProfile.id },
        select: {
          id: true,
          packages: {
            select: {
              id: true,
              items: {
                select: {
                  pet_photo_url: true,
                  generated_art_url: true,
                  customizations: true,
                },
              },
            },
          },
          paymentTransactions: {
            select: { proof_image_url: true },
          },
        },
      }),
    ]);

    const urls = new Set<string>();
    const addUrl = (val: unknown) => {
      if (typeof val === "string" && val.startsWith("http")) {
        urls.add(val);
      }
    };

    for (const job of userJobs) {
      addUrl(job.pet_image_url);
      addUrl(job.second_pet_image_url);
      addUrl(job.output_image_url);
      addUrl(job.hd_output_image_url);
      if (Array.isArray(job.variants)) {
        for (const v of job.variants as Array<{ imageUrl?: string }>) {
          addUrl(v?.imageUrl);
        }
      }
      if (job.settings && typeof job.settings === "object") {
        const mv = (job.settings as Record<string, unknown>).master_variants;
        if (mv && typeof mv === "object") {
          for (const val of Object.values(mv as Record<string, unknown>)) {
            addUrl(val);
          }
        }
      }
    }

    const orderIds: string[] = [];
    const packageIds: string[] = [];
    for (const order of userOrders) {
      orderIds.push(order.id);
      for (const pkg of order.packages) {
        packageIds.push(pkg.id);
        for (const item of pkg.items) {
          addUrl(item.pet_photo_url);
          addUrl(item.generated_art_url);
          if (item.customizations && typeof item.customizations === "object") {
            addUrl(
              (item.customizations as Record<string, unknown>).master_art_url,
            );
          }
        }
      }
      for (const tx of order.paymentTransactions) {
        addUrl(tx.proof_image_url);
      }
    }

    // 2. Eliminar archivos de Supabase Storage agrupados por bucket
    const bucketMap = new Map<string, Set<string>>();
    for (const url of Array.from(urls)) {
      const target = extractSupabaseStorageTarget(url);
      if (!target) continue;
      if (!bucketMap.has(target.bucket)) {
        bucketMap.set(target.bucket, new Set());
      }
      bucketMap.get(target.bucket)!.add(target.path);
    }

    let deletedStorageFiles = 0;
    if (isSupabaseConfigured && supabase && bucketMap.size > 0) {
      for (const [bucket, pathSet] of Array.from(bucketMap.entries())) {
        const paths: string[] = Array.from(pathSet);
        for (let i = 0; i < paths.length; i += 100) {
          const chunk = paths.slice(i, i + 100);
          const { error } = await supabase.storage.from(bucket).remove(chunk);
          if (!error) {
            deletedStorageFiles += chunk.length;
          }
        }
      }
    }

    // 3. Eliminar todos los registros de PostgreSQL en una transacción atómica
    await prisma.$transaction(async (tx) => {
      if (orderIds.length > 0) {
        await tx.review.deleteMany({
          where: {
            OR: [{ buyer_id: targetProfile.id }, { order_id: { in: orderIds } }],
          },
        });
        await tx.paymentTransaction.deleteMany({
          where: { order_id: { in: orderIds } },
        });
        if (packageIds.length > 0) {
          await tx.orderItem.deleteMany({
            where: { package_id: { in: packageIds } },
          });
          await tx.orderPackage.deleteMany({
            where: { id: { in: packageIds } },
          });
        }
        await tx.orderInvoice.deleteMany({
          where: { order_id: { in: orderIds } },
        });
        await tx.orderShipping.deleteMany({
          where: { order_id: { in: orderIds } },
        });
        await tx.order.deleteMany({
          where: { id: { in: orderIds } },
        });
      } else {
        await tx.review.deleteMany({ where: { buyer_id: targetProfile.id } });
      }

      await tx.generationJob.deleteMany({
        where: { user_id: targetProfile.id },
      });

      await tx.emailQueue.deleteMany({
        where: { to_email: targetProfile.email },
      });

      await tx.newsletterSubscriber.deleteMany({
        where: { email: targetProfile.email },
      });

      await tx.profile.delete({
        where: { id: targetProfile.id },
      });
    });

    return NextResponse.json({
      success: true,
      deletedEmail: targetProfile.email,
      deletedOrders: orderIds.length,
      deletedJobs: userJobs.length,
      deletedStorageFiles,
    });
  } catch (error: any) {
    console.error("[DELETE /api/admin/users] Error:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar el usuario." },
      { status: 500 },
    );
  }
}
