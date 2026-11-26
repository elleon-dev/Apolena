import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSharedCreationById } from "@/lib/share-storage";
import { Sparkles, ArrowRight, Frame, PawPrint } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const record = await getSharedCreationById(params.id);

  if (!record) {
    return {
      title: "Retrato Compartido · Apolena",
      description:
        "Crea el retrato artístico personalizado de tu mascota en lienzo canvas con Apolena.",
    };
  }

  const title = record.petName
    ? `${record.petName} · ${record.themeName} | Apolena`
    : `Retrato estilo ${record.themeName} | Apolena`;
  const description = record.petName
    ? `Mira el retrato estilo ${record.themeName} creado para ${record.petName} en Apolena. Sube una foto de tu mascota y crea el tuyo en segundos.`
    : `Mira este retrato estilo ${record.themeName} creado en Apolena. Sube una foto de tu mascota y descubre su obra en segundos.`;

  const isAbsoluteImage =
    record.imageUrl.startsWith("http://") ||
    record.imageUrl.startsWith("https://");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(isAbsoluteImage
        ? {
            images: [
              {
                url: record.imageUrl,
                width: 1080,
                height: record.format === "post" ? 1350 : 1920,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(isAbsoluteImage ? { images: [record.imageUrl] } : {}),
    },
  };
}

export default async function SharedCreationPage({
  params,
}: {
  params: { id: string };
}) {
  const record = await getSharedCreationById(params.id);

  if (!record) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-16 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center">
            <PawPrint className="w-8 h-8 text-[#c6a26c]" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold text-[#174B3D]">
              Este retrato ya no está disponible
            </h1>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              Los retratos compartidos se mantienen activos temporalmente.
              ¡Puedes crear el retrato personalizado de tu propia mascota ahora
              mismo!
            </p>
          </div>
          <Link
            href="/products/cuadros-personalizados"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-sm font-bold shadow-soft transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#c6a26c]" />
            <span>Crear el retrato de mi mascota</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const createSameStyleUrl = record.characterId
    ? `/products/cuadros-personalizados?character=${encodeURIComponent(record.characterId)}&step=2`
    : "/products/cuadros-personalizados";

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Columna Izquierda: Tarjeta Compartida con Marco y Nombre */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[360px] sm:max-w-[400px] rounded-3xl overflow-hidden bg-[#0E2F26] border-2 border-[#c6a26c]/40 shadow-2xl">
              <img
                src={record.imageUrl}
                alt={
                  record.petName
                    ? `Retrato ${record.themeName} de ${record.petName}`
                    : `Retrato ${record.themeName} en Apolena`
                }
                className="w-full h-auto block select-none"
              />
            </div>
          </div>

          {/* Columna Derecha: Info y CTA Viral */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#c6a26c]" />
              <span>Creación de Atelier Apolena</span>
            </div>

            <div className="space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#174B3D] leading-tight">
                {record.petName
                  ? `${record.petName} · ${record.themeName}`
                  : `Retrato · ${record.themeName}`}
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed">
                ¿Te encantó este retrato? Sube una foto de tu mascota y descubre
                en segundos cómo luciría como{" "}
                <strong className="text-stone-900">{record.themeName}</strong>{" "}
                en lienzo de tela canvas de galería.
              </p>
            </div>

            {record.frameName && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#E8DEC8] text-xs text-stone-700 shadow-2xs">
                <Frame className="w-4 h-4 text-[#c6a26c] shrink-0" />
                <span>
                  Presentación elegida:{" "}
                  <strong className="text-[#174B3D]">{record.frameName}</strong>
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 pt-2">
              <Link
                href={createSameStyleUrl}
                className="w-full py-4 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#c6a26c]" />
                <span>Probar estilo {record.themeName} con mi mascota</span>
                <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
              </Link>

              <Link
                href="/products/cuadros-personalizados"
                className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-cream-100 border border-[#E8DEC8] text-[#174B3D] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Ver todos los estilos disponibles</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
