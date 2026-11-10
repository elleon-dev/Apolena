"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  Search,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Hammer,
  Truck,
  PackageCheck,
  AlertCircle,
  Download,
  Lock,
} from "lucide-react";
import type { OrderRecord, OrderStatus } from "@/lib/db-service";
import type { SessionUser } from "@/lib/auth";

type StatusFilter = "all" | OrderStatus;

export default function CommonUserOrdersPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingTracking, setIsSearchingTracking] = useState(false);
  const [trackingLookupError, setTrackingLookupError] = useState<string | null>(
    null,
  );
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Review state per order
  const [activeReviewOrderId, setActiveReviewOrderId] = useState<string | null>(
    null,
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);

  const loadUserOrders = async () => {
    setIsLoading(true);
    try {
      const [meRes, ordersRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);
      const meData = await meRes.json();
      const ordersData = await ordersRes.json();
      if (meData?.user) setUser(meData.user);
      if (Array.isArray(ordersData?.orders)) setOrders(ordersData.orders);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserOrders();
  }, []);

  const handleLookupByTrackingId = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toUpperCase();
    if (!clean) return;

    setTrackingLookupError(null);

    // Si ya está en la lista local, solo filtramos
    const existsLocally = orders.some(
      (o) =>
        o.tracking_id.toUpperCase() === clean ||
        o.order_code.toUpperCase() === clean,
    );
    if (existsLocally) return;

    setIsSearchingTracking(true);
    try {
      const res = await fetch(
        `/api/orders/track/${encodeURIComponent(clean)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok || !data?.order) {
        setTrackingLookupError(
          data?.error ||
            `No encontramos una orden con el Tracking ID "${clean}".`,
        );
        return;
      }
      setOrders((prev) => {
        if (prev.some((o) => o.id === data.order.id)) return prev;
        return [data.order, ...prev];
      });
    } catch {
      setTrackingLookupError("No se pudo consultar el Tracking ID.");
    } finally {
      setIsSearchingTracking(false);
    }
  };

  const handleCopyTracking = (trackingId: string) => {
    navigator.clipboard?.writeText(trackingId);
    setCopiedTrackingId(trackingId);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

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
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order : o)),
        );
        setActiveReviewOrderId(null);
        setReviewComment("");
      }
    } finally {
      setIsSavingReview(false);
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      order.tracking_id.toLowerCase().includes(q) ||
      order.order_code.toLowerCase().includes(q) ||
      order.packages?.[0]?.items?.[0]?.customizations?.theme_name
        ?.toLowerCase()
        .includes(q);
    return matchesStatus && matchesQuery;
  });

  const countByStatus = (st: OrderStatus) =>
    orders.filter((o) => o.status === st).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full space-y-8">
        {/* Top Hero & Welcome Banner */}
        <div className="bg-[#174B3D] text-white rounded-3xl p-6 sm:p-8 shadow-card border border-[#c6a26c]/35 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#c6a26c] text-xs font-semibold border border-[#c6a26c]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Seguimiento de Órdenes en Vivo ·{" "}
                  {user ? `Hola, ${user.name}` : "Consulta de Pedido"}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Mis Pedidos y Estado en 3 Pasos
              </h1>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Visualiza el avance de tu cuadro personalizado en tiempo real:{" "}
                <strong className="text-white">1. En Fabricación</strong> →{" "}
                <strong className="text-white">2. En Camino</strong> →{" "}
                <strong className="text-white">3. Entregado</strong> y cierre{" "}
                <strong className="text-[#c6a26c]">Exitoso</strong> tras el 50%
                contraentrega.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isAdmin && (
                <Link
                  href="/dashboard"
                  className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-[#c6a26c]/40 text-white text-xs font-bold inline-flex items-center gap-2 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-[#c6a26c]" />
                  <span>Ir al Dashboard Admin</span>
                </Link>
              )}

              <Link
                href="/products/cuadros-personalizados"
                className="px-5 py-3 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-2 shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Cuadro</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Buscador de Orden / Tracking ID + Filtros de Etapa */}
        <div className="bg-white border border-[#E8DEC8] rounded-3xl p-5 sm:p-6 shadow-soft space-y-4">
          <form
            onSubmit={handleLookupByTrackingId}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setTrackingLookupError(null);
                }}
                placeholder="Buscar por Tracking ID (ej. APO-TRK-2026-9001) o código de orden..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] text-xs sm:text-sm text-[#141414] placeholder:text-stone-400 focus:border-[#174B3D] focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingTracking}
              className="px-6 py-3 rounded-2xl bg-[#174B3D] hover:bg-[#134034] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shrink-0"
            >
              {isSearchingTracking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-[#c6a26c]" />
                  <span>Rastrear Tracking ID</span>
                </>
              )}
            </button>
          </form>

          {trackingLookupError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trackingLookupError}</span>
            </div>
          )}

          {/* Filtros Rápidos por Etapa con Contadores */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "all"
                  ? "bg-[#174B3D] text-white shadow-xs"
                  : "bg-[#FFFBF2] text-[#174B3D] border border-[#E8DEC8] hover:bg-[#F6EFE0]"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Todas ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("manufacturing")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "manufacturing"
                  ? "bg-[#174B3D] text-white shadow-xs"
                  : "bg-[#FFFBF2] text-[#174B3D] border border-[#E8DEC8] hover:bg-[#F6EFE0]"
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>1. En Fabricación ({countByStatus("manufacturing")})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("in_transit")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "in_transit"
                  ? "bg-[#174B3D] text-white shadow-xs"
                  : "bg-[#FFFBF2] text-[#174B3D] border border-[#E8DEC8] hover:bg-[#F6EFE0]"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>2. En Camino ({countByStatus("in_transit")})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("delivered")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "delivered"
                  ? "bg-[#174B3D] text-white shadow-xs"
                  : "bg-[#FFFBF2] text-[#174B3D] border border-[#E8DEC8] hover:bg-[#F6EFE0]"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>3. Entregado ({countByStatus("delivered")})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === "completed"
                  ? "bg-[#174B3D] text-white shadow-xs"
                  : "bg-[#FFFBF2] text-[#174B3D] border border-[#E8DEC8] hover:bg-[#F6EFE0]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Exitoso ({countByStatus("completed")})</span>
            </button>
          </div>
        </div>

        {/* Orders List with Interactive 3-Step Stepper */}
        {isLoading ? (
          <div className="bg-white border border-[#E8DEC8] rounded-3xl p-12 text-center space-y-3 shadow-soft">
            <Loader2 className="w-7 h-7 animate-spin text-[#174B3D] mx-auto" />
            <p className="text-xs font-medium text-stone-500">
              Cargando tus órdenes y estados en tiempo real...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-[#E8DEC8] rounded-3xl p-12 text-center space-y-4 shadow-soft">
            <div className="w-16 h-16 rounded-2xl bg-[#174B3D]/10 border border-[#174B3D]/20 text-[#174B3D] flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#174B3D]">
              {orders.length === 0
                ? "Aún no tienes órdenes registradas"
                : "No hay órdenes que coincidan con tu filtro"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
              {orders.length === 0
                ? "Sube la foto de tu mascota, elige un personaje artístico y encarga tu cuadro personalizado con el 50% de adelanto."
                : "Prueba seleccionando la pestaña 'Todas' o ingresa un Tracking ID diferente arriba."}
            </p>
            <div className="pt-1">
              <Link
                href="/products/cuadros-personalizados"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] text-xs sm:text-sm font-extrabold uppercase tracking-wider shadow-md transition-all"
              >
                <Frame className="w-4 h-4" />
                <span>Personalizar el Cuadro de mi Mascota</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const item = order.packages?.[0]?.items?.[0];
              const existingReview = order.reviews?.[0];
              const canReview =
                (order.status === "delivered" ||
                  order.status === "completed") &&
                !existingReview;
              const isPaidFull = order.payment_status === "paid_full";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-soft space-y-6 transition-all hover:shadow-card"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8DEC8]">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-sm font-extrabold text-[#174B3D]">
                          Orden #{order.order_code}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyTracking(order.tracking_id)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#174B3D]/10 hover:bg-[#174B3D]/15 text-[#174B3D] border border-[#174B3D]/25 font-mono font-bold transition-colors"
                          title="Copiar Tracking ID"
                        >
                          <span>Tracking: {order.tracking_id}</span>
                          {copiedTrackingId === order.tracking_id ? (
                            <Check className="w-3.5 h-3.5 text-[#174B3D]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#174B3D]" />
                          )}
                        </button>

                        {order.status === "completed" ? (
                          <span className="text-xs px-3 py-1 rounded-full bg-[#174B3D] text-white font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#c6a26c]" />
                            <span>Exitoso · 100% Pagado</span>
                          </span>
                        ) : (
                          <span className="text-xs px-3 py-1 rounded-full bg-[#c6a26c]/20 text-[#174B3D] font-semibold border border-[#c6a26c]/40">
                            50% Adelanto · 50% Contraentrega
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-500">
                        Registrada el{" "}
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
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FFFBF2] hover:bg-[#174B3D] hover:text-white border border-[#E8DEC8] text-xs font-bold text-[#174B3D] transition-all self-start sm:self-auto"
                    >
                      <span>Abrir Hoja de Seguimiento</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Stepper Visual de los 3 Pasos Logísticos + Exitoso */}
                  <OrderTrackingStepper
                    status={order.status}
                    paymentStatus={order.payment_status}
                    manufacturingStartedAt={order.manufacturing_started_at}
                    shippedAt={order.shipped_at}
                    deliveredAt={order.delivered_at}
                    completedAt={order.completed_at}
                  />

                  {/* Artwork & 50/50 Payment Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
                    {item && (
                      <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] flex flex-col sm:flex-row sm:items-center gap-4">
                        <img
                          src={
                            (order.status === "completed" &&
                            isPaidFull &&
                            item.customizations?.master_art_url)
                              ? item.customizations.master_art_url
                              : item.generated_art_url || "/samples/cat-suit.jpg"
                          }
                          alt="Retrato Personalizado"
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-[#c6a26c]/50 shrink-0 shadow-xs"
                        />
                        <div className="text-xs space-y-1.5 flex-1">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#174B3D] bg-[#c6a26c]/25 px-2.5 py-0.5 rounded-full border border-[#c6a26c]/45">
                            {item.customizations?.theme_name ||
                              "Arte Personalizado"}
                          </span>
                          <h3 className="font-serif text-lg font-bold text-[#174B3D]">
                            Cuadro Artístico Fine Art 300 DPI
                          </h3>
                          <p className="text-[#141414]/85">
                            Medida:{" "}
                            <strong>{item.customizations?.size_label}</strong> ·
                            Marco:{" "}
                            <strong>{item.customizations?.frame_name}</strong>
                          </p>
                          <p className="text-stone-500">
                            Acabado: {item.customizations?.finish_label}
                          </p>

                          {/* Recuerdo Digital HD Post-Entrega (Unlocked only when status === 'completed' & paid_full) */}
                          <div className="pt-2">
                            {order.status === "completed" && isPaidFull ? (
                              <a
                                href={
                                  item.customizations?.master_art_url ||
                                  item.generated_art_url ||
                                  "/samples/cat-suit.jpg"
                                }
                                download={`Apolena-Recuerdo-Digital-HD-${order.order_code}.png`}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-[11px] font-bold shadow-xs transition-all"
                              >
                                <Download className="w-3.5 h-3.5 text-[#c6a26c]" />
                                <span>Descargar Recuerdo Digital HD (Sin Marca de Agua)</span>
                              </a>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8DEC8] text-[11px] text-stone-600 font-medium">
                                <Lock className="w-3 h-3 text-[#174B3D]" />
                                <span>
                                  Recuerdo Digital HD sin marca se desbloquea al completar la entrega (100%)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] space-y-3 text-xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-bold text-[#174B3D] text-sm">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-[#c6a26c]" />
                            <span>Total del Pedido:</span>
                          </span>
                          <span>S/ {order.total_amount.toFixed(2)}</span>
                        </div>

                        {/* Barra de progreso de pago 50% / 100% */}
                        <div className="w-full h-2 rounded-full bg-[#E8DEC8] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPaidFull ? "w-full bg-[#174B3D]" : "w-1/2 bg-[#c6a26c]"
                            }`}
                          />
                        </div>

                        <div className="flex justify-between text-[#174B3D] font-semibold">
                          <span>
                            1er 50% Adelanto (
                            {order.payment_method.toUpperCase()}):
                          </span>
                          <span>S/ {order.advance_amount.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-[#141414]/80 font-semibold">
                          <span>2do 50% Contraentrega:</span>
                          <span
                            className={
                              isPaidFull ? "text-[#174B3D]" : "text-[#94713F]"
                            }
                          >
                            S/ {order.remaining_amount.toFixed(2)} (
                            {isPaidFull ? "Pagado" : "Al recibir en casa"})
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#E8DEC8] flex items-center gap-1.5 text-stone-600 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#174B3D] shrink-0" />
                        <span className="truncate">
                          {order.shipping?.address}, {order.shipping?.district}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reseña del Cliente */}
                  {existingReview && (
                    <div className="p-4 rounded-2xl bg-[#FFFBF2] border border-[#c6a26c]/40 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-[#c6a26c]">
                        {Array.from({ length: existingReview.rating }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="w-3.5 h-3.5 fill-current"
                            />
                          ),
                        )}
                        <span className="text-[#174B3D] font-bold ml-1.5">
                          Tu reseña verificada
                        </span>
                      </div>
                      <p className="text-[#141414]/80 italic">
                        &ldquo;{existingReview.comment}&rdquo;
                      </p>
                    </div>
                  )}

                  {canReview && (
                    <div className="pt-2 border-t border-[#E8DEC8]">
                      {activeReviewOrderId === order.id ? (
                        <div className="p-4 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#174B3D]">
                              Califica tu cuadro personalizado Apolena
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setReviewRating(num)}
                                  className="p-1 text-[#c6a26c]"
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
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8DEC8] text-[#141414] focus:border-[#174B3D] focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReviewOrderId(null)}
                              className="px-4 py-2 rounded-full border border-[#E8DEC8] text-stone-600 font-semibold"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={isSavingReview}
                              onClick={() => handleSubmitReview(order.id)}
                              className="px-5 py-2 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white font-bold"
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
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174B3D] hover:underline"
                        >
                          <Star className="w-3.5 h-3.5 text-[#c6a26c]" />
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

      <Footer />
    </div>
  );
}

