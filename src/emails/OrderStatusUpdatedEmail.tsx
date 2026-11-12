import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface OrderStatusUpdatedEmailProps {
  order_code: string;
  tracking_id: string;
  status: string;
  status_label: string;
  app_url?: string;
}

export default function OrderStatusUpdatedEmail({
  order_code = "AP-94812",
  tracking_id = "TRK-2026-94812",
  status = "in_transit",
  status_label = "En Camino a tu Domicilio (Paso 2 de 3)",
  app_url = "https://apolena.pe",
}: OrderStatusUpdatedEmailProps) {
  const trackingUrl = `${app_url}/track/${tracking_id}`;

  const isCompleted = status === "completed" || status === "delivered";
  const isInTransit = status === "in_transit";

  return (
    <Html lang="es">
      <Head />
      <Preview>Actualización de tu pedido #{order_code}: {status_label}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandTag}>APOLENA ATELIER · SEGUIMIENTO EN VIVO</Text>
            <Heading style={mainHeading}>¡Tu cuadro personalizado tiene novedades!</Heading>
            <Text style={subheading}>
              Orden <strong>#{order_code}</strong> · Tracking ID: <strong>{tracking_id}</strong>
            </Text>
          </Section>

          {/* Status Box */}
          <Section style={statusBox}>
            <Text style={statusSubtitle}>ESTADO ACTUAL DEL PEDIDO</Text>
            <Text style={statusTitle}>{status_label}</Text>
            {isInTransit && (
              <Text style={statusDescription}>
                Tu lienzo está en manos de nuestro courier asignado y en ruta a tu dirección. Recuerda tener listo el 50% restante para abonar al recibirlo.
              </Text>
            )}
            {isCompleted && (
              <Text style={statusDescription}>
                ¡Esperamos que disfrutes de tu retrato en lienzo de tu mascota tanto como nosotros disfrutamos crearlo!
              </Text>
            )}
            <Button style={button} href={trackingUrl}>
              Ver Detalle y Ruta con Tracking ID
            </Button>
          </Section>

          <Section style={footerSection}>
            <Text style={footerBrand}>Apolena Atelier · Cuadros Artísticos Personalizados</Text>
            <Text style={footerLinks}>
              <Link href={`${app_url}/track/${tracking_id}`} style={footerLink}>Rastrear Pedido</Link>
              {" · "}
              <Link href={`${app_url}/terminos`} style={footerLink}>Términos</Link>
              {" · "}
              <Link href={`${app_url}/privacidad`} style={footerLink}>Privacidad</Link>
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
};

const headerSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const brandTag = {
  fontSize: "11px",
  letterSpacing: "2px",
  fontWeight: "bold",
  color: "#c6a26c",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
};

const mainHeading = {
  color: "#174B3D",
  fontFamily: 'Georgia, serif',
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 10px",
};

const subheading = {
  fontSize: "13px",
  color: "#5C5850",
  margin: "0",
};

const statusBox = {
  backgroundColor: "#174B3D",
  borderRadius: "18px",
  padding: "26px 20px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const statusSubtitle = {
  color: "#c6a26c",
  fontSize: "11px",
  letterSpacing: "1.5px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const statusTitle = {
  color: "#FFFFFF",
  fontFamily: 'Georgia, serif',
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 10px",
};

const statusDescription = {
  color: "#E8DEC8",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 18px",
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

const footerSection = {
  textAlign: "center" as const,
  marginTop: "24px",
  paddingTop: "16px",
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

export { OrderStatusUpdatedEmail };

