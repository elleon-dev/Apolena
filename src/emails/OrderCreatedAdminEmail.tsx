import * as React from "react";
import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export interface OrderCreatedAdminEmailProps {
  order_code: string;
  tracking_id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string;
  shipping_address: string;
  payment_method: string;
  operation_number?: string;
  advance_amount: number;
  remaining_amount: number;
  customizations?: {
    size_label?: string;
    frame_name?: string;
    dedication_note?: string;
    pet_inscription?: {
      pet_name?: string;
    };
  };
  app_url?: string;
}

export default function OrderCreatedAdminEmail({
  order_code = "AP-94812",
  tracking_id = "TRK-2026-94812",
  buyer_name = "Valeria Mendoza",
  buyer_phone = "999 888 777",
  buyer_email = "valeria@gmail.com",
  shipping_address = "Av. Pardo 450, Dpto 802, Miraflores, Lima",
  payment_method = "yape",
  operation_number = "1928374",
  advance_amount = 97.5,
  remaining_amount = 97.5,
  customizations = {
    size_label: "Grande (L) · 40 × 50 cm",
    frame_name: "Lienzo en Bastidor de Madera",
    pet_inscription: { pet_name: "Firulays" },
  },
  app_url = "https://apolena.pe",
}: OrderCreatedAdminEmailProps) {
  const adminUrl = `${app_url}/admin`;
  const petName = customizations.pet_inscription?.pet_name;

  return (
    <Html lang="es">
      <Head />
      <Preview>[NUEVA ORDEN APOLENA] #{order_code} · Adelanto 50% abonado</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={badge}>TALLER APOLENA · NUEVA ORDEN</Text>
            <Heading style={mainHeading}>Orden #{order_code}</Heading>
            <Text style={trackingText}>Tracking ID: <strong>{tracking_id}</strong></Text>
          </Section>

          {/* Datos del Cliente y Envío */}
          <Section style={infoCard}>
            <Heading as="h2" style={cardTitle}>Datos del Comprador</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Cliente:</strong> {buyer_name} ({buyer_email})</Text>
            <Text style={line}><strong>Teléfono / WhatsApp:</strong> {buyer_phone}</Text>
            <Text style={line}><strong>Dirección Delivery:</strong> {shipping_address}</Text>
          </Section>

          {/* Especificaciones de Taller */}
          <Section style={infoCard}>
            <Heading as="h2" style={cardTitle}>Especificaciones del Cuadro</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Medida Lienzo:</strong> {customizations.size_label || "No especificado"}</Text>
            <Text style={line}><strong>Presentación:</strong> {customizations.frame_name || "Lienzo en bastidor"}</Text>
            {petName && (
              <Text style={lineGold}><strong>Nombre de Mascota grabado:</strong> &ldquo;{petName}&rdquo;</Text>
            )}
            {customizations.dedication_note && (
              <Text style={line}><strong>Dedicatoria (Regalo):</strong> &ldquo;{customizations.dedication_note}&rdquo;</Text>
            )}
          </Section>

          {/* Financiero */}
          <Section style={infoCard}>
            <Heading as="h2" style={cardTitle}>Validación de Pago 50%</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Método:</strong> {payment_method.toUpperCase()} · <strong>Op / Ref:</strong> {operation_number || "Por verificar"}</Text>
            <Text style={lineGreen}><strong>Adelanto 50% Recibido:</strong> S/ {advance_amount.toFixed(2)}</Text>
            <Text style={line}><strong>Saldo 50% por cobrar Contraentrega:</strong> S/ {remaining_amount.toFixed(2)}</Text>
          </Section>

          <Section style={actionSection}>
            <Button style={button} href={adminUrl}>
              Gestionar Orden en Panel de Administración
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0D2C24",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  margin: "0 auto",
  padding: "40px 10px",
};

const container = {
  backgroundColor: "#174B3D",
  borderRadius: "24px",
  border: "1px solid rgba(198, 162, 108, 0.4)",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px 24px",
  color: "#FFFFFF",
};

const headerSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const badge = {
  backgroundColor: "rgba(198,162,108,0.2)",
  border: "1px solid #c6a26c",
  color: "#c6a26c",
  fontSize: "11px",
  fontWeight: "bold",
  letterSpacing: "2px",
  padding: "6px 14px",
  borderRadius: "999px",
  display: "inline-block",
  margin: "0 0 10px",
};

const mainHeading = {
  color: "#FFFFFF",
  fontSize: "26px",
  fontWeight: "bold",
  margin: "0 0 4px",
};

const trackingText = {
  color: "#E8DEC8",
  fontSize: "13px",
  margin: "0",
};

const infoCard = {
  backgroundColor: "#123B30",
  borderRadius: "16px",
  border: "1px solid rgba(198,162,108,0.25)",
  padding: "18px 20px",
  marginBottom: "16px",
};

const cardTitle = {
  color: "#c6a26c",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const divider = {
  borderColor: "rgba(198,162,108,0.2)",
  margin: "8px 0 12px",
};

const line = {
  fontSize: "12px",
  color: "#F3EDE2",
  margin: "4px 0",
  lineHeight: "1.5",
};

const lineGold = {
  fontSize: "13px",
  color: "#F2D59B",
  fontWeight: "bold",
  margin: "6px 0",
};

const lineGreen = {
  fontSize: "13px",
  color: "#6DE3A6",
  fontWeight: "bold",
  margin: "6px 0",
};

const actionSection = {
  textAlign: "center" as const,
  marginTop: "24px",
};

const button = {
  backgroundColor: "#c6a26c",
  borderRadius: "999px",
  color: "#174B3D",
  fontSize: "13px",
  fontWeight: "bold",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

export { OrderCreatedAdminEmail };

