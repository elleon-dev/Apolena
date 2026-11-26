import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Sparkles, PackageSearch } from "lucide-react";

export const metadata: Metadata = {
  title: "Página no encontrada (404)",
  description:
    "La página que buscas no existe o fue movida. Regresa a Apolena para crear el retrato personalizado de tu mascota.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-xl bg-white border border-[#E8DEC8] rounded-3xl shadow-xl p-8 sm:p-12 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-xs font-bold tracking-wider uppercase">
            <span>Error 404</span>
          </div>

          <div className="space-y-3">
            <p className="font-serif text-6xl sm:text-7xl font-bold text-[#174B3D]/15 leading-none select-none">
              404
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#174B3D] leading-tight">
              No encontramos esta página
            </h1>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md mx-auto">
              Es posible que el enlace haya cambiado o que la dirección esté mal
              escrita. Puedes volver al inicio o empezar a crear el retrato de
              tu mascota ahora mismo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/products/cuadros-personalizados?step=1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#174B3D] hover:bg-[#123B30] text-white text-sm font-bold shadow-soft transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#c6a26c]" />
              <span>Crear mi retrato</span>
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#FFFBF2] hover:bg-[#F5EBD6] border border-[#E8DEC8] text-[#174B3D] text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al inicio</span>
            </Link>
          </div>

          <div className="pt-4 border-t border-[#E8DEC8]/80">
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-[#174B3D] transition-colors"
            >
              <PackageSearch className="w-3.5 h-3.5 text-[#94713F]" />
              <span>¿Buscas el estado de tu pedido? Ir a Rastreo</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
