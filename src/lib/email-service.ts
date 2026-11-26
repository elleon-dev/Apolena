/**
 * Servicio de Envío de Correos con Resend API + Plantillas Oficiales de React Email
 * (Basado en https://react.email/templates adaptado para la identidad de Apolena Atelier)
 */

import * as React from "react";
import { render } from "@react-email/render";
import { resolveAppUrl } from "@/lib/app-url";
import OrderCreatedBuyerEmail from "@/emails/OrderCreatedBuyerEmail";
import OrderCreatedAdminEmail from "@/emails/OrderCreatedAdminEmail";
import OrderStatusUpdatedEmail from "@/emails/OrderStatusUpdatedEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import ClaimRegisteredConsumerEmail from "@/emails/ClaimRegisteredConsumerEmail";
import ClaimRegisteredAdminEmail from "@/emails/ClaimRegisteredAdminEmail";
import ContactInquiryEmail from "@/emails/ContactInquiryEmail";

export interface SendEmailPayload {
  to: string;
  cc?: string[];
  subject: string;
  template: string;
  data: Record<string, any>;
}

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  return Boolean(
    key && key.startsWith("re_") && !key.includes("YOUR_") && !key.includes("..."),
  );
}

export async function renderEmailHtml(
  template: string,
  data: Record<string, any>,
): Promise<string> {
  const appUrl = resolveAppUrl(data.app_url);

  switch (template) {
    case "order_created_buyer":
      return await render(
        React.createElement(OrderCreatedBuyerEmail, {
          order_code: data.order_code,
          tracking_id: data.tracking_id,
          buyer_name: data.buyer_name,
          total_amount: Number(data.total_amount || 0),
          advance_amount: Number(data.advance_amount || 0),
          remaining_amount: Number(data.remaining_amount || 0),
          payment_method: data.payment_method,
          shipping_address:
            data.shipping_address ||
            (data.shipping ? `${data.shipping.address}, ${data.shipping.district || ""}` : ""),
          customizations: data.customizations,
          app_url: appUrl,
        }),
      );

    case "order_created_admin":
      return await render(
        React.createElement(OrderCreatedAdminEmail, {
          order_code: data.order_code,
          tracking_id: data.tracking_id,
          buyer_name: data.buyer_name,
          buyer_phone: data.buyer_phone,
          buyer_email: data.buyer_email,
          shipping_address: data.shipping_address,
          payment_method: data.payment_method,
          operation_number: data.operation_number,
          advance_amount: Number(data.advance_amount || 0),
          remaining_amount: Number(data.remaining_amount || 0),
          customizations: data.customizations,
          app_url: appUrl,
        }),
      );

    case "order_status_updated":
      return await render(
        React.createElement(OrderStatusUpdatedEmail, {
          order_code: data.order_code,
          tracking_id: data.tracking_id,
          status: data.status,
          status_label: data.status_label || data.status,
          app_url: appUrl,
        }),
      );

    case "password_reset":
      return await render(
        React.createElement(PasswordResetEmail, {
          name: data.name,
          reset_url: data.reset_url,
          app_url: appUrl,
        }),
      );

    case "claim_registered_consumer":
      return await render(
        React.createElement(ClaimRegisteredConsumerEmail, {
          claim_code: data.claim_code,
          consumer: data.consumer,
          contracted_good: data.contracted_good,
          claim_detail: data.claim_detail,
          app_url: appUrl,
        }),
      );

    case "claim_registered_admin":
      return await render(
        React.createElement(ClaimRegisteredAdminEmail, {
          claim_code: data.claim_code,
          consumer: data.consumer,
          contracted_good: data.contracted_good,
          claim_detail: data.claim_detail,
        }),
      );

    case "contact_inquiry":
      return await render(
        React.createElement(ContactInquiryEmail, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
        }),
      );

    case "country_launch_notification": {
      const countryName = String(data.country_name || "tu país");
      const targetUrl = String(data.app_url || appUrl);
      return `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FFFBF2; padding: 32px; border-radius: 24px; color: #141414; border: 1px solid #E8DEC8;">
          <p style="font-family: sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #94713F; margin: 0 0 12px;">
            APOLENA · EXPANSIÓN INTERNACIONAL
          </p>
          <h1 style="color: #174B3D; font-size: 28px; margin: 0 0 16px; line-height: 1.25;">
            ¡Ya estamos operando en ${countryName}!
          </h1>
          <p style="font-family: sans-serif; font-size: 15px; color: #3E3C37; line-height: 1.65; margin: 0 0 16px;">
            Nos dejaste tu correo para avisarte apenas llegáramos a <strong>${countryName}</strong>. Hoy nos alegra contarte que ya puedes crear el retrato personalizado de tu mascota y pedir tu cuadro Fine Art en lienzo con entrega en tu país.
          </p>
          <div style="margin: 26px 0;">
            <a href="${targetUrl}/products/cuadros-personalizados?step=1" style="display: inline-block; background: #174B3D; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-family: sans-serif; font-size: 14px; font-weight: 700;">
              Crear el retrato de mi mascota
            </a>
          </div>
          <p style="font-family: sans-serif; font-size: 12px; color: #78716C; margin: 20px 0 0; border-top: 1px solid #E8DEC8; padding-top: 16px;">
            Apolena · Retratos personalizados para mascotas en lienzo Fine Art · <a href="${targetUrl}" style="color: #174B3D;">${targetUrl}</a>
          </p>
        </div>
      `;
    }

    default:
      return `
        <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; background: #FFFBF2; padding: 28px; border-radius: 20px; color: #141414; border: 1px solid #c6a26c;">
          <h2 style="color: #174B3D;">Notificación de Apolena</h2>
          <p style="font-family: sans-serif; font-size: 14px; color: #3E3C37;">
            ${data.message || JSON.stringify(data)}
          </p>
          <a href="${appUrl}" style="display: inline-block; background: #c6a26c; color: #174B3D; text-decoration: none; padding: 10px 20px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-top: 12px;">
            Ir a Apolena
          </a>
        </div>
      `;
  }
}

export async function dispatchEmailWithResend(
  payload: SendEmailPayload,
): Promise<{ sent: boolean; error?: string; simulated?: boolean }> {
  if (!isResendConfigured()) {
    return {
      sent: false,
      simulated: true,
      error: "RESEND_API_KEY no configurada (modo simulación)",
    };
  }

  const apiKey = process.env.RESEND_API_KEY!.trim();
  let fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Apolena <onboarding@resend.dev>";

  if (fromEmail.includes("tudominio.com") || fromEmail.includes("example.com")) {
    fromEmail = "Apolena <onboarding@resend.dev>";
  }

  try {
    const html = await renderEmailHtml(payload.template, payload.data);
    let response = await fetch("https://api.resend.com/emails", {
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
      // Si el dominio personalizado no está verificado aún en Resend, fallback automático a onboarding@resend.dev
      if (errText.includes("domain is not verified") && !fromEmail.includes("resend.dev")) {
        console.warn("[email-service] Dominio no verificado en Resend. Reintentando con onboarding@resend.dev...");
        const fallbackRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Apolena <onboarding@resend.dev>",
            to: [payload.to],
            cc: payload.cc && payload.cc.length > 0 ? payload.cc : undefined,
            subject: payload.subject,
            html,
          }),
        });

        if (fallbackRes.ok) {
          return { sent: true };
        }
      }

      let parsedMessage = errText;
      try {
        const json = JSON.parse(errText);
        parsedMessage = json.message || errText;
      } catch {}

      if (parsedMessage.includes("only send testing emails to your own email address")) {
        parsedMessage =
          "Resend (Modo Prueba): Solo permite enviar a tu propio correo de registro en Resend hasta verificar tu dominio en resend.com/domains.";
      }

      return {
        sent: false,
        error: parsedMessage,
      };
    }

    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || "Error de red con Resend" };
  }
}
