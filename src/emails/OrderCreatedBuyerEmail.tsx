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
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export interface OrderCreatedBuyerEmailProps {
  order_code: string;
  tracking_id: string;
  buyer_name: string;
  total_amount: number;
  advance_amount: number;
  remaining_amount: number;
  payment_method: string;
  shipping_address?: string;
  customizations?: {
    size_label?: string;
    frame_name?: string;
    finish_label?: string;
    dedication_note?: string;
    pet_inscription?: {
      pet_name?: string;
    };
  };
  app_url?: string;
}

export default function OrderCreatedBuyerEmail({
  order_code = "AP-94812",
  tracking_id = "TRK-2026-94812",
  buyer_name = "Valeria",
  total_amount = 195,
  advance_amount = 97.5,
  remaining_amount = 97.5,
  payment_method = "yape",
  shipping_address = "Av. Pardo 450, Dpto 802, Miraflores, Lima",
  customizations = {
    size_label: "Grande (L) · 40 × 50 cm",
    frame_name: "Lienzo en Bastidor de Madera",
    finish_label: "Lienzo Completo (Full Screen)",
    pet_inscription: { pet_name: "Firulays" },
  },
  app_url = "https://apolena.pe",
}: OrderCreatedBuyerEmailProps) {
  const trackingUrl = `${app_url}/track/${tracking_id}`;
  const petName = customizations.pet_inscription?.pet_name;

  return (
    <Html lang="es">
      <Head />
      <Preview>¡Tu orden #{order_code} está en fabricación! · Tracking ID: {tracking_id}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Brand */}
          <Section style={headerSection}>
            <Row>
              <Column align="center">
                <Text style={brandTag}>APOLENA ATELIER</Text>
                <Heading style={mainHeading}>¡Gracias por tu compra, {buyer_name}!</Heading>
                <Text style={subheading}>
                  Hemos recibido tu orden <strong>#{order_code}</strong> y tu adelanto del 50%.
                  Nuestro taller artesanal ya inició el <strong>Paso 1: Fabricación</strong> de tu cuadro personalizado.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Tracking ID Hero Card */}
          <Section style={trackingCard}>
            <Text style={trackingLabel}>CÓDIGO ÚNICO DE SEGUIMIENTO (TRACKING ID)</Text>
            <Text style={trackingCode}>{tracking_id}</Text>
            <Text style={trackingHelp}>
              Sigue en tiempo real los 3 pasos: Fabricación → En camino → Entregado
            </Text>
            <Button style={goldButton} href={trackingUrl}>
              Rastrear mi Pedido en Vivo
            </Button>
          </Section>

          {/* Order Details Card */}
          <Section style={cardSection}>
            <Heading as="h2" style={sectionTitle}>
              Detalles de tu Cuadro Personalizado
            </Heading>
            <Hr style={divider} />

            <Row style={itemRow}>
              <Column style={itemKey}>Tamaño del Lienzo:</Column>
              <Column style={itemValue}>{customizations.size_label || "Grande (L)"}</Column>
            </Row>
            <Row style={itemRow}>
              <Column style={itemKey}>Acabado y Presentación:</Column>
              <Column style={itemValue}>{customizations.frame_name || "Lienzo en Bastidor de Madera"}</Column>
            </Row>
            {petName && (
              <Row style={itemRow}>
                <Column style={itemKey}>Nombre de tu Mascota:</Column>
                <Column style={itemValueGold}>&ldquo;{petName}&rdquo; (Caligrafía blanca)</Column>
              </Row>
            )}
            {customizations.dedication_note && (
              <Row style={itemRow}>
                <Column style={itemKey}>Dedicatoria (Regalo):</Column>
                <Column style={itemValue}>&ldquo;{customizations.dedication_note}&rdquo;</Column>
              </Row>
            )}
            <Row style={itemRow}>
              <Column style={itemKey}>Dirección de Entrega:</Column>
              <Column style={itemValue}>{shipping_address}</Column>
            </Row>

            <Hr style={divider} />

            {/* Financial Breakdown 50% / 50% */}
            <Row style={itemRow}>
              <Column style={itemKey}>Total de la Orden:</Column>
              <Column style={itemValueBold}>S/ {total_amount.toFixed(2)}</Column>
            </Row>
            <Row style={itemRow}>
              <Column style={itemKeyGreen}>1er Pago Adelanto (50% abonado vía {payment_method.toUpperCase()}):</Column>
              <Column style={itemValueGreen}>S/ {advance_amount.toFixed(2)} ✓</Column>
            </Row>
            <Row style={itemRow}>
              <Column style={itemKey}>2do Pago Contraentrega (al recibir tu cuadro):</Column>
              <Column style={itemValueBold}>S/ {remaining_amount.toFixed(2)}</Column>
            </Row>
          </Section>

          {/* Reassurance Banner */}
          <Section style={reassuranceSection}>
            <Text style={reassuranceText}>
              Te notificaremos por correo y WhatsApp en cuanto tu lienzo esté tensado y embalado con esquineros de seguridad para salir a despacho.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerBrand}>Apolena Atelier · Cuadros Artísticos Personalizados</Text>
            <Text style={footerLinks}>
              <Link href={`${app_url}/terminos`} style={footerLink}>Términos y Condiciones</Link>
              {" · "}
              <Link href={`${app_url}/privacidad`} style={footerLink}>Privacidad</Link>
              {" · "}
              <Link href={`${app_url}/libro-de-reclamaciones`} style={footerLink}>Libro de Reclamaciones</Link>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Apolena Studio S.A.C. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos Email-Safe
const main = {
  backgroundColor: "#FFFBF2",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  margin: "0 auto",
  padding: "40px 10px",
};

const container = {
  backgroundColor: "#FFFFFF",
  borderRadius: "24px",
  border: "1px solid rgba(198, 162, 108, 0.4)",
  maxWidth: "580px",
  margin: "0 auto",
  padding: "36px 28px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const headerSection = {
  textAlign: "center" as const,
  marginBottom: "28px",
};

const brandTag = {
  fontSize: "11px",
  letterSpacing: "3px",
  fontWeight: "bold",
  color: "#c6a26c",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
};

const mainHeading = {
  color: "#174B3D",
  fontFamily: 'Georgia, serif',
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 12px",
  lineHeight: "1.3",
};

const subheading = {
  fontSize: "14px",
  color: "#4A463F",
  lineHeight: "1.6",
  margin: "0",
};

const trackingCard = {
  backgroundColor: "#174B3D",
  borderRadius: "18px",
  padding: "24px 20px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const trackingLabel = {
  color: "#c6a26c",
  fontSize: "11px",
  letterSpacing: "1.5px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const trackingCode = {
  color: "#FFFFFF",
  fontFamily: 'Courier, monospace',
  fontSize: "26px",
  fontWeight: "bold",
  letterSpacing: "1px",
  margin: "0 0 8px",
};

const trackingHelp = {
  color: "#E8DEC8",
  fontSize: "12px",
  margin: "0 0 16px",
};

const goldButton = {
  backgroundColor: "#c6a26c",
  borderRadius: "999px",
  color: "#174B3D",
  fontSize: "13px",
  fontWeight: "bold",
  padding: "12px 28px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
};

const cardSection = {
  backgroundColor: "#FFFBF2",
  borderRadius: "18px",
  border: "1px solid #E8DEC8",
  padding: "20px 22px",
  margin: "20px 0",
};

const sectionTitle = {
  color: "#174B3D",
  fontFamily: 'Georgia, serif',
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const divider = {
  borderColor: "#E8DEC8",
  margin: "12px 0",
};

const itemRow = {
  marginBottom: "8px",
};

const itemKey = {
  fontSize: "12px",
  color: "#6B665C",
  width: "55%",
};

const itemValue = {
  fontSize: "12px",
  color: "#141414",
  fontWeight: "500",
  textAlign: "right" as const,
};

const itemValueBold = {
  fontSize: "13px",
  color: "#141414",
  fontWeight: "bold",
  textAlign: "right" as const,
};

const itemValueGold = {
  fontSize: "13px",
  color: "#b08544",
  fontWeight: "bold",
  textAlign: "right" as const,
};

const itemKeyGreen = {
  fontSize: "12px",
  color: "#174B3D",
  fontWeight: "bold",
  width: "60%",
};

const itemValueGreen = {
  fontSize: "13px",
  color: "#174B3D",
  fontWeight: "bold",
  textAlign: "right" as const,
};

const reassuranceSection = {
  backgroundColor: "#FAFAF8",
  borderRadius: "14px",
  padding: "14px 18px",
  margin: "16px 0",
  border: "1px solid #EFEAE0",
};

const reassuranceText = {
  fontSize: "12px",
  color: "#5C5850",
  lineHeight: "1.5",
  margin: "0",
  textAlign: "center" as const,
};

const footerSection = {
  textAlign: "center" as const,
  marginTop: "28px",
  paddingTop: "20px",
  borderTop: "1px solid #E8DEC8",
};

const footerBrand = {
  fontSize: "11px",
  fontWeight: "bold",
  color: "#174B3D",
  margin: "0 0 6px",
};

const footerLinks = {
  fontSize: "11px",
  color: "#8A857A",
  margin: "0 0 8px",
};

const footerLink = {
  color: "#174B3D",
  textDecoration: "underline",
};

const footerCopyright = {
  fontSize: "10px",
  color: "#A09B90",
  margin: "0",
};

export { OrderCreatedBuyerEmail };

