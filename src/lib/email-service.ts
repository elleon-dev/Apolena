/**
 * Servicio de Envío de Correos con Resend API + Plantillas HTML de Apolena
 * Si RESEND_API_KEY está configurada en .env.local, despacha el correo real a través de Resend.
 * Si aún no está configurada, opera en modo simulación guardando el registro en email_queue.
 */

export interface SendEmailPayload {
  to: string;
  cc?: string[];
  subject: string;
  template: string;
  data: Record<string, any>;
}

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return Boolean(key && key.startsWith("re_") && !key.includes("YOUR_"));
}

export function renderEmailHtml(
  template: string,
  data: Record<string, any>,
): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  if (template === "order_created_buyer") {
    const trackingUrl = `${appUrl}/track/${data.tracking_id || ""}`;
    return `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FAF8F5; padding: 32px; border-radius: 20px; color: #1C1917; border: 1px solid #E8E2D9;">
        <h1 style="font-size: 24px; margin-bottom: 8px; color: #1C1917;">¡Gracias por tu compra en Apolena, ${data.buyer_name || ""}!</h1>
        <p style="font-family: sans-serif; font-size: 14px; color: #57534E; line-height: 1.6;">
          Hemos recibido tu orden <strong>#${data.order_code}</strong> y tu adelanto del 50%. Nuestro taller ya inició el <strong>Paso 1: Fabricación</strong> de tu cuadro personalizado.
        </p>
        <div style="background: #FFFFFF; border: 1px solid #E8E2D9; border-radius: 16px; padding: 20px; margin: 20px 0; font-family: sans-serif;">
          <p style="font-size: 11px; text-transform: uppercase; color: #78716C; margin: 0 0 6px;">Tu Tracking ID de Seguimiento (3 Pasos)</p>
          <p style="font-family: monospace; font-size: 24px; font-weight: bold; color: #C85A32; margin: 0 0 12px;">${data.tracking_id}</p>
          <a href="${trackingUrl}" style="display: inline-block; background: #C85A32; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 999px; font-size: 13px; font-weight: 600;">
            Rastrear mi Orden en Vivo
          </a>
        </div>
        <div style="background: #FFFFFF; border: 1px solid #E8E2D9; border-radius: 16px; padding: 16px; font-family: sans-serif; font-size: 13px;">
          <p style="margin: 4px 0;"><strong>Medida:</strong> ${data.customizations?.size_label || "Estándar"}</p>
          <p style="margin: 4px 0;"><strong>Marco:</strong> ${data.customizations?.frame_name || "Bastidor de Galería"}</p>
          <p style="margin: 4px 0;"><strong>Total de la Orden:</strong> S/ ${Number(data.total_amount || 0).toFixed(2)}</p>
          <p style="margin: 4px 0; color: #3B6E52;"><strong>1er 50% Abonado (${String(data.payment_method || "").toUpperCase()}):</strong> S/ ${Number(data.advance_amount || 0).toFixed(2)}</p>
          <p style="margin: 4px 0;"><strong>2do 50% Contraentrega (al recibir):</strong> S/ ${Number(data.remaining_amount || 0).toFixed(2)}</p>
        </div>
      </div>
    `;
  }

  if (template === "order_created_admin") {
    const adminUrl = `${appUrl}/admin`;
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #1C1917; padding: 28px; border-radius: 20px; color: #FAF8F5;">
        <h2 style="margin-top: 0; color: #E07A5F;">[NUEVA ORDEN APOLENA] ${data.order_code}</h2>
        <p style="font-size: 14px; color: #D6D3D1;">Se ha registrado un nuevo pedido con adelanto del 50%.</p>
        <div style="background: #292524; padding: 16px; border-radius: 12px; font-size: 13px; line-height: 1.6;">
          <p style="margin: 4px 0;"><strong>Tracking ID:</strong> ${data.tracking_id}</p>
          <p style="margin: 4px 0;"><strong>Cliente:</strong> ${data.buyer_name} (${data.buyer_email})</p>
          <p style="margin: 4px 0;"><strong>Teléfono / WhatsApp:</strong> ${data.buyer_phone}</p>
          <p style="margin: 4px 0;"><strong>Dirección Delivery:</strong> ${data.shipping_address}</p>
          <p style="margin: 4px 0;"><strong>Método 50% Inicial:</strong> ${String(data.payment_method || "").toUpperCase()} · Op: ${data.operation_number}</p>
          <p style="margin: 4px 0;"><strong>Adelanto 50%:</strong> S/ ${Number(data.advance_amount || 0).toFixed(2)} | <strong>Contraentrega 50%:</strong> S/ ${Number(data.remaining_amount || 0).toFixed(2)}</p>
          <p style="margin: 4px 0;"><strong>Personalización:</strong> ${data.customizations?.size_label} · ${data.customizations?.frame_name}</p>
        </div>
        <div style="margin-top: 20px;">
          <a href="${adminUrl}" style="display: inline-block; background: #C85A32; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 999px; font-size: 13px; font-weight: 600;">
            Abrir Panel de Administración
          </a>
        </div>
      </div>
    `;
  }

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #FAF8F5; padding: 28px; border-radius: 20px; color: #1C1917; border: 1px solid #E8E2D9;">
      <h2 style="font-family: Georgia, serif; margin-top: 0;">Actualización de tu pedido #${data.order_code || ""}</h2>
      <p style="font-size: 14px; color: #57534E;">
        Nuevo estado de tu orden (Tracking <strong>${data.tracking_id || ""}</strong>):
      </p>
      <div style="background: #FFFFFF; border: 1px solid #E8E2D9; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <strong style="font-size: 16px; color: #C85A32;">${data.status_label || data.status}</strong>
      </div>
      <a href="${appUrl}/track/${data.tracking_id || ""}" style="display: inline-block; background: #1C1917; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 999px; font-size: 13px;">
        Ver Seguimiento en Vivo
      </a>
    </div>
  `;
}

export async function dispatchEmailWithResend(
  payload: SendEmailPayload,
): Promise<{ sent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    // Modo desarrollo sin RESEND_API_KEY: queda registrado en email_queue
    return { sent: true };
  }

  const apiKey = process.env.RESEND_API_KEY!.trim();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Apolena Atelier <notificaciones@apolena.pe>";

  try {
    const html = renderEmailHtml(payload.template, payload.data);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        cc: payload.cc && payload.cc.length > 0 ? payload.cc : undefined,
        subject: payload.subject,
        html,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        sent: false,
        error: `Resend HTTP ${response.status}: ${errText}`,
      };
    }

    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || "Error de red con Resend" };
  }
}
