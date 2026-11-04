"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { PackageSearch, Search, ArrowRight } from "lucide-react";

export default function TrackLookupPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("APO-2026-849201");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingId.trim();
    if (!clean) return;
    router.push(`/track/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full bg-white border border-cream-200 rounded-3xl p-8 sm:p-10 shadow-soft space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
            <PackageSearch className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
              Rastrea tu Pedido en Apolena
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Ingresa tu <strong>Tracking ID</strong> para consultar en tiempo
              real en cuál de los 3 pasos se encuentra tu cuadro personalizado
              (Fabricación, En Camino o Entregado).
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Ej. APO-2026-849201"
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-cream-50 border border-cream-200 text-sm font-mono text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
            >
              <span>Consultar Estado de mi Orden</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-stone-500">
            Código de muestra precargado:{" "}
            <button
              type="button"
              onClick={() => setTrackingId("APO-2026-849201")}
              className="font-mono text-terracotta-600 underline"
            >
              APO-2026-849201
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
