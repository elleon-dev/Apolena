"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { OrderTrackingStepper } from "@/components/OrderTrackingStepper";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  CreditCard,
  AlertCircle,
  Frame,
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
          setError(data.error || "Orden no encontrada.");
        } else {
          setOrder(data.order);
        }
      })
      .catch(() => setError("Error consultando el seguimiento."))
      .finally(() => setIsLoading(false));
  }, [params.trackingId]);

  const item = order?.packages?.[0]?.items?.[0];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-8 py-10 w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cream-200 text-xs font-medium text-stone-700 hover:text-stone-900 shadow-soft"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Buscar otro Tracking ID</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white border border-cream-200 rounded-3xl p-12 text-center space-y-3 shadow-soft">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta-500 mx-auto" />
            <p className="text-xs text-stone-500">
              Consultando estado en tiempo real para{" "}
              <strong className="font-mono">{params.trackingId}</strong>...
            </p>
          </div>
        ) : error || !order ? (
          <div className="bg-white border border-cream-200 rounded-3xl p-8 text-center space-y-4 shadow-soft">
            <AlertCircle className="w-8 h-8 text-terracotta-500 mx-auto" />
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              No encontramos el pedido
            </h2>
            <p className="text-xs text-stone-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cream-200">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                    Seguimiento en 3 Pasos · Orden #{order.order_code}
                  </span>
                  <h1 className="font-mono text-2xl sm:text-3xl font-bold text-terracotta-600 mt-1">
                    {order.tracking_id}
                  </h1>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="text-stone-500 block">Destinatario:</span>
                  <strong className="text-stone-900 text-sm">
                    {order.shipping?.name}
                  </strong>
                  <p className="text-stone-500">
                    {order.shipping?.district}, {order.shipping?.department}
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
                <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft flex items-start gap-4">
                  <img
                    src={item.generated_art_url || "/samples/cat-suit.jpg"}
                    alt="Cuadro"
                    className="w-24 h-24 rounded-2xl object-cover border border-cream-200 flex-shrink-0"
                  />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-terracotta-600 font-semibold">
                      <Frame className="w-3.5 h-3.5" />
                      <span>{item.customizations?.theme_name}</span>
                    </div>
                    <h3 className="font-serif text-base font-semibold text-stone-900">
                      Cuadro Personalizado ({item.customizations?.size_label})
                    </h3>
                    <p className="text-stone-600">
                      Marco: <strong>{item.customizations?.frame_name}</strong>
                    </p>
                    <p className="text-stone-500">
                      Acabado: {item.customizations?.finish_label}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-stone-900">
                  <CreditCard className="w-4 h-4 text-terracotta-500" />
                  <span>Estado de Pagos (Modalidad 50% / 50%)</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>1er 50% (Adelanto):</span>
                  <span className="font-semibold text-sage-700">
                    S/ {order.advance_amount.toFixed(2)} (
                    {order.payment_method.toUpperCase()})
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>2do 50% (Contraentrega al recibir):</span>
                  <span className="font-semibold text-stone-900">
                    S/ {order.remaining_amount.toFixed(2)} ·{" "}
                    {order.payment_status === "paid_full"
                      ? "PAGADO (Exitoso)"
                      : "Pendiente contraentrega"}
                  </span>
                </div>
                <div className="pt-2 border-t border-cream-200 flex items-center gap-2 text-stone-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Entrega en: {order.shipping?.address},{" "}
                    {order.shipping?.district}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
