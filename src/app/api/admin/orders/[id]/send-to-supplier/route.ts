import { NextRequest, NextResponse } from "next/server";
import { isAdminRole } from "@/lib/auth";
import {
  findOrderById,
  getAuthoritativeSessionUser,
} from "@/lib/db-service";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { dispatchEmailWithResend } from "@/lib/email-service";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await getAuthoritativeSessionUser(request);
    if (!admin || !isAdminRole(admin.role)) {
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

    if (order.payment_status !== "paid_full") {
      return NextResponse.json(
        {
          error:
            "Debes confirmar primero el pago del 100% antes de enviar esta orden al proveedor de fabricación.",
        },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const toEmail = String(body.toEmail || "")
      .trim()
      .toLowerCase();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!toEmail || !EMAIL_REGEX.test(toEmail)) {
      return NextResponse.json(
        { error: "Ingresa un correo electrónico válido del proveedor." },
        { status: 400 },
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: "El asunto y el mensaje detallado son obligatorios." },
        { status: 400 },
      );
    }

    const attachmentFilename =
      typeof body.attachment?.filename === "string" &&
      body.attachment.filename.trim()
        ? body.attachment.filename.trim()
        : null;
    const rawBase64 =
      typeof body.attachment?.base64 === "string"
        ? body.attachment.base64.replace(/^data:[^;]+;base64,/, "").trim()
        : "";

    if (rawBase64.length > 4_300_000) {
      return NextResponse.json(
        {
          error:
            "El archivo adjunto excede el límite permitido (máx. 3 MB). Usa una versión optimizada.",
        },
        { status: 400 },
      );
    }

    const attachments =
      attachmentFilename && rawBase64
        ? [{ filename: attachmentFilename, content: rawBase64 }]
        : undefined;

    const firstItem = order.packages?.[0]?.items?.[0];
    const masterArtUrl =
      firstItem?.customizations?.master_art_url ||
      firstItem?.generated_art_url ||
      null;

    const emailData = {
      order_id: order.id,
      order_code: order.order_code,
      tracking_id: order.tracking_id,
      message,
      attachment_filename: attachmentFilename,
      master_art_url:
        typeof masterArtUrl === "string" && masterArtUrl.startsWith("http")
          ? masterArtUrl
          : null,
    };

    let queueRowId: string | null = null;
    if (isDatabaseConfigured()) {
      const queueRow = await prisma.emailQueue.create({
        data: {
          to_email: toEmail,
          subject,
          template: "supplier_production_order",
          data: emailData,
          status: "pending",
        },
      });
      queueRowId = queueRow.id;
    }

    const dispatch = await dispatchEmailWithResend({
      to: toEmail,
      subject,
      template: "supplier_production_order",
      data: emailData,
      attachments,
    });

    if (isDatabaseConfigured() && queueRowId) {
      await prisma.emailQueue.update({
        where: { id: queueRowId },
        data: dispatch.sent
          ? { status: "sent", attempts: 1 }
          : {
              status: dispatch.simulated ? "pending" : "failed",
              attempts: 1,
              last_error: dispatch.error || "Error al despachar correo",
            },
      });
    }

    // Registrar historial de envío a proveedor dentro de customizations del item
    const nowIso = new Date().toISOString();
    const dispatchRecord = {
      sent_at: nowIso,
      sent_by: admin.email,
      supplier_email: toEmail,
      subject,
      attachment_filename: attachmentFilename,
      email_sent: dispatch.sent,
    };

    if (isDatabaseConfigured() && firstItem?.id) {
      const prevCustomizations = (firstItem.customizations || {}) as Record<
        string,
        any
      >;
      const prevHistory = Array.isArray(
        prevCustomizations.production_dispatch_history,
      )
        ? prevCustomizations.production_dispatch_history
        : prevCustomizations.production_dispatch
          ? [prevCustomizations.production_dispatch]
          : [];
      const updatedCustomizations = {
        ...prevCustomizations,
        production_dispatch: dispatchRecord,
        production_dispatch_history: [dispatchRecord, ...prevHistory].slice(
          0,
          20,
        ),
      };
      await prisma.orderItem
        .update({
          where: { id: firstItem.id },
          data: { customizations: updatedCustomizations as any },
        })
        .catch(() => {});
    }

    if (!dispatch.sent && !dispatch.simulated) {
      return NextResponse.json(
        {
          error:
            dispatch.error ||
            "El correo no pudo enviarse mediante Resend. Revisa la configuración de dominio en Resend.",
          dispatch: dispatchRecord,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      sent: dispatch.sent,
      simulated: Boolean(dispatch.simulated),
      dispatch: dispatchRecord,
      message: dispatch.sent
        ? `Orden de fabricación enviada correctamente a ${toEmail}.`
        : `Orden registrada en email_queue para ${toEmail} (Resend en modo simulación).`,
    });
  } catch (err: any) {
    console.error("[send-to-supplier] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error al enviar la orden al proveedor." },
      { status: 500 },
    );
  }
}
