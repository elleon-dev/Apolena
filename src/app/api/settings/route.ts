import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/db-service";

export async function GET() {
  const settings = await getPlatformSettings();
  return NextResponse.json({
    paymentMethods: settings.PAYMENT_METHODS_CONFIG,
    shippingRates: settings.SHIPPING_RATES_CONFIG,
    supportWhatsapp: settings.ADMIN_NOTIFICATION_EMAILS.whatsapp_support,
  });
}
