"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import {
  Frame,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
} from "lucide-react";
import type { ProductRecord } from "@/lib/db-service";

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.products)) setProducts(data.products);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-12 w-full space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-100 border border-cream-200 text-stone-700 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-terracotta-500" />
            <span>Catálogo Escalable de Productos Personalizados</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-stone-900">
            Obras personalizadas para tu mascota
          </h1>
          <p className="text-xs sm:text-base text-stone-600">
            Comenzamos con nuestros cuadros de estudio en lienzo Fine Art a 300
            DPI con marcos personalizables. Paga el 50% de adelanto y el 50%
            restante al recibir tu pedido.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-cream-200 rounded-3xl overflow-hidden shadow-soft flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] bg-cream-100 overflow-hidden">
                <img
                  src={product.images?.[0]?.url || "/samples/cat-suit.jpg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 text-stone-900 text-xs font-semibold border border-cream-200 shadow-soft">
                  Desde S/ {product.base_price.toFixed(2)} · 50% Adelanto
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-terracotta-600 text-xs font-semibold uppercase tracking-wider">
                    <Frame className="w-4 h-4" />
                    <span>Impresión Fine Art 300 DPI + Marcos</span>
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-stone-900">
                    {product.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-600" />
                    <span>
                      5 Medidas disponibles (desde 20×25 cm hasta 50×70 cm XL)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-600" />
                    <span>
                      Personalización extensible: Bastidor, Marco Roble, Negro
                      Mate o Dorado
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sage-600" />
                    <span>
                      Seguimiento con Tracking ID en 3 pasos (Fabricación → En
                      Camino → Entregado)
                    </span>
                  </div>
                </div>

                <Link
                  href="/products/cuadros-personalizados"
                  className="w-full py-4 px-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
                >
                  <span>Personalizar Cuadro con Foto de mi Mascota</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Próximos Productos Escalables Card */}
          <div className="bg-cream-100/70 border border-dashed border-cream-300 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-cream-200 text-stone-600 flex items-center justify-center shadow-soft">
              <Layers className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-white border border-cream-200 text-[11px] font-semibold text-stone-600">
              Arquitectura Lista para Escalar
            </span>
            <h3 className="font-serif text-2xl font-semibold text-stone-900">
              Próximamente más productos personalizados
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md leading-relaxed">
              Nuestra base de datos (<code>products.customization_config</code>{" "}
              y <code>order_items.customizations</code>) está diseñada para
              incorporar nuevas variantes de marcos, placas, tazas y textiles
              para mascotas sin migraciones destructivas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
