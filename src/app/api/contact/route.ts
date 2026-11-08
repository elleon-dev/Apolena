import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Try to queue email notification in email_queue for admin if table exists
    try {
      await prisma.emailQueue.create({
        data: {
          to_email: "nmoriano26@gmail.com",
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
          status: "pending",
        },
      });
    } catch (dbErr) {
      // In case DB is offline or table is optional, log gracefully without blocking user response
      console.warn("Could not insert contact inquiry to emailQueue:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message:
        "¡Tu mensaje ha sido recibido! Un asesor de Apolena se comunicará contigo a la brevedad.",
    });
  } catch (error) {
    console.error("Error processing contact message:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al enviar el mensaje. Por favor intenta nuevamente o contáctanos por WhatsApp." },
      { status: 500 },
    );
  }
}
