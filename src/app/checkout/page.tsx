"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Smartphone,
  Building2,
  Mail,
  PackageSearch,
} from "lucide-react";
import type { OrderItemCustomizations, OrderRecord } from "@/lib/db-service";

interface CheckoutDraft {
  product_id: string;
  pet_photo_url: string | null;
  generated_art_url: string;
  unit_price: number;
  customizations: OrderItemCustomizations;
}

const DEFAULT_DRAFT: CheckoutDraft = {
  product_id: "00000000-0000-4000-8000-000000000101",
  pet_photo_url: "/samples/cat-sample.jpg",
  generated_art_url: "/samples/cat-suit.jpg",
  unit_price: 215,
  customizations: {
    theme_id: "inca-emperor",
    theme_name: "Sapa Inca del Tahuantinsuyo",
    size_id: "lg-40x50",
    size_label: "Grande (L) · 40 × 50 cm",
    cm_dimensions: "40 × 50 cm",
    dpi: 300,
    finish_mode: "museum-matte",
    finish_label: "Con Paspartú de Galería",
    frame_id: "frame-oak",
    frame_name: "Marco de Madera Roble Natural",
    frame_price_pen: 35,
    pet_count: 1,
    notes: null,
  },
};

export default function CheckoutPage() {
  const [draft, setDraft] = useState<CheckoutDraft>(DEFAULT_DRAFT);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [shippingRates, setShippingRates] = useState<{
    lima_metropolitana_pen: number;
    provincias_pen: number;
  }>({
    lima_metropolitana_pen: 15,
    provincias_pen: 25,
  });

  // Contact & Delivery Location State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [docType, setDocType] = useState<"DNI" | "CE" | "RUC">("DNI");
  const [docNumber, setDocNumber] = useState("");
  const [department, setDepartment] = useState("Lima");
  const [province, setProvince] = useState("Lima");
  const [district, setDistrict] = useState("Miraflores");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  // Invoice State
  const [invoiceType, setInvoiceType] = useState<"boleta" | "factura">(
    "boleta",
  );
  const [rucNumber, setRucNumber] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxAddress, setTaxAddress] = useState("");

  // 50% Advance Payment State
  const [paymentMethod, setPaymentMethod] = useState<
    "yape" | "plin" | "bank_transfer"
  >("yape");
  const [operationNumber, setOperationNumber] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Submission & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("apolena_checkout_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.generated_art_url && parsed?.customizations) {
          setDraft(parsed);
        }
      }
    } catch {}

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.paymentMethods) setPaymentSettings(data.paymentMethods);
        if (data?.shippingRates) setShippingRates(data.shippingRates);
      })
      .catch(() => {});

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          setPhone(data.user.phone || "");
          if (data.user.address) setAddress(data.user.address);
          if (data.user.district) setDistrict(data.user.district);
          if (data.user.department) setDepartment(data.user.department);
        }
      })
      .catch(() => {});
  }, []);

  const shippingCost =
    department.trim().toLowerCase() === "lima"
      ? shippingRates.lima_metropolitana_pen
      : shippingRates.provincias_pen;

  const subtotal = draft.unit_price;
  const totalAmount = subtotal + shippingCost;
  const advance50 = Number((totalAmount * 0.5).toFixed(2));
  const remaining50 = Number((totalAmount - advance50).toFixed(2));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: draft.product_id,
          pet_photo_url: draft.pet_photo_url,
          generated_art_url: draft.generated_art_url,
          quantity: 1,
          unit_price: subtotal,
          shipping_cost: shippingCost,
          payment_method: paymentMethod,
          operation_number: operationNumber,
          proof_image_url: proofImageUrl,
          notes,
          customizations: draft.customizations,
          shipping: {
            name,
            phone,
            email,
            address,
            department,
            province,
            district,
            reference,
            document_type: docType,
            document_number: docNumber,
          },
          invoice: {
            type: invoiceType,
            doc_type: invoiceType === "factura" ? "RUC" : docType,
            number: invoiceType === "factura" ? rucNumber : docNumber,
            legal_name: invoiceType === "factura" ? legalName : name,
            tax_address: invoiceType === "factura" ? taxAddress : address,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo procesar tu orden.");
        return;
      }

      setCreatedOrder(data.order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Error de conexión al generar la orden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-10 w-full">
        {/* ===================================================================== */}
        {/* VISTA DE ÉXITO CON TRACKING ID Y CONFIRMACIÓN DE NOTIFICACIÓN EMAIL */}
        {/* ===================================================================== */}
        {createdOrder ? (
          <div className="max-w-2xl mx-auto bg-white border border-cream-200 rounded-3xl p-8 sm:p-10 shadow-card space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-sage-50 border border-sage-200 text-sage-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 text-sage-700 border border-sage-100 text-xs font-medium">
                Orden Generada · Paso 1: En Fabricación
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900">
                ¡Gracias por tu compra, {createdOrder.shipping?.name}!
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
                Hemos enviado un correo de confirmación a{" "}
                <strong className="text-stone-900">
                  {createdOrder.shipping?.email}
                </strong>{" "}
                y notificado a nuestro equipo de administradores para iniciar la
                fabricación de tu cuadro.
              </p>
            </div>

            {/* Tracking ID Card */}
            <div className="p-6 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                  Tu Código Único de Seguimiento (Tracking ID)
                </p>
                <p className="font-mono text-2xl font-bold text-terracotta-600 mt-1">
                  {createdOrder.tracking_id}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  Orden #{createdOrder.order_code} · 3 pasos: Fabricación → En
                  camino → Entregado
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(createdOrder.tracking_id)}
                className="px-4 py-2.5 rounded-full bg-white border border-cream-200 hover:border-stone-300 text-xs font-medium text-stone-800 flex items-center gap-2 shadow-soft"
              >
                {copiedText === createdOrder.tracking_id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-sage-600" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Tracking ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Payment Split Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-sage-50/60 border border-sage-100 space-y-1">
                <span className="text-sage-700 font-semibold block">
                  1er Pago Registrado (50% Adelanto)
                </span>
                <p className="text-lg font-bold text-stone-900">
                  S/ {createdOrder.advance_amount.toFixed(2)}
                </p>
                <p className="text-stone-500">
                  Método: {createdOrder.payment_method.toUpperCase()} · Op:{" "}
                  {createdOrder.paymentTransactions[0]?.operation_number}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1">
                <span className="text-stone-700 font-semibold block">
                  2do Pago Pendiente (50% Contraentrega)
                </span>
                <p className="text-lg font-bold text-stone-900">
                  S/ {createdOrder.remaining_amount.toFixed(2)}
                </p>
                <p className="text-stone-500">
                  Se abona al recibir el cuadro en tu domicilio.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex items-center gap-3 text-xs text-stone-600">
              <Mail className="w-4 h-4 text-terracotta-500 flex-shrink-0" />
              <span>
                Notificaciones registradas en{" "}
                <code className="font-mono text-stone-800">email_queue</code>{" "}
                para el comprador y los administradores de Apolena.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/track/${createdOrder.tracking_id}`}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
              >
                <PackageSearch className="w-4 h-4" />
                <span>Rastrear Orden en Vivo</span>
              </Link>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
              >
                <span>Ver en Mi Panel de Usuario</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* FORMULARIO DE CHECKOUT: DELIVERY + 50% ADELANTO (YAPE/PLIN/BANCO) */
          /* ===================================================================== */
          <form
            onSubmit={handleSubmitOrder}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left 7 Columns: Contact, Delivery Location & Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-stone-900">
                  Finalizar Orden de Compra
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-1">
                  Completa tus datos de entrega y abona el{" "}
                  <strong className="text-stone-900">50% de adelanto</strong>.
                  El otro 50% lo pagas contraentrega al recibir tu cuadro.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-700 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: DATOS DE CONTACTO Y DELIVERY */}
              <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-cream-200">
                  <MapPin className="w-4 h-4 text-terracotta-500" />
                  <h2 className="font-serif text-lg font-semibold text-stone-900">
                    1. Datos de Contacto y Ubicación de Delivery
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Valeria Mendoza"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="999 888 777"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Correo electrónico (para recibir tu Tracking ID) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Doc.
                      </label>
                      <select
                        value={docType}
                        onChange={(e) =>
                          setDocType(e.target.value as "DNI" | "CE" | "RUC")
                        }
                        className="w-full px-2.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:outline-none"
                      >
                        <option value="DNI">DNI</option>
                        <option value="CE">CE</option>
                        <option value="RUC">RUC</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        N° Documento *
                      </label>
                      <input
                        type="text"
                        required
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="72849102"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Departamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Lima"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Distrito / Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Ej. Miraflores, Surco, San Isidro"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Dirección exacta de entrega *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Av. / Calle, número, interior o departamento"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-stone-800 block">
                      Referencia de ubicación (Opcional)
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ej. Frente al parque, portón de madera..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: COMPROBANTE FISCAL (BOLETA / FACTURA) */}
              <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-terracotta-500" />
                    <h2 className="font-serif text-lg font-semibold text-stone-900">
                      2. Comprobante de Pago
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setInvoiceType("boleta")}
                      className={`px-3.5 py-1.5 rounded-full border font-medium transition-all ${
                        invoiceType === "boleta"
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-cream-50 text-stone-600 border-cream-200"
                      }`}
                    >
                      Boleta
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceType("factura")}
                      className={`px-3.5 py-1.5 rounded-full border font-medium transition-all ${
                        invoiceType === "factura"
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-cream-50 text-stone-600 border-cream-200"
                      }`}
                    >
                      Factura (RUC)
                    </button>
                  </div>
                </div>

                {invoiceType === "factura" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Número de RUC *
                      </label>
                      <input
                        type="text"
                        required
                        value={rucNumber}
                        onChange={(e) => setRucNumber(e.target.value)}
                        placeholder="20..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Razón Social *
                      </label>
                      <input
                        type="text"
                        required
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="Empresa SAC"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-stone-800 block">
                        Dirección Fiscal *
                      </label>
                      <input
                        type="text"
                        required
                        value={taxAddress}
                        onChange={(e) => setTaxAddress(e.target.value)}
                        placeholder="Dirección fiscal registrada en SUNAT"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-200 text-stone-900"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">
                    Se emitirá Boleta de Venta Electrónica con los datos de tu
                    documento ingresado arriba.
                  </p>
                )}
              </div>

              {/* STEP 3: PAGO DEL 50% DE ADELANTO (YAPE, PLIN O TRANSFERENCIA) */}
              <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-terracotta-500" />
                    <h2 className="font-serif text-lg font-semibold text-stone-900">
                      3. Pago del 50% de Adelanto (S/ {advance50.toFixed(2)})
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-terracotta-50 text-terracotta-700 border border-terracotta-100">
                    50% Hoy · 50% Contraentrega
                  </span>
                </div>

                {/* Selector de Método: Yape, Plin, Transferencia */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("yape")}
                    className={`p-3.5 rounded-2xl border font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === "yape"
                        ? "border-terracotta-500 bg-terracotta-50/40 text-stone-900 ring-1 ring-terracotta-500/20"
                        : "border-cream-200 bg-cream-50/60 text-stone-600 hover:bg-white"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-terracotta-600" />
                    <span>Yape</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("plin")}
                    className={`p-3.5 rounded-2xl border font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === "plin"
                        ? "border-terracotta-500 bg-terracotta-50/40 text-stone-900 ring-1 ring-terracotta-500/20"
                        : "border-cream-200 bg-cream-50/60 text-stone-600 hover:bg-white"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-terracotta-600" />
                    <span>Plin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`p-3.5 rounded-2xl border font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-terracotta-500 bg-terracotta-50/40 text-stone-900 ring-1 ring-terracotta-500/20"
                        : "border-cream-200 bg-cream-50/60 text-stone-600 hover:bg-white"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-terracotta-600" />
                    <span>Transferencia</span>
                  </button>
                </div>

                {/* Instrucciones dinámicas desde platform_settings */}
                <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-2 text-xs">
                  {paymentMethod === "yape" && (
                    <>
                      <p className="font-semibold text-stone-900">
                        Yapea S/ {advance50.toFixed(2)} al número oficial de
                        Apolena:
                      </p>
                      <p className="font-mono text-base font-bold text-terracotta-600">
                        {paymentSettings?.yape?.phone || "987 654 321"}
                      </p>
                      <p className="text-stone-500">
                        Titular:{" "}
                        {paymentSettings?.yape?.holder_name ||
                          "APOLENA STUDIO SAC"}
                      </p>
                    </>
                  )}

                  {paymentMethod === "plin" && (
                    <>
                      <p className="font-semibold text-stone-900">
                        Envía por Plin S/ {advance50.toFixed(2)} al número
                        oficial de Apolena:
                      </p>
                      <p className="font-mono text-base font-bold text-terracotta-600">
                        {paymentSettings?.plin?.phone || "987 654 321"}
                      </p>
                      <p className="text-stone-500">
                        Titular:{" "}
                        {paymentSettings?.plin?.holder_name ||
                          "APOLENA STUDIO SAC"}
                      </p>
                    </>
                  )}

                  {paymentMethod === "bank_transfer" && (
                    <>
                      <p className="font-semibold text-stone-900">
                        Transfiere S/ {advance50.toFixed(2)} a nuestra cuenta{" "}
                        {paymentSettings?.bank_transfer?.bank_name ||
                          "BCP Soles"}
                        :
                      </p>
                      <p className="font-mono text-xs text-stone-800">
                        Cuenta:{" "}
                        <strong>
                          {paymentSettings?.bank_transfer?.account_number ||
                            "191-98451234-0-42"}
                        </strong>
                      </p>
                      <p className="font-mono text-xs text-stone-800">
                        CCI:{" "}
                        <strong>
                          {paymentSettings?.bank_transfer?.cci ||
                            "002-191009845123404251"}
                        </strong>
                      </p>
                      <p className="text-stone-500">
                        Titular:{" "}
                        {paymentSettings?.bank_transfer?.holder_name ||
                          "APOLENA STUDIO SAC"}
                      </p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      Número de Operación / Confirmación del 50% *
                    </label>
                    <input
                      type="text"
                      required
                      value={operationNumber}
                      onChange={(e) => setOperationNumber(e.target.value)}
                      placeholder="Ej. 0492819"
                      className="w-full px-3.5 py-3 rounded-xl bg-cream-50 border border-cream-200 text-stone-900 font-mono focus:border-terracotta-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      Captura del Voucher (Opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) =>
                          setProofImageUrl(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-cream-200 text-stone-600 text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Order Summary & 50/50 Split Breakdown */}
            <div className="lg:col-span-5 space-y-5 sticky top-28">
              <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft space-y-5">
                <h3 className="font-serif text-xl font-semibold text-stone-900">
                  Resumen de tu Cuadro Personalizado
                </h3>

                <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-cream-50 border border-cream-200">
                  <img
                    src={draft.generated_art_url}
                    alt="Retrato seleccionado"
                    className="w-24 h-24 rounded-xl object-cover border border-cream-200 flex-shrink-0"
                  />
                  <div className="text-xs space-y-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta-600">
                      {draft.customizations.theme_name}
                    </span>
                    <h4 className="font-semibold text-stone-900">
                      Cuadro Artístico Personalizado
                    </h4>
                    <p className="text-stone-600">
                      Medida: <strong>{draft.customizations.size_label}</strong>
                    </p>
                    <p className="text-stone-600">
                      Marco: <strong>{draft.customizations.frame_name}</strong>
                    </p>
                    <p className="text-stone-500">
                      Acabado: {draft.customizations.finish_label}
                    </p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-2.5 text-xs pt-2 border-t border-cream-200">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Cuadro + Marco</span>
                    <span className="font-medium text-stone-900">
                      S/ {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Delivery ({department})</span>
                    <span className="font-medium text-stone-900">
                      S/ {shippingCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-cream-200">
                    <span>Total de la Orden</span>
                    <span>S/ {totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* 50% / 50% Highlight Box */}
                <div className="p-4 rounded-2xl bg-terracotta-50/60 border border-terracotta-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-terracotta-700 text-sm">
                    <span>Adelanto hoy (50%):</span>
                    <span>S/ {advance50.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Saldo 50% Contraentrega:</span>
                    <span className="font-semibold">
                      S/ {remaining50.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-soft transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando Orden y Tracking ID...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Confirmar Orden y Adelanto 50% (S/{" "}
                        {advance50.toFixed(2)})
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-stone-500 text-center">
                  <ShieldCheck className="w-4 h-4 text-sage-600 flex-shrink-0" />
                  <span>
                    Recibirás tu <strong>Tracking ID</strong> por correo y en tu
                    panel para seguir los 3 pasos (Fabricación → En camino →
                    Entregado).
                  </span>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
