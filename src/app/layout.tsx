import type { Metadata } from "next";
import "./globals.css";
import { AuthHashListener } from "@/components/AuthHashListener";

export const metadata: Metadata = {
  title: "Apolena — Estudio de Retratos Personalizados para Mascotas",
  description:
    "Estudio fotográfico digital para crear retratos realistas de todo tipo de mascotas en escenarios históricos y artísticos.",
  keywords: [
    "Apolena",
    "retratos de mascotas",
    "cuadros personalizados de mascotas",
    "fotografía de mascotas",
  ],
  icons: {
    icon: "/icon.png",
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
      </head>
      <body className="bg-[#FFFBF2] text-[#141414] min-h-screen selection:bg-[#c6a26c]/30 selection:text-[#174B3D]">
        <AuthHashListener />
        {children}
      </body>
    </html>
  );
}
