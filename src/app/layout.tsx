import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apolena — Estudio de Retratos Personalizados para Mascotas',
  description: 'Estudio fotográfico digital para crear retratos realistas de tus perros y gatos en escenarios históricos y artísticos.',
  keywords: ['Apolena', 'retratos de mascotas', 'cuadros de perros y gatos', 'fotografía de mascotas'],
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-cream-50 text-stone-900 min-h-screen selection:bg-terracotta-100 selection:text-terracotta-700">
        {children}
      </body>
    </html>
  );
}
