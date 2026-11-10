"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { PackageSearch, Search, ArrowRight, ShieldCheck } from "lucide-react";

export default function TrackLookupPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackingId.trim();
    if (!clean) return;
    router.push(`/track/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full bg-white border border-[#c6a26c]/40 rounded-3xl p-8 sm:p-10 shadow-soft space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#174B3D]/10 border border-[#174B3D]/20 text-[#174B3D] flex items-center justify-center mx-auto">
            <PackageSearch className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c6a26c]/20 text-[#174B3D] text-[11px] font-bold tracking-widest uppercase border border-[#c6a26c]/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SEGUIMIENTO EN TIEMPO REAL</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#174B3D]">
              Rastrea tu Pedido
            </h1>
            <p className="text-xs sm:text-sm text-[#141414]/75 max-w-md mx-auto">
              Ingresa tu <strong>Tracking ID único</strong> (ej.{" "}
              <code>APO-2026-849201</code>) para consultar la etapa de
              fabricación y delivery de tu cuadro.
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
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] text-sm font-mono text-[#141414] focus:border-[#174B3D] focus:bg-white focus:outline-none uppercase"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span>Consultar Estado de mi Pedido</span>
              <ArrowRight className="w-4 h-4 text-[#c6a26c]" />
            </button>
          </form>

          <p className="text-[11px] text-stone-500">
            Código de muestra para probar:{" "}
            <button
              type="button"
              onClick={() => setTrackingId("APO-2026-849201")}
              className="font-mono text-primary font-bold underline hover:text-primary-700"
            >
              APO-2026-849201
            </button>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
