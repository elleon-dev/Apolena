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
  Gift,
  Truck,
  ExternalLink,
  Eye,
  X,
} from "lucide-react";
import type { OrderRecord } from "@/lib/db-service";
import { parseDeliveryPinFromOrder } from "@/lib/delivery-location";
import {
  CANVAS_WRAP_BLEED_CM,
  exportPrintReadyImage,
  exportWatermarkedPreviewImage,
  resolvePrintBleedSpec,
} from "@/lib/print-export";

export default function TrackingDetailPage({
  params,
}: {
  params: { trackingId: string };
}) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [canDownloadHdMaster, setCanDownloadHdMaster] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [downloadingPreview, setDownloadingPreview] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const handleDownloadWatermarkedPreview = async (order: OrderRecord) => {
    const item = order.packages?.[0]?.items?.[0];
    if (!item) return;
    const previewSrc = item.generated_art_url || "/samples/cat-suit.jpg";
    const themeName = item.customizations?.theme_name || "Apolena";
    const petName =
      (item.customizations?.pet_inscription?.enabled &&
        item.customizations?.pet_inscription?.pet_name?.trim()) ||
      item.customizations?.pet_name?.trim() ||
      null;

    setDownloadingPreview(true);
    try {
      const exported = await exportWatermarkedPreviewImage(
        previewSrc,
        themeName,
        petName,
      );
      const link = document.createElement("a");
      link.href = exported.dataUrl;
      link.download = `Apolena-Muestra-${order.order_code}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(previewSrc, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingPreview(false);
    }
  };

  const handleDownloadMemoryHd = async (order: OrderRecord) => {
    const item = order.packages?.[0]?.items?.[0];
    if (!item) return;
    const imageSrc =
      item.customizations?.master_art_url ||
      item.generated_art_url ||
      "/samples/cat-suit.jpg";
    const bleedSpec = resolvePrintBleedSpec(
      {
        sizeId: item.customizations?.size_id,
        cmDimensions:
          item.customizations?.cm_dimensions || item.customizations?.size_label,
      },
      0,
    );
    const inscriptionName = item.customizations?.pet_inscription?.enabled
      ? item.customizations?.pet_inscription?.pet_name?.trim() || null
      : null;
    setDownloadingOrderId(order.id);
    try {
      const exported = await exportPrintReadyImage(
        imageSrc,
        bleedSpec.preset,
        item.customizations?.finish_mode === "museum-matte"
          ? "museum-matte"
          : "full-bleed",
        0,
        inscriptionName,
      );
      const link = document.createElement("a");
      link.href = exported.blob
        ? URL.createObjectURL(exported.blob)
        : exported.dataUrl;
      link.download = `Apolena-Recuerdo-Digital-HD-${order.order_code}-${bleedSpec.faceWidthCm}x${bleedSpec.faceHeightCm}cm.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (exported.blob) setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    } catch {
      window.open(imageSrc, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingOrderId(null);
    }
  };

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
              subtotal: 160,
              shipping_cost: 0,
              tax_amount: 0,
              total_amount: 160,
              advance_amount: 80,
              remaining_amount: 80,
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
                  subtotal: 160,
                  items: [
                    {
                      id: "item_1",
                      package_id: "pkg_1",
                      product_id: "prod_wallart",
                      generation_job_id: null,
                      pet_photo_url: "/samples/cat-sample.jpg",
                      generated_art_url: "/samples/cat-suit.jpg",
                      unit_price: 160,
                      quantity: 1,
                      subtotal: 160,
                      status: "delivered",
                      customizations: {
                        theme_id: "inca-emperor",
                        theme_name: "Sapa Inca Imperial",
                        size_id: "size-20x30",
                        size_label: "Pequeño (S) · 20 × 30 cm",
                        cm_dimensions: "20 × 30 cm",
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
          setIsOwner(Boolean(data.isOwner));
          setCanDownloadHdMaster(Boolean(data.canDownloadHdMaster));
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

              {/* Courier & Despacho Badge / Card */}
              {order.packages?.[0]?.courier && (
                <div className="pt-4 border-t border-[#E8DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#174B3D]/10 text-[#174B3D] flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-[#174B3D]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94713F] block">
                        Operador de Despacho
                      </span>
                      <strong className="text-sm text-[#174B3D]">
                        {order.packages[0].courier}
                      </strong>
                      {order.packages[0].tracking_number && (
                        <p className="text-stone-600 font-mono text-[11px]">
                          Guía / Código de Envío:{" "}
                          <strong>{order.packages[0].tracking_number}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.packages[0].tracking_url && (
                      <a
                        href={order.packages[0].tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-[11px] font-bold shadow-xs transition-all"
                      >
                        <span>Rastrear en Courier</span>
                        <ExternalLink className="w-3 h-3 text-[#c6a26c]" />
                      </a>
                    )}
                    {order.packages[0].carrier_phone && (
                      <span className="text-[11px] text-stone-600 bg-white px-3 py-1.5 rounded-full border border-[#E8DEC8]">
                        Contacto: {order.packages[0].carrier_phone}
                      </span>
                    )}
                    {order.packages[0].estimated_delivery && (
                      <span className="text-[11px] text-[#174B3D] bg-white px-3 py-1.5 rounded-full border border-[#E8DEC8] font-medium">
                        Entrega estimada:{" "}
                        {new Date(
                          order.packages[0].estimated_delivery,
                        ).toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Product & Payment Split Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {item && (
                <div className="bg-white border border-[#E8DEC8] rounded-3xl p-6 shadow-soft flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    title="Ver muestra con marca de agua"
                    className="group relative w-24 h-24 rounded-2xl overflow-hidden border border-[#E8DEC8] flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#174B3D]"
                  >
                    <img
                      src={item.generated_art_url || "/samples/cat-suit.jpg"}
                      alt="Cuadro"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-white/95 text-[#174B3D] flex items-center justify-center shadow-sm">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                  <div className="text-xs space-y-1.5 min-w-0 flex-1">
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
                    {item.customizations?.dedication_note && (
                      <p className="text-[#174B3D] bg-[#F7EFE0] p-2 rounded-xl border border-[#EDE0C4] text-[11px] font-medium flex items-start gap-1.5 mt-1">
                        <Gift className="w-3.5 h-3.5 text-[#94713F] shrink-0 mt-0.5" />
                        <span>
                          <strong>Dedicatoria (Regalo):</strong> &ldquo;
                          {item.customizations.dedication_note}
                          &rdquo;
                        </span>
                      </p>
                    )}

                    {/* Ver y descargar imagen con marca de agua + Recuerdo HD exclusivo del dueño */}
                    <div className="pt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPreviewModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFBF2] hover:bg-cream-100 border border-[#E8DEC8] text-[#174B3D] text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#94713F]" />
                          <span>Ver imagen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadWatermarkedPreview(order)
                          }
                          disabled={downloadingPreview}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFBF2] hover:bg-cream-100 border border-[#E8DEC8] disabled:opacity-60 text-stone-800 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {downloadingPreview ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#174B3D]" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-[#174B3D]" />
                          )}
                          <span>
                            {downloadingPreview
                              ? "Preparando..."
                              : "Descargar con marca"}
                          </span>
                        </button>
                      </div>

                      {canDownloadHdMaster ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadMemoryHd(order)}
                          disabled={downloadingOrderId === order.id}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#174B3D] hover:bg-[#134034] disabled:opacity-60 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                        >
                          {downloadingOrderId === order.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c6a26c]" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-[#c6a26c]" />
                          )}
                          <span>
                            {downloadingOrderId === order.id
                              ? "Generando Recuerdo HD..."
                              : "Descargar Recuerdo Digital HD (Sin Marca)"}
                          </span>
                        </button>
                      ) : order.status === "completed" &&
                        order.payment_status === "paid_full" &&
                        !isOwner ? (
                        <div className="inline-flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600 font-medium">
                          <Lock className="w-3 h-3 text-[#174B3D] shrink-0" />
                          <span>
                            Recuerdo Digital HD sin marca disponible solo para
                            el dueño de la orden.
                          </span>
                          <Link
                            href={`/auth/login?callbackUrl=${encodeURIComponent(`/track/${order.tracking_id}`)}`}
                            className="text-[#174B3D] font-bold underline"
                          >
                            Iniciar sesión
                          </Link>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-medium">
                          <Lock className="w-3 h-3 text-[#174B3D] shrink-0" />
                          <span>
                            Recuerdo Digital HD sin marca se desbloquea al
                            entregar (solo para el dueño)
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
                  <span>
                    {order.remaining_amount > 0
                      ? "Estado de Pagos (Modalidad 50% / 50%)"
                      : "Estado de Pago (100% al ordenar)"}
                  </span>
                </div>
                {order.remaining_amount > 0 ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex justify-between text-stone-600">
                    <span>
                      Pago Total ({order.payment_method.toUpperCase()}):
                    </span>
                    <span className="font-semibold text-[#174B3D]">
                      S/ {order.total_amount.toFixed(2)} ·{" "}
                      {order.payment_status === "paid_full"
                        ? "Verificado (100%)"
                        : "En verificación"}
                    </span>
                  </div>
                )}
                {(() => {
                  const parsedLoc = parseDeliveryPinFromOrder(
                    order.shipping?.reference,
                    item?.customizations?.delivery_location,
                    order.shipping,
                  );
                  return (
                    <div className="pt-2 border-t border-[#E8DEC8] space-y-1.5 text-stone-500">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#174B3D]" />
                          <span className="truncate">
                            Entrega en: {order.shipping?.address},{" "}
                            {order.shipping?.district}
                          </span>
                        </div>
                        {parsedLoc.pin && (
                          <a
                            href={parsedLoc.pin.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#174B3D]/10 hover:bg-[#174B3D]/20 text-[#174B3D] font-bold text-[10px] shrink-0 transition-colors"
                          >
                            <MapPin className="w-3 h-3 text-[#c6a26c]" />
                            <span>Ver Pin GPS</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      {parsedLoc.cleanReference && (
                        <p className="text-[11px] text-stone-500 pl-5 truncate">
                          Referencia: {parsedLoc.cleanReference}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Assistance Banner */}
            <div className="p-4 rounded-2xl bg-white border border-[#E8DEC8] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
              <p>
                ¿Deseas coordinar un cambio en tu entrega o consultar el horario
                del repartidor?
              </p>
              <a
                href="https://wa.me/51993920853?text=Hola%20Apolena%2C%20tengo%20una%20consulta%20sobre%20mi%20orden"
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

        {/* Modal de Vista Previa con Marca de Agua */}
        {showPreviewModal && order && item && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => setShowPreviewModal(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-lg rounded-3xl bg-[#FFFBF2] border border-[#E8DEC8] shadow-2xl p-4 sm:p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94713F] block">
                    Muestra protegida con marca de agua
                  </span>
                  <h4 className="font-serif text-base sm:text-lg font-bold text-[#174B3D] truncate">
                    {item.customizations?.theme_name || "Retrato Personalizado"}{" "}
                    · {order.order_code}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  aria-label="Cerrar vista previa"
                  className="p-2 rounded-full bg-white border border-[#E8DEC8] text-stone-500 hover:text-stone-900 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-stone-900 border border-[#E8DEC8] max-h-[65vh] flex items-center justify-center">
                <img
                  src={item.generated_art_url || "/samples/cat-suit.jpg"}
                  alt="Muestra protegida"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="max-h-[65vh] w-auto object-contain select-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadWatermarkedPreview(order)}
                  disabled={downloadingPreview}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#174B3D] hover:bg-[#134034] disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {downloadingPreview ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c6a26c]" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#c6a26c]" />
                  )}
                  <span>
                    {downloadingPreview
                      ? "Preparando muestra..."
                      : "Descargar muestra con marca"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 rounded-full bg-white hover:bg-cream-100 border border-[#E8DEC8] text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
