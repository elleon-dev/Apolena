import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ContactInquiryEmailProps {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export default function ContactInquiryEmail({
  name = "Carlos Díaz",
  email = "carlos@gmail.com",
  phone = "987 654 321",
  subject = "Consulta sobre cuadros dobles",
  message = "Hola, me gustaría saber si hacen cuadros con dos perros juntos en el mismo lienzo.",
}: ContactInquiryEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>[CONTACTO APOLENA] Mensaje de {name}: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={badge}>CONTACTO WEB · APOLENA ATELIER</Text>
            <Heading style={mainHeading}>Nueva Consulta de Cliente</Heading>
            <Text style={subheading}>Recibida a través del formulario de contacto del sitio web</Text>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={cardTitle}>Datos del Remitente</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Nombre:</strong> {name}</Text>
            <Text style={line}><strong>Correo:</strong> {email}</Text>
            <Text style={line}><strong>Teléfono / WhatsApp:</strong> {phone || "No especificado"}</Text>
            <Text style={line}><strong>Asunto:</strong> {subject || "Consulta general"}</Text>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={cardTitle}>Mensaje</Heading>
            <Hr style={divider} />
            <Text style={messageBox}>{message}</Text>
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
  maxWidth: "540px",
  margin: "0 auto",
  padding: "32px 24px",
  color: "#FFFFFF",
};

const headerSection = {
  textAlign: "center" as const,
  marginBottom: "20px",
};

const badge = {
  backgroundColor: "rgba(198,162,108,0.2)",
  border: "1px solid #c6a26c",
  color: "#c6a26c",
  fontSize: "11px",
  fontWeight: "bold",
  letterSpacing: "1.5px",
  padding: "5px 12px",
  borderRadius: "999px",
  display: "inline-block",
  margin: "0 0 10px",
};

const mainHeading = {
  color: "#FFFFFF",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 4px",
};

const subheading = {
  color: "#E8DEC8",
  fontSize: "12px",
  margin: "0",
};

const card = {
  backgroundColor: "#123B30",
  borderRadius: "16px",
  border: "1px solid rgba(198,162,108,0.25)",
  padding: "16px 20px",
  marginBottom: "16px",
};

const cardTitle = {
  color: "#c6a26c",
  fontSize: "13px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const divider = {
  borderColor: "rgba(198,162,108,0.2)",
  margin: "8px 0 10px",
};

const line = {
  fontSize: "12px",
  color: "#F3EDE2",
  margin: "4px 0",
  lineHeight: "1.5",
};

const messageBox = {
  fontSize: "13px",
  color: "#FFFFFF",
  lineHeight: "1.6",
  backgroundColor: "rgba(255,255,255,0.06)",
  padding: "14px",
  borderRadius: "10px",
  fontStyle: "italic",
  margin: "4px 0 0",
};

export { ContactInquiryEmail };

