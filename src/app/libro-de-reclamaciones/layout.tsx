import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones Virtual",
  description:
    "Libro de Reclamaciones Virtual oficial de Apolena conforme al Código de Protección y Defensa del Consumidor e INDECOPI.",
  alternates: {
    canonical: "/libro-de-reclamaciones",
  },
};

export default function LibroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
