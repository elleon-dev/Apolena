import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos",
  description:
    "Conoce cómo protegemos y tratamos de forma confidencial tus datos personales y las fotografías de tus mascotas en Apolena Atelier.",
  alternates: {
    canonical: "/privacidad",
  },
};

export default function PrivacidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
