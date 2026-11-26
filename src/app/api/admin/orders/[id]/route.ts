import { NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth";
import {
  getAuthoritativeSessionUser,
  updateOrderAdminLifecycle,
  findOrderById,
  PaymentMethod,
} from "@/lib/db-service";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import {
  resolveCleanMasterArtwork,
  isWatermarkedPreviewUrl,
} from "@/lib/server-watermark";
import { getRequestOrigin } from "@/lib/app-url";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthoritativeSessionUser(request);
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Acceso denegado. Exclusivo para administradores." },
        { status: 403 },
      );
    }

    const order = await findOrderById(params.id);
    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada." },
        { status: 404 },
      );
    }

    const item = order.packages?.[0]?.items?.[0];
    let masterArtUrl = item?.customizations?.master_art_url || null;

    if (!masterArtUrl || isWatermarkedPreviewUrl(masterArtUrl)) {
      const resolved = await resolveCleanMasterArtwork(
        item?.generation_job_id,
        item?.customizations?.selected_variant_id,
        item?.generated_art_url,
      );
      if (resolved && !isWatermarkedPreviewUrl(resolved)) {
        masterArtUrl = resolved;
        if (isDatabaseConfigured() && item?.id) {
          try {
            await prisma.orderItem.update({
              where: { id: item.id },
              data: {
                customizations: {
                  ...(item.customizations || {}),
                  master_art_url: resolved,
                } as any,
              },
            });
          } catch (e) {
            console.warn("Failed to persist master_art_url to DB:", e);
          }
        }
      }
    }

    return NextResponse.json({
      order,
      masterArtUrl: masterArtUrl || null,
      isCleanMaster: Boolean(masterArtUrl && !isWatermarkedPreviewUrl(masterArtUrl)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al recuperar el archivo maestro." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthoritativeSessionUser(request);
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Acceso denegado. Exclusivo para administradores." },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Caso 1: Edición de datos de contacto / envío / comprobante
    if (body.action === "edit_order_details") {
      const updated = await updateOrderAdminLifecycle({
        orderId: params.id,
        adminId: user.id,
        action: "edit_order_details",
        shipping: body.shipping,
        paymentUpdate: body.paymentUpdate,
      } as any);

      if (!updated) {
        return NextResponse.json(
          { error: "No se pudo actualizar la orden. Verifica que no esté en camino." },
          { status: 400 },
        );
      }

      return NextResponse.json({ order: updated });
    }

    // Caso 2: Edición de Tracking ID y datos del Courier / Transporte
    if (body.action === "edit_tracking_courier") {
      const updated = await updateOrderAdminLifecycle({
        orderId: params.id,
        adminId: user.id,
        action: "edit_tracking_courier",
        tracking_id: body.tracking_id,
        courier: body.courier,
        tracking_number: body.tracking_number,
        tracking_url: body.tracking_url,
        carrierPhone: body.carrierPhone,
        estimated_delivery: body.estimated_delivery,
        notes: body.notes,
        changeStatusToInTransit: Boolean(body.changeStatusToInTransit),
        app_url: getRequestOrigin(request),
      });

      if (!updated) {
        return NextResponse.json(
          { error: "No se pudo actualizar los datos de tracking y courier." },
          { status: 400 },
        );
      }

      return NextResponse.json({ order: updated });
    }

    // Caso 2: Transiciones de estado originales (Ciclo de vida)
    const updated = await updateOrderAdminLifecycle({
      orderId: params.id,
      adminId: user.id,
      action: body.action,
      courier: body.courier,
      carrierPhone: body.carrierPhone,
      finalPaymentMethod: body.finalPaymentMethod as PaymentMethod | undefined,
      finalOperationNumber: body.finalOperationNumber,
      notes: body.notes,
      app_url: getRequestOrigin(request),
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Orden no encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al actualizar la orden." },
      { status: 500 },
    );
  }
}

function extractApolenaMediaPath(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const marker = "/storage/v1/object/public/apolena-media/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const relativePath = decodeURIComponent(
    url.slice(idx + marker.length).split("?")[0],
  );
  // Solo eliminar carpetas propias de órdenes/usuarios (jamás borrar characters/ ni products/)
  if (
    relativePath.startsWith("pets/") ||
    relativePath.startsWith("artworks/") ||
    relativePath.startsWith("previews/") ||
    relativePath.startsWith("proofs/")
  ) {
    return relativePath;
  }
  return null;
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getAuthoritativeSessionUser(request);
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        {
          error:
            "Acceso denegado. Solo administradores y super administradores pueden eliminar órdenes.",
        },
        { status: 403 },
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Base de datos no configurada." },
        { status: 503 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        packages: {
          include: {
            items: true,
          },
        },
        paymentTransactions: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Orden no encontrada." },
        { status: 404 },
      );
    }

    const packageIds = order.packages.map((p) => p.id);
    const linkedJobIds = Array.from(
      new Set(
        order.packages
          .flatMap((p) => p.items)
          .map((it) => it.generation_job_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const storagePaths = new Set<string>();
    const collectPath = (u?: string | null) => {
      const p = extractApolenaMediaPath(u);
      if (p) storagePaths.add(p);
    };

    for (const pkg of order.packages) {
      for (const it of pkg.items) {
        collectPath(it.pet_photo_url);
        collectPath(it.generated_art_url);
        const cust = it.customizations as Record<string, any> | null;
        if (cust?.master_art_url) collectPath(cust.master_art_url);
      }
    }

    for (const tx of order.paymentTransactions) {
      collectPath(tx.proof_image_url);
    }

    // Buscar jobs vinculados para también limpiar sus archivos de Storage
    if (linkedJobIds.length > 0) {
      const jobs = await prisma.generationJob.findMany({
        where: { id: { in: linkedJobIds } },
      });
      for (const job of jobs) {
        collectPath(job.pet_image_url);
        collectPath(job.second_pet_image_url);
        collectPath(job.output_image_url);
        collectPath(job.hd_output_image_url);
        if (Array.isArray(job.variants)) {
          for (const v of job.variants as any[]) {
            if (v?.imageUrl) collectPath(v.imageUrl);
          }
        }
      }
    }

    // Eliminación atómica en cascada de la orden y todos sus registros relacionados
    await prisma.$transaction(async (tx) => {
      await tx.review.deleteMany({ where: { order_id: order.id } });
      await tx.orderInvoice.deleteMany({ where: { order_id: order.id } });
      await tx.paymentTransaction.deleteMany({ where: { order_id: order.id } });
      if (packageIds.length > 0) {
        await tx.orderItem.deleteMany({
          where: { package_id: { in: packageIds } },
        });
      }
      await tx.orderPackage.deleteMany({ where: { order_id: order.id } });
      await tx.orderShipping.deleteMany({ where: { order_id: order.id } });
      await tx.order.delete({ where: { id: order.id } });

      // Eliminar generation_jobs huérfanos vinculados a esta orden
      if (linkedJobIds.length > 0) {
        const stillReferenced = await tx.orderItem.findMany({
          where: { generation_job_id: { in: linkedJobIds } },
          select: { generation_job_id: true },
        });
        const referencedSet = new Set(
          stillReferenced.map((r) => r.generation_job_id).filter(Boolean),
        );
        const jobsToDelete = linkedJobIds.filter((id) => !referencedSet.has(id));
        if (jobsToDelete.length > 0) {
          await tx.generationJob.deleteMany({
            where: { id: { in: jobsToDelete } },
          });
        }
      }

      // Eliminar correos en cola relacionados con esta orden o su tracking ID
      await tx.emailQueue.deleteMany({
        where: {
          OR: [
            { subject: { contains: order.order_code } },
            { subject: { contains: order.tracking_id } },
          ],
        },
      });
    });

    // Eliminar archivos multimedia en Supabase Storage (best-effort)
    let deletedStorageCount = 0;
    const pathsArray = Array.from(storagePaths);
    if (pathsArray.length > 0 && isSupabaseConfigured && supabase) {
      try {
        const { data: removed } = await supabase.storage
          .from("apolena-media")
          .remove(pathsArray);
        deletedStorageCount = removed?.length ?? 0;
      } catch (storageErr) {
        console.warn("Storage cleanup warning on order delete:", storageErr);
      }
    }

    return NextResponse.json({
      success: true,
      deletedOrderId: order.id,
      orderCode: order.order_code,
      deletedStorageFiles: deletedStorageCount,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/orders/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo eliminar la orden." },
      { status: 500 },
    );
  }
}