"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { OrderTrackingStepper } from "@/components/OrderTrackingStepper";
import {
  Package,
  Plus,
  ExternalLink,
  CreditCard,
  MapPin,
  Star,
  Loader2,
  CheckCircle2,
  Frame,
} from "lucide-react";
import type { OrderRecord } from "@/lib/db-service";
import type { SessionUser } from "@/lib/auth";

export default function UserDashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review state per order
  const [activeReviewOrderId, setActiveReviewOrderId] = useState<string | null>(
    null,
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [meRes, ordersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/orders"),
      ]);
      const meData = await meRes.json();
      const ordersData = await ordersRes.json();
      if (meData?.user) setUser(meData.user);
      if (Array.isArray(ordersData?.orders)) setOrders(ordersData.orders);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSubmitReview = async (orderId: string) => {
    if (!reviewComment.trim()) return;
    setIsSavingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setActiveReviewOrderId(null);
        setReviewComment("");
        await loadDashboard();
      }
    } finally {
      setIsSavingReview(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full space-y-8">
        {/* Top Welcome Banner */}
        <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-100 border border-cream-200 text-stone-700 text-xs font-medium">
              Panel Privado de Cliente
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              Hola, {user?.name || "Amante de las Mascotas"}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Desde aquí puedes seguir el estado de tus órdenes en sus 3 pasos
              (Fabricación, En Camino, Entregado) y consultar tu Tracking ID.
            </p>
          </div>

          <Link
            href="/products/personalized-wall-Art"
            className="px-5 py-3 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-soft transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Cuadro Personalizado</span>
          </Link>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="bg-white border border-cream-200 rounded-3xl p-12 text-center space-y-3 shadow-soft">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta-500 mx-auto" />
            <p className="text-xs text-stone-500">Cargando tus órdenes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-cream-200 rounded-3xl p-12 text-center space-y-4 shadow-soft">
            <Package className="w-10 h-10 text-stone-400 mx-auto" />
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Aún no tienes órdenes registradas
            </h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Sube la foto de tu mascota, elige un personaje o temática y genera
              tu primer cuadro personalizado con IA.
            </p>
            <Link
              href="/products/personalized-wall-Art"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow-soft"
            >
              <Frame className="w-4 h-4" />
              <span>Ir al Estudio de Retratos</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Mis Órdenes y Seguimiento ({orders.length})
            </h2>

            {orders.map((order) => {
              const item = order.packages?.[0]?.items?.[0];
              const existingReview = order.reviews?.[0];
              const canReview =
                (order.status === "delivered" ||
                  order.status === "completed") &&
                !existingReview;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6"
                >
                  {/* Order Top Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cream-200">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">
                          Orden #{order.order_code}
                        </span>
                        <span className="text-xs px-3 py-1 rounded-full bg-terracotta-50 text-terracotta-700 border border-terracotta-100 font-mono font-semibold">
                          Tracking ID: {order.tracking_id}
                        </span>
                        {order.status === "completed" && (
                          <span className="text-xs px-3 py-1 rounded-full bg-sage-600 text-white font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Exitoso</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">
                        Creada el{" "}
                        {new Date(order.created_at).toLocaleDateString(
                          "es-PE",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    <Link
                      href={`/track/${order.tracking_id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cream-50 hover:bg-cream-100 border border-cream-200 text-xs font-medium text-stone-800 transition-colors self-start sm:self-auto"
                    >
                      <span>Vista Pública de Tracking</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
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

                  {/* Artwork & 50/50 Payment Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                    {item && (
                      <div className="lg:col-span-7 p-4 rounded-2xl bg-cream-50 border border-cream-200 flex items-center gap-4">
                        <img
                          src={
                            item.generated_art_url || "/samples/cat-suit.jpg"
                          }
                          alt="Retrato"
                          className="w-24 h-24 rounded-xl object-cover border border-cream-200 flex-shrink-0"
                        />
                        <div className="text-xs space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta-600">
                            {item.customizations?.theme_name}
                          </span>
                          <h3 className="font-serif text-base font-semibold text-stone-900">
                            Cuadro Artístico Personalizado
                          </h3>
                          <p className="text-stone-600">
                            Medida:{" "}
                            <strong>{item.customizations?.size_label}</strong> ·
                            Marco:{" "}
                            <strong>{item.customizations?.frame_name}</strong>
                          </p>
                          <p className="text-stone-500">
                            Acabado: {item.customizations?.finish_label}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="lg:col-span-5 p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-stone-900">
                        <span className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-terracotta-500" />
                          <span>Total Orden:</span>
                        </span>
                        <span>S/ {order.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sage-700 font-medium">
                        <span>1er 50% (Adelanto {order.payment_method.toUpperCase()}):</span>
                        <span>S/ {order.advance_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-stone-700 font-medium">
                        <span>2do 50% (Contraentrega):</span>
                        <span>
                          S/ {order.remaining_amount.toFixed(2)} (
                          {order.payment_status === "paid_full"
                            ? "Pagado"
                            : "Al recibir"}
                          )
                        </span>
                      </div>
                      <div className="pt-1.5 border-t border-cream-200 flex items-center gap-1.5 text-stone-500 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {order.shipping?.address}, {order.shipping?.district}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Section */}
                  {existingReview && (
                    <div className="p-4 rounded-2xl bg-sage-50/60 border border-sage-100 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-terracotta-500">
                        {Array.from({ length: existingReview.rating }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="w-3.5 h-3.5 fill-current"
                            />
                          ),
                        )}
                        <span className="text-stone-700 font-semibold ml-1.5">
                          Tu reseña verificada
                        </span>
                      </div>
                      <p className="text-stone-600 italic">
                        &ldquo;{existingReview.comment}&rdquo;
                      </p>
                    </div>
                  )}

                  {canReview && (
                    <div className="pt-2 border-t border-cream-200">
                      {activeReviewOrderId === order.id ? (
                        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-900">
                              Califica tu cuadro personalizado Apolena
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setReviewRating(num)}
                                  className="p-1 text-terracotta-500"
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      num <= reviewRating ? "fill-current" : ""
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="¿Qué te pareció la calidad del lienzo y el retrato de tu mascota?"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-200 text-stone-900"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReviewOrderId(null)}
                              className="px-4 py-2 rounded-full border border-cream-200 text-stone-600"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={isSavingReview}
                              onClick={() => handleSubmitReview(order.id)}
                              className="px-5 py-2 rounded-full bg-stone-900 text-white font-medium"
                            >
                              {isSavingReview
                                ? "Guardando..."
                                : "Publicar Reseña"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveReviewOrderId(order.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:underline"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Dejar una reseña sobre mi pedido</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
