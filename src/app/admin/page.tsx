"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { OrderTrackingStepper } from "@/components/OrderTrackingStepper";
import {
  Shield,
  Hammer,
  Truck,
  PackageCheck,
  CheckCircle2,
  Mail,
  Settings,
  Loader2,
  CreditCard,
  MapPin,
  Phone,
  Frame,
  Download,
} from "lucide-react";
import type {
  OrderRecord,
  EmailQueueRecord,
  ProductRecord,
  PlatformSettingsMap,
} from "@/lib/db-service";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "emails" | "settings">(
    "orders",
  );
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [emailQueue, setEmailQueue] = useState<EmailQueueRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [settings, setSettings] = useState<PlatformSettingsMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setEmailQueue(data.emailQueue || []);
        setProducts(data.products || []);
        setSettings(data.settings || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleOrderLifecycleAction = async (
    orderId: string,
    action:
      | "verify_advance_50"
      | "set_step_manufacturing"
      | "set_step_in_transit"
      | "set_step_delivered"
      | "complete_final_50_payment"
      | "cancel_order",
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadAdminData();
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaveMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) {
      setSaveMessage(
        "Configuración de plataforma actualizada en platform_settings.",
      );
      setTimeout(() => setSaveMessage(null), 3500);
    }
  };

  const totalManufacturing = orders.filter(
    (o) => o.status === "manufacturing",
  ).length;
  const totalInTransit = orders.filter((o) => o.status === "in_transit").length;
  const totalDelivered = orders.filter((o) => o.status === "delivered").length;
  const totalCompleted = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full space-y-8">
        {/* Admin Top Header */}
        <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-terracotta-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Panel Privado de Administración · Rol: Admin</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold">
              Centro Operativo Apolena
            </h1>
            <p className="text-xs text-stone-300">
              Gestiona los 3 pasos logísticos (Fabricación → En Camino →
              Entregado), valida pagos 50%/50% y culmina órdenes en estado
              Exitoso.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-terracotta-500 text-white"
                  : "bg-white/10 text-stone-200 hover:bg-white/20"
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Órdenes ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("emails")}
              className={`px-4 py-2.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "emails"
                  ? "bg-terracotta-500 text-white"
                  : "bg-white/10 text-stone-200 hover:bg-white/20"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Cola de Emails ({emailQueue.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2.5 rounded-full font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-terracotta-500 text-white"
                  : "bg-white/10 text-stone-200 hover:bg-white/20"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Catálogo y Pagos</span>
            </button>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
            <span className="text-xs text-stone-500">1. En Fabricación</span>
            <p className="font-serif text-3xl font-bold text-stone-900 mt-1">
              {totalManufacturing}
            </p>
          </div>
          <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
            <span className="text-xs text-stone-500">2. En Camino</span>
            <p className="font-serif text-3xl font-bold text-stone-900 mt-1">
              {totalInTransit}
            </p>
          </div>
          <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
            <span className="text-xs text-stone-500">
              3. Entregados (Por cobrar 2do 50%)
            </span>
            <p className="font-serif text-3xl font-bold text-terracotta-600 mt-1">
              {totalDelivered}
            </p>
          </div>
          <div className="bg-white border border-sage-200 rounded-2xl p-5 shadow-soft">
            <span className="text-xs text-sage-700 font-semibold">
              Órdenes Exitosas (100% Pagado)
            </span>
            <p className="font-serif text-3xl font-bold text-sage-700 mt-1">
              {totalCompleted}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white border border-cream-200 rounded-3xl p-12 text-center space-y-3 shadow-soft">
            <Loader2 className="w-6 h-6 animate-spin text-terracotta-500 mx-auto" />
            <p className="text-xs text-stone-500">
              Cargando datos administrativos...
            </p>
          </div>
        ) : activeTab === "orders" ? (
          /* ================================================================= */
          /* TAB 1: GESTIÓN DE ÓRDENES, 3 PASOS LOGÍSTICOS Y PAGO 50% FINAL    */
          /* ================================================================= */
          <div className="space-y-6">
            {orders.map((order) => {
              const item = order.packages?.[0]?.items?.[0];
              const isBusy = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-stone-900">
                          {order.order_code}
                        </span>
                        <span className="text-xs font-mono px-3 py-1 rounded-full bg-cream-100 text-stone-800 border border-cream-200">
                          Tracking: {order.tracking_id}
                        </span>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            order.payment_status === "paid_full"
                              ? "bg-sage-100 text-sage-800"
                              : "bg-terracotta-50 text-terracotta-700 border border-terracotta-100"
                          }`}
                        >
                          {order.payment_status === "paid_full"
                            ? "100% Pagado (Exitoso)"
                            : order.payment_status === "partial_paid"
                              ? "50% Adelanto Verificado"
                              : "50% Adelanto Por Verificar"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Cliente: <strong>{order.shipping?.name}</strong> ·{" "}
                        {order.shipping?.email} · Tel: {order.shipping?.phone}
                      </p>
                    </div>

                    {/* Botones de Acción Rápida de los 3 Pasos + Cierre Exitoso */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handleOrderLifecycleAction(
                            order.id,
                            "set_step_manufacturing",
                          )
                        }
                        className={`px-3.5 py-2 rounded-full border font-medium flex items-center gap-1.5 transition-all ${
                          order.status === "manufacturing"
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-cream-50 text-stone-700 border-cream-200 hover:bg-cream-100"
                        }`}
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>1. Fabricación</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handleOrderLifecycleAction(
                            order.id,
                            "set_step_in_transit",
                          )
                        }
                        className={`px-3.5 py-2 rounded-full border font-medium flex items-center gap-1.5 transition-all ${
                          order.status === "in_transit"
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-cream-50 text-stone-700 border-cream-200 hover:bg-cream-100"
                        }`}
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>2. En Camino</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handleOrderLifecycleAction(
                            order.id,
                            "set_step_delivered",
                          )
                        }
                        className={`px-3.5 py-2 rounded-full border font-medium flex items-center gap-1.5 transition-all ${
                          order.status === "delivered"
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-cream-50 text-stone-700 border-cream-200 hover:bg-cream-100"
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>3. Entregado</span>
                      </button>

                      {order.status !== "completed" && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            handleOrderLifecycleAction(
                              order.id,
                              "complete_final_50_payment",
                            )
                          }
                          className="px-4 py-2 rounded-full bg-sage-600 hover:bg-sage-700 text-white font-semibold flex items-center gap-1.5 shadow-soft transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Confirmar 2do 50% (S/{" "}
                            {order.remaining_amount.toFixed(2)}) y Marcar
                            EXITOSO
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visualización de los 3 pasos */}
                  <OrderTrackingStepper
                    status={order.status}
                    paymentStatus={order.payment_status}
                    manufacturingStartedAt={order.manufacturing_started_at}
                    shippedAt={order.shipped_at}
                    deliveredAt={order.delivered_at}
                    completedAt={order.completed_at}
                  />

                  {/* Detalles de Fabricación, Delivery y Transacciones */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                    {item && (
                      <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex items-center gap-3.5">
                        <img
                          src={
                            item.generated_art_url || "/samples/cat-suit.jpg"
                          }
                          alt="Arte HD"
                          className="w-20 h-20 rounded-xl object-cover border border-cream-200 flex-shrink-0"
                        />
                        <div className="space-y-1 min-w-0">
                          <span className="text-[10px] font-semibold uppercase text-terracotta-600 block">
                            Especificación de Imprenta
                          </span>
                          <p className="font-semibold text-stone-900 truncate">
                            {item.customizations?.size_label}
                          </p>
                          <p className="text-stone-600 truncate">
                            Marco: {item.customizations?.frame_name}
                          </p>
                          <a
                            href={
                              item.generated_art_url || "/samples/cat-suit.jpg"
                            }
                            download={`Orden-${order.order_code}-300DPI.png`}
                            className="inline-flex items-center gap-1 text-terracotta-600 font-semibold hover:underline pt-0.5"
                          >
                            <Download className="w-3 h-3" />
                            <span>Descargar Arte HD</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1.5">
                      <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                        <span>Datos de Delivery</span>
                      </span>
                      <p className="text-stone-700">
                        {order.shipping?.address}, {order.shipping?.district},{" "}
                        {order.shipping?.department}
                      </p>
                      {order.shipping?.reference && (
                        <p className="text-stone-500">
                          Ref: {order.shipping.reference}
                        </p>
                      )}
                      <p className="text-stone-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{order.shipping?.phone}</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1.5">
                      <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-terracotta-500" />
                        <span>
                          Transacciones (Total: S/{" "}
                          {order.total_amount.toFixed(2)})
                        </span>
                      </span>
                      {order.paymentTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-cream-200"
                        >
                          <span>
                            {tx.payment_stage === "advance_50"
                              ? "1er 50%"
                              : "2do 50%"}{" "}
                            ({tx.payment_method.toUpperCase()}) · Op:{" "}
                            {tx.operation_number}
                          </span>
                          <span className="font-semibold text-stone-900">
                            S/ {tx.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.payment_status === "partial_pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOrderLifecycleAction(
                              order.id,
                              "verify_advance_50",
                            )
                          }
                          className="text-[11px] text-terracotta-600 font-semibold hover:underline pt-1 block"
                        >
                          ✓ Marcar adelanto del 50% como verificado
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === "emails" ? (
          /* ================================================================= */
          /* TAB 2: COLA DE CORREOS TRANSACCIONALES (email_queue)              */
          /* ================================================================= */
          <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Historial de Notificaciones en <code>email_queue</code>
            </h2>
            <p className="text-xs text-stone-500">
              Registro auditable de todos los correos enviados automáticamente
              al usuario comprador y a los administradores.
            </p>

            {emailQueue.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                Aún no hay correos encolados. Crea una orden para ver las
                notificaciones automáticas.
              </p>
            ) : (
              <div className="space-y-3">
                {emailQueue.map((mail) => (
                  <div
                    key={mail.id}
                    className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800 font-semibold text-[10px] uppercase">
                          {mail.status}
                        </span>
                        <span className="font-mono text-stone-500">
                          {mail.template}
                        </span>
                      </div>
                      <p className="font-semibold text-stone-900">
                        {mail.subject}
                      </p>
                      <p className="text-stone-600">
                        Para: <strong>{mail.to_email}</strong>
                        {mail.cc?.length > 0 && ` (CC: ${mail.cc.join(", ")})`}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-stone-400">
                      {new Date(mail.created_at).toLocaleString("es-PE")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ================================================================= */
          /* TAB 3: CATÁLOGO EXTENSIBLE Y CONFIGURACIÓN DE PLATAFORMA          */
          /* ================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extensible Product Overview */}
            <div className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-terracotta-600 text-xs font-semibold uppercase tracking-wider">
                <Frame className="w-4 h-4" />
                <span>Arquitectura Extensible de Productos</span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                Catálogo y Personalizaciones
              </h2>
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-stone-900">
                      {prod.title}
                    </strong>
                    <span className="px-2.5 py-0.5 rounded-full bg-sage-100 text-sage-800 font-medium">
                      {prod.status}
                    </span>
                  </div>
                  <p className="text-stone-600">{prod.description}</p>
                  <div className="space-y-1 pt-2 border-t border-cream-200">
                    <p className="font-semibold text-stone-800">
                      Marcos Configurados (
                      {prod.customization_config?.frames?.length || 0}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {prod.customization_config?.frames?.map((f) => (
                        <span
                          key={f.id}
                          className="px-2.5 py-1 rounded-full bg-white border border-cream-200 text-stone-700"
                        >
                          {f.name} (+S/ {f.priceModifierPen})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Settings Form */}
            {settings && (
              <form
                onSubmit={handleSaveSettings}
                className="bg-white border border-cream-200 rounded-3xl p-6 sm:p-8 shadow-soft space-y-4 text-xs"
              >
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  Cuentas Yape / Plin / Banco y Tarifas
                </h2>

                {saveMessage && (
                  <div className="p-3 rounded-xl bg-sage-50 border border-sage-200 text-sage-800 font-medium">
                    {saveMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Número Yape
                    </label>
                    <input
                      type="text"
                      value={settings.PAYMENT_METHODS_CONFIG.yape.phone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            yape: {
                              ...settings.PAYMENT_METHODS_CONFIG.yape,
                              phone: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Número Plin
                    </label>
                    <input
                      type="text"
                      value={settings.PAYMENT_METHODS_CONFIG.plin.phone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            plin: {
                              ...settings.PAYMENT_METHODS_CONFIG.plin,
                              phone: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Cuenta Bancaria BCP / CCI
                    </label>
                    <input
                      type="text"
                      value={
                        settings.PAYMENT_METHODS_CONFIG.bank_transfer
                          .account_number
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          PAYMENT_METHODS_CONFIG: {
                            ...settings.PAYMENT_METHODS_CONFIG,
                            bank_transfer: {
                              ...settings.PAYMENT_METHODS_CONFIG.bank_transfer,
                              account_number: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Delivery Lima (S/)
                    </label>
                    <input
                      type="number"
                      value={
                        settings.SHIPPING_RATES_CONFIG.lima_metropolitana_pen
                      }
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          SHIPPING_RATES_CONFIG: {
                            ...settings.SHIPPING_RATES_CONFIG,
                            lima_metropolitana_pen: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Delivery Provincias (S/)
                    </label>
                    <input
                      type="number"
                      value={settings.SHIPPING_RATES_CONFIG.provincias_pen}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          SHIPPING_RATES_CONFIG: {
                            ...settings.SHIPPING_RATES_CONFIG,
                            provincias_pen: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-soft transition-all"
                >
                  Guardar Cambios en platform_settings
                </button>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
