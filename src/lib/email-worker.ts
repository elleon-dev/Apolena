import { prisma } from "@/lib/prisma";
import { dispatchEmailWithResend, isResendConfigured } from "@/lib/email-service";

export interface ProcessQueueResult {
  is_configured: boolean;
  total_candidates: number;
  processed: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Procesa la cola de correos (email_queue) en estado 'pending' o 'failed' (con intentos < max_attempts)
 */
export async function processEmailQueue(options?: {
  limit?: number;
  emailId?: string;
}): Promise<ProcessQueueResult> {
  const limit = options?.limit || 20;
  const configured = isResendConfigured();

  const whereClause: any = {
    attempts: { lt: 3 },
  };

  if (options?.emailId) {
    whereClause.id = options.emailId;
  } else {
    whereClause.status = { in: ["pending", "failed"] };
  }

  const pendingEmails = await prisma.emailQueue.findMany({
    where: whereClause,
    orderBy: { created_at: "asc" },
    take: limit,
  });

  const result: ProcessQueueResult = {
    is_configured: configured,
    total_candidates: pendingEmails.length,
    processed: 0,
    sent: 0,
    failed: 0,
    errors: [],
  };

  if (!configured) {
    // Si Resend aún no tiene API Key real en el entorno, no podemos enviar correos reales
    result.errors.push("RESEND_API_KEY no configurada o inválida en el entorno.");
    return result;
  }

  for (const email of pendingEmails) {
    result.processed++;
    const nextAttempts = email.attempts + 1;

    try {
      const dispatch = await dispatchEmailWithResend({
        to: email.to_email,
        cc: email.cc,
        subject: email.subject,
        template: email.template,
        data: (email.data as Record<string, any>) || {},
      });

      if (dispatch.sent) {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: "sent",
            attempts: nextAttempts,
            last_error: null,
            updated_at: new Date(),
          },
        });
        result.sent++;
      } else {
        const isExhausted = nextAttempts >= email.max_attempts;
        const errMessage = dispatch.error || "Fallo en despacho con Resend";
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: isExhausted ? "failed" : "pending",
            attempts: nextAttempts,
            last_error: errMessage,
            updated_at: new Date(),
          },
        });
        result.failed++;
        result.errors.push(`[${email.id}] ${errMessage}`);
      }
    } catch (err: any) {
      const isExhausted = nextAttempts >= email.max_attempts;
      const errMessage = err?.message || "Excepción no controlada en el worker";
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: isExhausted ? "failed" : "pending",
          attempts: nextAttempts,
          last_error: errMessage,
          updated_at: new Date(),
        },
      });
      result.failed++;
      result.errors.push(`[${email.id}] ${errMessage}`);
    }
  }

  return result;
}
