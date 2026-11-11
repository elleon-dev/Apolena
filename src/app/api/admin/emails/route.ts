import { NextResponse } from "next/server";
import { getSessionUser, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processEmailQueue } from "@/lib/email-worker";
import { isResendConfigured } from "@/lib/email-service";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Acceso denegado. Exclusivo para administradores." },
        { status: 403 },
      );
    }

    const [total, pending, sent, failed] = await Promise.all([
      prisma.emailQueue.count(),
      prisma.emailQueue.count({ where: { status: "pending" } }),
      prisma.emailQueue.count({ where: { status: "sent" } }),
      prisma.emailQueue.count({ where: { status: "failed" } }),
    ]);

    const recent = await prisma.emailQueue.findMany({
      orderBy: { created_at: "desc" },
      take: 20,
    });

    return NextResponse.json({
      is_resend_configured: isResendConfigured(),
      counts: { total, pending, sent, failed },
      recent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al obtener estado de correos" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Acceso denegado. Exclusivo para administradores." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { emailId } = body;

    const result = await processEmailQueue({
      limit: 50,
      emailId: emailId || undefined,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al reintentar correos" },
      { status: 500 },
    );
  }
}
