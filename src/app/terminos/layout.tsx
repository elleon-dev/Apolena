import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y condiciones del servicio de creación, fabricación artesanal y entrega de retratos de mascotas en Apolena Atelier.",
  alternates: {
    canonical: "/terminos",
  },
};

export default function TerminosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
