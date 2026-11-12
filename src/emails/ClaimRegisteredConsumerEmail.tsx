import * as React from "react";
import {
  Body,
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

export interface ClaimRegisteredConsumerEmailProps {
  claim_code: string;
  consumer?: {
    name?: string;
    document_type?: string;
    document_number?: string;
  };
  contracted_good?: {
    type?: string;
    amount_pen?: number;
    order_code?: string;
  };
  claim_detail?: {
    type?: string;
    description?: string;
    consumer_request?: string;
  };
  app_url?: string;
}

export default function ClaimRegisteredConsumerEmail({
  claim_code = "REC-20261110-A1B2",
  consumer = {
    name: "Valeria Mendoza",
    document_type: "DNI",
    document_number: "72849102",
  },
  contracted_good = {
    type: "producto",
    amount_pen: 180,
    order_code: "AP-94812",
  },
  claim_detail = {
    type: "reclamo",
    description: "Detalle de los hechos...",
    consumer_request: "Pedido del consumidor...",
  },
  app_url = "https://apolena.pe",
}: ClaimRegisteredConsumerEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Constancia de Hoja de Reclamación: {claim_code} · Apolena Atelier</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandTag}>LIBRO DE RECLAMACIONES VIRTUAL</Text>
            <Heading style={mainHeading}>Constancia de Reclamación</Heading>
            <Text style={subheading}>
              Conforme a la Ley N° 29571 (Código de Protección y Defensa del Consumidor del Perú) y el D.S. N° 011-2011-PCM.
            </Text>
          </Section>

          <Section style={codeBox}>
            <Text style={codeLabel}>CÓDIGO ÚNICO DE RECLAMACIÓN</Text>
            <Text style={codeValue}>{claim_code}</Text>
            <Text style={codeDeadline}>Plazo de respuesta legal: <strong>15 días hábiles</strong></Text>
          </Section>

          <Section style={infoCard}>
            <Heading as="h2" style={cardTitle}>Datos del Consumidor Reclamante</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Nombre:</strong> {consumer.name}</Text>
            <Text style={line}><strong>Documento:</strong> {consumer.document_type} {consumer.document_number}</Text>
            <Text style={line}><strong>Tipo:</strong> {String(claim_detail.type || "").toUpperCase()}</Text>
            {contracted_good.order_code && (
              <Text style={line}><strong>Código de Orden:</strong> {contracted_good.order_code}</Text>
            )}
          </Section>

          <Section style={infoCard}>
            <Heading as="h2" style={cardTitle}>Detalle y Pedido Concreto</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Hechos:</strong> {claim_detail.description}</Text>
            <Text style={lineGold}><strong>Pedido concreto:</strong> {claim_detail.consumer_request}</Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerBrand}>APOLENA STUDIO S.A.C. · RUC 20612345678</Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Apolena. Todos los derechos reservados.
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
  marginBottom: "20px",
};

const brandTag = {
  fontSize: "11px",
  letterSpacing: "2px",
  fontWeight: "bold",
  color: "#c6a26c",
  margin: "0 0 8px",
};

const mainHeading = {
  color: "#174B3D",
  fontFamily: 'Georgia, serif',
  fontSize: "22px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const subheading = {
  fontSize: "12px",
  color: "#6B665C",
  lineHeight: "1.5",
  margin: "0",
};

const codeBox = {
  backgroundColor: "#174B3D",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center" as const,
  margin: "20px 0",
};

const codeLabel = {
  color: "#c6a26c",
  fontSize: "10px",
  letterSpacing: "1.5px",
  fontWeight: "bold",
  margin: "0 0 4px",
};

const codeValue = {
  color: "#FFFFFF",
  fontFamily: 'Courier, monospace',
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const codeDeadline = {
  color: "#E8DEC8",
  fontSize: "12px",
  margin: "0",
};

const infoCard = {
  backgroundColor: "#FFFBF2",
  borderRadius: "16px",
  border: "1px solid #E8DEC8",
  padding: "16px 20px",
  marginBottom: "16px",
};

const cardTitle = {
  color: "#174B3D",
  fontSize: "13px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const divider = {
  borderColor: "#E8DEC8",
  margin: "8px 0 10px",
};

const line = {
  fontSize: "12px",
  color: "#333",
  margin: "4px 0",
  lineHeight: "1.5",
};

const lineGold = {
  fontSize: "12px",
  color: "#174B3D",
  fontWeight: "bold",
  margin: "6px 0 0",
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
  margin: "0 0 4px",
};

const footerCopyright = {
  fontSize: "10px",
  color: "#A09B90",
  margin: "0",
};

export { ClaimRegisteredConsumerEmail };

