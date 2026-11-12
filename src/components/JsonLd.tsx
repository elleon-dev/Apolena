import React from "react";
import { resolveAppUrl } from "@/lib/app-url";

export function JsonLd() {
  const baseUrl = resolveAppUrl();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Apolena Atelier",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    image: `${baseUrl}/og-image.jpg`,
    description:
      "Atelier digital de retratos artísticos personalizados para perros, gatos y mascotas sobre lienzo de museo tensado a mano.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lima",
      addressRegion: "Lima",
      addressCountry: "PE",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+51-978-323-984",
      contactType: "customer service",
      areaServed: "PE",
      availableLanguage: ["Spanish"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "Apolena — Retratos Personalizados para Mascotas",
    description:
      "Transforma la foto de tu mascota en un cuadro de museo al óleo elaborado en lienzo de tela canvas tensado en bastidor de madera.",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    inLanguage: "es-PE",
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/products/cuadros-personalizados#product`,
    name: "Cuadro Artístico Personalizado para Mascotas en Lienzo de Bastidor",
    image: [
      `${baseUrl}/og-image.jpg`,
      `${baseUrl}/banners/canvas-living-room.jpg`,
    ],
    description:
      "Lienzo 100% algodón de 380 g/m² tensado a mano sobre bastidor de madera de pino de 3.5 cm. Impresión Fine Art Giclée a 300 DPI con preservación total de color y autógrafo personalizado.",
    brand: {
      "@type": "Brand",
      name: "Apolena Atelier",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PEN",
      lowPrice: "90.00",
      highPrice: "280.00",
      offerCount: "4",
      offers: [
        {
          "@type": "Offer",
          name: "Cuadro Chico (S) · 20 × 25 cm",
          price: "90.00",
          priceCurrency: "PEN",
          availability: "https://schema.org/InStock",
          url: `${baseUrl}/products/cuadros-personalizados`,
        },
        {
          "@type": "Offer",
          name: "Cuadro Mediano (M) · 30 × 40 cm",
          price: "140.00",
          priceCurrency: "PEN",
          availability: "https://schema.org/InStock",
          url: `${baseUrl}/products/cuadros-personalizados`,
        },
        {
          "@type": "Offer",
          name: "Cuadro Grande (L) · 40 × 50 cm",
          price: "195.00",
          priceCurrency: "PEN",
          availability: "https://schema.org/InStock",
          url: `${baseUrl}/products/cuadros-personalizados`,
        },
        {
          "@type": "Offer",
          name: "Cuadro Extra Grande (XL) · 60 × 80 cm",
          price: "280.00",
          priceCurrency: "PEN",
          availability: "https://schema.org/InStock",
          url: `${baseUrl}/products/cuadros-personalizados`,
        },
      ],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "128",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
    </>
  );
}
