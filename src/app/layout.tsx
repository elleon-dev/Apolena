import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthHashListener } from "@/components/AuthHashListener";
import { JsonLd } from "@/components/JsonLd";
import { resolveAppUrl } from "@/lib/app-url";

const baseUrl = resolveAppUrl();

export const viewport: Viewport = {
  themeColor: "#174B3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Apolena Atelier — Retratos Personalizados para Mascotas en Lienzo",
    template: "%s | Apolena Atelier",
  },
  description:
    "Convierte la foto de tu perro o gato en un cuadro de museo al óleo. Impresión fine art 300 DPI sobre lienzo 100% algodón tensado en bastidor de madera de 3.5 cm. Envío a todo el Perú con 50% de adelanto y 50% contraentrega.",
  applicationName: "Apolena Atelier",
  authors: [{ name: "Apolena Atelier", url: baseUrl }],
  generator: "Next.js",
  keywords: [
    "Apolena",
    "cuadros personalizados de mascotas",
    "retratos de mascotas lima",
    "cuadros para perros",
    "cuadros para gatos",
    "lienzo bastidor mascotas",
    "arte de mascotas peru",
    "cuadro al oleo mascota",
    "regalo para amantes de perros",
    "fine art giclee mascotas",
    "cuadro personalizado lima contraentrega",
  ],
  creator: "Apolena Atelier",
  publisher: "Apolena Atelier",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: baseUrl,
    siteName: "Apolena Atelier",
    title: "Apolena Atelier — Retratos Personalizados para Mascotas en Lienzo de Museo",
    description:
      "Lienzo 100% algodón tensado a mano sobre bastidor de madera de 3.5 cm. Impresión Fine Art Giclée a 300 DPI. 50% de adelanto y saldo 50% contraentrega.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cuadros Personalizados para Mascotas Apolena Atelier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apolena Atelier — Retratos de Mascotas en Lienzo de Museo",
    description:
      "Convierte la foto de tu mascota en un retrato al óleo giclée sobre bastidor de madera. Paga el 50% de adelanto y 50% contraentrega.",
    images: ["/og-image.jpg"],
    creator: "@apolena_shop",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Kaushan+Script&family=Caveat:wght@600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <JsonLd />
      </head>
      <body className="bg-[#FFFBF2] text-[#141414] min-h-screen selection:bg-[#c6a26c]/30 selection:text-[#174B3D]">
        <AuthHashListener />
        {children}
      </body>
    </html>
  );
}
