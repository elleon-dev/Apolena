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

export interface ClaimRegisteredAdminEmailProps {
  claim_code: string;
  consumer?: {
    name?: string;
    email?: string;
    phone?: string;
    document_type?: string;
    document_number?: string;
    address?: string;
    district?: string;
    department?: string;
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
}

export default function ClaimRegisteredAdminEmail({
  claim_code = "REC-20261110-A1B2",
  consumer = {
    name: "Valeria Mendoza",
    email: "valeria@gmail.com",
    phone: "999 888 777",
    document_type: "DNI",
    document_number: "72849102",
    address: "Av. Pardo 450",
    district: "Miraflores",
    department: "Lima",
  },
  contracted_good = {
    type: "producto",
    amount_pen: 180,
    order_code: "AP-94812",
  },
  claim_detail = {
    type: "reclamo",
    description: "Detalle...",
    consumer_request: "Pedido...",
  },
}: ClaimRegisteredAdminEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>[ALERTA INDECOPI] Hoja de {String(claim_detail.type || "").toUpperCase()} {claim_code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={badge}>INDECOPI · ATENCIÓN LEGAL OBLIGATORIA</Text>
            <Heading style={mainHeading}>Hoja de {String(claim_detail.type || "").toUpperCase()}</Heading>
            <Text style={codeText}>Código: <strong>{claim_code}</strong> · Plazo legal: <strong>15 días hábiles</strong></Text>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={cardTitle}>Datos del Reclamante</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Consumidor:</strong> {consumer.name} ({consumer.email} / {consumer.phone})</Text>
            <Text style={line}><strong>Documento:</strong> {consumer.document_type} {consumer.document_number}</Text>
            <Text style={line}><strong>Dirección:</strong> {consumer.address}, {consumer.district}, {consumer.department}</Text>
            <Text style={line}><strong>Orden asociada:</strong> {contracted_good.order_code || "No indicada"}</Text>
          </Section>

          <Section style={card}>
            <Heading as="h2" style={cardTitle}>Detalle de la Disconformidad</Heading>
            <Hr style={divider} />
            <Text style={line}><strong>Hechos:</strong> {claim_detail.description}</Text>
            <Text style={lineYellow}><strong>Pedido Concreto:</strong> {claim_detail.consumer_request}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#2C1210",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  margin: "0 auto",
  padding: "40px 10px",
};

const container = {
  backgroundColor: "#3A1715",
  borderRadius: "24px",
  border: "1px solid rgba(255,100,100,0.3)",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "32px 24px",
  color: "#FFFFFF",
};

const headerSection = {
  textAlign: "center" as const,
  marginBottom: "20px",
};

const badge = {
  backgroundColor: "rgba(255,100,100,0.2)",
  border: "1px solid #FF8080",
  color: "#FFB0B0",
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
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const codeText = {
  color: "#FFD0D0",
  fontSize: "12px",
  margin: "0",
};

const card = {
  backgroundColor: "#4A1E1B",
  borderRadius: "16px",
  border: "1px solid rgba(255,150,150,0.2)",
  padding: "16px 20px",
  marginBottom: "16px",
};

const cardTitle = {
  color: "#FFB0B0",
  fontSize: "13px",
  fontWeight: "bold",
  margin: "0 0 6px",
};

const divider = {
  borderColor: "rgba(255,150,150,0.2)",
  margin: "8px 0 10px",
};

const line = {
  fontSize: "12px",
  color: "#FFE8E8",
  margin: "4px 0",
  lineHeight: "1.5",
};

const lineYellow = {
  fontSize: "13px",
  color: "#FFF0A0",
  fontWeight: "bold",
  margin: "6px 0 0",
};

export { ClaimRegisteredAdminEmail };

