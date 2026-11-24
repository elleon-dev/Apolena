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