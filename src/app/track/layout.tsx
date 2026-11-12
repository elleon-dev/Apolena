import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguimiento de Pedido en Tiempo Real",
  description:
    "Rastrea el estado de fabricación, embalaje y envío de tu cuadro personalizado en Apolena con tu Tracking ID.",
  alternates: {
    canonical: "/track",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
