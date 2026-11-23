import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apolena",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LibroReclamacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
