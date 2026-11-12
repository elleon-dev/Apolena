import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email-worker";

export const dynamic = "force-dynamic";

/**
 * Worker Cron para procesamiento de email_queue
 * Invocable periódicamente (ej. cada 5 min) por Vercel Cron o trigger externo
 * Protegido mediante Authorization: Bearer <CRON_SECRET> o ?secret=<CRON_SECRET>
 */
export async function GET(req: Request) {
  return handleWorkerExecution(req);
}

export async function POST(req: Request) {
  return handleWorkerExecution(req);
}

async function handleWorkerExecution(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim();
    const url = new URL(req.url);
    const querySecret = url.searchParams.get("secret");
    const authHeader = req.headers.get("authorization");
    const bearerSecret = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    // Si CRON_SECRET está definido en producción, validamos autenticación
    if (cronSecret && cronSecret !== "your-cron-secret-change-me") {
      const provided = bearerSecret || querySecret;
      if (!provided || provided !== cronSecret) {
        return NextResponse.json(
          { error: "No autorizado. Token de CRON_SECRET inválido o ausente." },
          { status: 401 },
        );
      }
    }

    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 25;

    const summary = await processEmailQueue({ limit });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: any) {
    console.error("Error en cron email-worker:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno al ejecutar email-worker" },
      { status: 500 },
    );
  }
}
