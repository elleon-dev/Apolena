import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalizar Cuadro Artístico de Mascota en Bastidor",
  description:
    "Crea y personaliza el cuadro de tu perro o gato con inteligencia artificial al óleo. Elige medidas (S, M, L, XL), acabado en bastidor de madera de pino y añade el nombre caligráfico de tu mascota. Envío a todo el Perú.",
  alternates: {
    canonical: "/products/cuadros-personalizados",
  },
  openGraph: {
    title: "Personaliza tu Cuadro Artístico de Mascota | Apolena Atelier",
    description:
      "Lienzo 100% algodón tensado a mano sobre bastidor de madera de 3.5 cm. Impresión Fine Art Giclée a 300 DPI con preservación total de mirada.",
    url: "/products/cuadros-personalizados",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Personalizador de Cuadros Apolena Atelier",
      },
    ],
  },
};

export default function CuadrosPersonalizadosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
