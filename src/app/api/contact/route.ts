import { NextResponse } from "next/server";
import { enqueueEmail, getPlatformSettings } from "@/lib/db-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nombre, correo y mensaje son obligatorios." },
        { status: 400 },
      );
    }

    try {
      const settings = await getPlatformSettings();
      const adminEmail = settings.ADMIN_NOTIFICATION_EMAILS?.emails?.[0] || "admin@apolena.pe";

      await enqueueEmail({
        to_email: adminEmail,
        subject: `[Contacto Apolena] ${subject || "Nueva Consulta"} de ${name}`,
        template: "contact_inquiry",
        data: {
          name,
          email,
          phone: phone || "No especificado",
          subject: subject || "Consulta General",
          message,
          submitted_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.warn("Could not enqueue contact inquiry email:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message:
        "¡Tu mensaje ha sido recibido! Un asesor de Apolena se comunicará contigo a la brevedad.",
    });
  } catch (error) {
    console.error("Error processing contact message:", error);
    return NextResponse.json(
      {
        error:
          "Ocurrió un error al enviar el mensaje. Por favor intenta nuevamente o contáctanos por WhatsApp.",
      },
      { status: 500 },
    );
  }
}
