"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import Footer from "@/components/Footer";
import { OrderTrackingStepper } from "@/components/OrderTrackingStepper";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  CreditCard,
  AlertCircle,
  Frame,
  Search,
  MessageCircle,
  PackageCheck,
  CheckCircle2,
  Download,
  Lock,
} from "lucide-react";
import type { OrderRecord } from "@/lib/db-service";

export default function TrackingDetailPage({
  params,
}: {
  params: { trackingId: string };
}) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/orders/track/${encodeURIComponent(params.trackingId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          // Check mock fallback for demo IDs
          const clean = params.trackingId.trim().toUpperCase();
          if (clean.includes("849201") || clean.includes("0001")) {
            setOrder({
              id: "ord_demo_1",
              order_code: "ORD-2026-0001",
              tracking_id: "APO-2026-849201",
              status: "completed",
              payment_status: "paid_full",
              subtotal: 180,
              shipping_cost: 0,
              tax_amount: 0,
              total_amount: 180,
              advance_amount: 90,
              remaining_amount: 90,
              payment_method: "bank_transfer",
              buyer_id: "demo_buyer",
              notes: null,
              manufacturing_started_at: "2026-11-04T10:00:00Z",
              shipped_at: "2026-11-05T14:30:00Z",
              delivered_at: "2026-11-06T11:15:00Z",
              completed_at: "2026-11-06T11:20:00Z",
              created_at: "2026-11-04T09:30:00Z",
              updated_at: "2026-11-06T11:20:00Z",
              shipping: {
                id: "ship_1",
                order_id: "ord_demo_1",
                name: "Valeria Mendoza",
                phone: "999888777",
                email: "valeria@gmail.com",
                document_type: "DNI",
                document_number: "72849102",
                department: "Lima",
                province: "Lima",
                district: "Miraflores",
                address: "Av. José Larco 812, Dpto 402",
                reference: "Frente al parque Kennedy",
              },
              invoice: null,
              paymentTransactions: [],
              reviews: [],
              packages: [
                {
                  id: "pkg_1",
                  order_id: "ord_demo_1",
                  package_number: 1,
                  total_packages: 1,
                  status: "completed",
                  courier: "Olva Courier",
                  tracking_number: "TRK-01",
                  tracking_url: null,
                  carrier_phone: "987654321",
                  estimated_delivery: "2026-11-06T12:00:00Z",
                  destination_address: "Av. José Larco 812",
                  subtotal: 180,
                  items: [
                    {
                      id: "item_1",
                      package_id: "pkg_1",
                      product_id: "prod_wallart",
                      generation_job_id: null,
                      pet_photo_url: "/samples/cat-sample.jpg",
                      generated_art_url: "/samples/cat-suit.jpg",
                      unit_price: 180,
                      quantity: 1,
                      subtotal: 180,
                      status: "delivered",
                      customizations: {
                        theme_id: "inca-emperor",
                        theme_name: "Sapa Inca Imperial",
                        size_id: "lg-40x50",
                        size_label: "Grande (L) · 40 × 50 cm",
                        cm_dimensions: "40 × 50 cm",
                        dpi: 300,
                        finish_mode: "full-bleed",
                        finish_label: "Full Screen (Sin Marco)",
                        frame_id: "canvas-bastidor",
                        frame_name: "Lienzo en Bastidor de Madera",
                        frame_price_pen: 0,
                        pet_count: 1,
                        notes: null,
                      },
                    },
                  ],
                },
              ],
            });
          } else {
            setError(data.error || "Orden no encontrada.");
          }
        } else {
          setOrder(data.order);
        }
      })
      .catch(() => setError("Error consultando el seguimiento."))
      .finally(() => setIsLoading(false));
  }, [params.trackingId]);

  const item = order?.packages?.[0]?.items?.[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-8 py-10 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8DEC8] text-xs font-semibold text-[#174B3D] hover:bg-[#174B3D] hover:text-white shadow-xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Buscar otro Tracking ID</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white border border-[#E8DEC8] rounded-3xl p-12 text-center space-y-3 shadow-soft">
            <Loader2 className="w-7 h-7 animate-spin text-[#174B3D] mx-auto" />
            <p className="text-xs text-stone-500">
              Consultando estado en tiempo real para{" "}
              <strong className="font-mono text-[#174B3D]">
                {params.trackingId}
              </strong>
              ...
            </p>
          </div>
        ) : error || !order ? (
          <div className="bg-white border border-[#E8DEC8] rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-soft max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-serif text-2xl font-bold text-[#174B3D]">
                No encontramos el pedido
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                {error ||
                  "Verifica el código ingresado o consúltanos directamente por WhatsApp."}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/track"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white font-bold text-xs shadow-md transition-all"
              >
                <Search className="w-4 h-4 text-[#c6a26c]" />
                <span>Ingresar otro Tracking ID</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DEC8]">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c6a26c]/20 text-[#174B3D] text-[10px] font-bold tracking-widest uppercase border border-[#c6a26c]/40">
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>
                      Seguimiento Oficial Apolena · Orden #{order.order_code}
                    </span>
                  </div>
                  <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-[#174B3D]">
                    {order.tracking_id}
                  </h1>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="text-stone-500 block">Destinatario:</span>
                  <strong className="text-[#174B3D] text-sm">
                    {order.shipping?.name}
                  </strong>
                  <p className="text-stone-500">
                    {order.shipping?.district},{" "}
                    {order.shipping?.department || "Lima"}
                  </p>
                </div>
              </div>

              {/* 3-Step Tracking Stepper */}
              <OrderTrackingStepper
                status={order.status}
                paymentStatus={order.payment_status}
                manufacturingStartedAt={order.manufacturing_started_at}
                shippedAt={order.shipped_at}
                deliveredAt={order.delivered_at}
                completedAt={order.completed_at}
              />
            </div>

            {/* Product & Payment Split Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {item && (
                <div className="bg-white border border-[#E8DEC8] rounded-3xl p-6 shadow-soft flex items-start gap-4">
                  <img
                    src={item.generated_art_url || "/samples/cat-suit.jpg"}
                    alt="Cuadro"
                    className="w-24 h-24 rounded-2xl object-cover border border-[#E8DEC8] flex-shrink-0"
                  />
                  <div className="text-xs space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-[#94713F] font-bold">
                      <Frame className="w-3.5 h-3.5 text-[#174B3D]" />
                      <span>{item.customizations?.theme_name}</span>
                    </div>
                    <h3 className="font-serif text-sm font-bold text-[#174B3D]">
                      Cuadro Personalizado ({item.customizations?.size_label})
                    </h3>
                    <p className="text-stone-600">
                      Presentación:{" "}
                      <strong>Lienzo en Bastidor (Full Screen)</strong>
                    </p>
                    <p className="text-stone-500">
                      Listo para colgar · Algodón 100% de bellas artes
                    </p>
                    <div className="pt-1.5">
                      {order.status === "completed" &&
                      order.payment_status === "paid_full" ? (
                        <a
                          href={
                            item.customizations?.master_art_url ||
                            item.generated_art_url ||
                            "/samples/cat-suit.jpg"
                          }
                          download={`Apolena-Recuerdo-Digital-HD-${order.order_code}.png`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-[11px] font-bold shadow-xs transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-[#c6a26c]" />
                          <span>Descargar Recuerdo Digital HD</span>
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                          <Lock className="w-3 h-3 text-[#174B3D]" />
                          <span>
                            Recuerdo Digital HD se desbloquea al entregar
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#E8DEC8] rounded-3xl p-6 shadow-soft space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#174B3D]">
                  <CreditCard className="w-4 h-4 text-[#c6a26c]" />
                  <span>Estado de Pagos (Modalidad 50% / 50%)</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>1er 50% (Adelanto de Inicio):</span>
                  <span className="font-semibold text-[#174B3D]">
                    S/ {order.advance_amount.toFixed(2)} (
                    {order.payment_method.toUpperCase()})
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>2do 50% (Contraentrega al recibir):</span>
                  <span className="font-semibold text-[#141414]">
                    S/ {order.remaining_amount.toFixed(2)} ·{" "}
                    {order.payment_status === "paid_full"
                      ? "Pagado (Exitoso)"
                      : "Pendiente contraentrega"}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E8DEC8] flex items-center gap-2 text-stone-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#174B3D]" />
                  <span className="truncate">
                    Entrega en: {order.shipping?.address},{" "}
                    {order.shipping?.district}
                  </span>
                </div>
              </div>
            </div>

            {/* Assistance Banner */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DEC8] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
              <p>
                ¿Deseas coordinar un cambio en tu entrega o consultar el horario
                del repartidor?
              </p>
              <a
                href="https://wa.me/51987654321?text=Hola%20Apolena%2C%20tengo%20una%20consulta%20sobre%20mi%20orden"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-[#174B3D] hover:underline"
              >
                <MessageCircle className="w-4 h-4 text-[#c6a26c]" />
                <span>Atención por WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
