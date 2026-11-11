import { NextResponse } from "next/server";
import { enqueueEmail } from "@/lib/db-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      consumer_name,
      document_type,
      document_number,
      email,
      phone,
      address,
      department,
      province,
      district,
      is_minor,
      parent_name,
      contracted_type, // "producto" | "servicio"
      claim_amount,
      order_code,
      claim_type, // "reclamo" | "queja"
      description,
      consumer_request,
    } = body;

    if (
      !consumer_name ||
      !document_number ||
      !email ||
      !phone ||
      !address ||
      !description ||
      !consumer_request
    ) {
      return NextResponse.json(
        { error: "Por favor completa todos los campos obligatorios (*)." },
        { status: 400 },
      );
    }

    // Generar código único correlativo de reclamación: REC-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const claimCode = `REC-${dateStr}-${randomHex}`;

    const claimPayload = {
      claim_code: claimCode,
      created_at: new Date().toISOString(),
      consumer: {
        name: consumer_name,
        document_type: document_type || "DNI",
        document_number,
        email,
        phone,
        address,
        department: department || "Lima",
        province: province || "Lima",
        district: district || "",
        is_minor: Boolean(is_minor),
        parent_name: parent_name || null,
      },
      contracted_good: {
        type: contracted_type || "producto",
        amount_pen: claim_amount ? Number(claim_amount) : 0,
        order_code: order_code || null,
      },
      claim_detail: {
        type: claim_type || "reclamo",
        description,
        consumer_request,
      },
      legal_deadline_business_days: 15,
    };

    // 1. Enviar y encolar correo de confirmación al reclamante
    await enqueueEmail({
      to_email: email,
      subject: `Constancia de Registro: Hoja de Reclamación ${claimCode} — Apolena Atelier`,
      template: "claim_registered_consumer",
      data: claimPayload,
    });

    // 2. Enviar y encolar notificación al equipo legal y administrativo de Apolena
    await enqueueEmail({
      to_email: "legal@apolena.pe",
      subject: `[Alerta INDECOPI] Nueva Hoja de ${claim_type === "queja" ? "Queja" : "Reclamo"} ${claimCode} registrada`,
      template: "claim_registered_admin",
      data: claimPayload,
    });

    return NextResponse.json({
      success: true,
      claim_code: claimCode,
      message:
        "Tu reclamo/queja ha sido registrado exitosamente. Hemos enviado una copia formal a tu correo electrónico conforme a la normativa de INDECOPI.",
    });
  } catch (error: any) {
    console.error("Error al registrar reclamo:", error);
    return NextResponse.json(
      { error: "No se pudo procesar el registro del reclamo en este momento." },
      { status: 500 },
    );
  }
}
