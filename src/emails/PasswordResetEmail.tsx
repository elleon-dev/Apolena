import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface PasswordResetEmailProps {
  name: string;
  reset_url: string;
  app_url?: string;
}

export default function PasswordResetEmail({
  name = "Valeria",
  reset_url = "https://apolena.pe/auth/reset-password?token=sample",
  app_url = "https://apolena.pe",
}: PasswordResetEmailProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>Recuperación de contraseña en Apolena Atelier</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={brandTag}>APOLENA ATELIER · SEGURIDAD</Text>
            <Heading style={mainHeading}>Restablece tu Contraseña</Heading>
            <Text style={subheading}>
              Hola {name || "estimado cliente"}, recibimos una solicitud para restablecer la contraseña de tu cuenta en Apolena.
            </Text>
          </Section>

          <Section style={actionBox}>
            <Text style={boxText}>
              Haz clic en el siguiente botón para elegir una nueva contraseña. Por tu seguridad, este enlace es de uso único y expira en <strong>60 minutos</strong>:
            </Text>
            <Button style={button} href={reset_url}>
              Restablecer mi Contraseña
            </Button>
          </Section>

          <Section style={noticeSection}>
            <Text style={noticeText}>
              Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu cuenta y contraseña actual permanecerán intactas.
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerBrand}>Apolena Atelier · Cuadros Artísticos Personalizados</Text>
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
  maxWidth: "540px",
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
  color: "#4A463F",
  lineHeight: "1.6",
  margin: "0",
};

const actionBox = {
  backgroundColor: "#FFFBF2",
  borderRadius: "18px",
  border: "1px solid #E8DEC8",
  padding: "26px 20px",
  textAlign: "center" as const,
  margin: "20px 0",
};

const boxText = {
  fontSize: "13px",
  color: "#4A463F",
  lineHeight: "1.6",
  margin: "0 0 18px",
};

const button = {
  backgroundColor: "#174B3D",
  borderRadius: "999px",
  color: "#FFFBF2",
  fontSize: "13px",
  fontWeight: "bold",
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid #c6a26c",
};

const noticeSection = {
  backgroundColor: "#FAFAF8",
  borderRadius: "12px",
  padding: "12px 16px",
  margin: "16px 0",
};

const noticeText = {
  fontSize: "11px",
  color: "#8A857A",
  lineHeight: "1.5",
  margin: "0",
  textAlign: "center" as const,
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

export { PasswordResetEmail };

