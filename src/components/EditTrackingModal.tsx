"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Truck,
  Phone,
  Calendar,
  Hash,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  MapPin,
  FileText,
  BadgeInfo,
} from "lucide-react";
import type { OrderRecord } from "@/lib/db-service";

interface EditTrackingModalProps {
  order: OrderRecord | null;
  open: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: OrderRecord) => void;
}

interface CourierPresetInfo {
  name: string;
  hint: string;
  guidePlaceholder: string;
  urlPlaceholder: string;
  phonePlaceholder: string;
}

const COURIER_PRESETS: CourierPresetInfo[] = [
  {
    name: "Shalom",
    hint: "Agencia y reparto a domicilio nacional",
    guidePlaceholder: "Ej. SHA-849201",
    urlPlaceholder: "https://shalom.pe/rastreo",
    phonePlaceholder: "Ej. (01) 500-7878 ó celular agencia",
  },
  {
    name: "DiDi Entrega",
    hint: "Express urbano por aplicativo",
    guidePlaceholder: "Ej. DIDI-4921",
    urlPlaceholder: "https://web.didiglobal.com",
    phonePlaceholder: "Ej. 987 654 321 (Celular motorizado)",
  },
  {
    name: "inDrive",
    hint: "Reparto urbano inmediato",
    guidePlaceholder: "Ej. IND-8921",
    urlPlaceholder: "https://indrive.com",
    phonePlaceholder: "Ej. 987 654 321 (Celular conductor)",
  },
  {
    name: "Olva Courier",
    hint: "Envíos a todo el Perú",
    guidePlaceholder: "Ej. 2026-0048192",
    urlPlaceholder: "https://tracking.olvacourier.com",
    phonePlaceholder: "Ej. (01) 714-0909 ó celular repartidor",
  },
  {
    name: "Uber Flash",
    hint: "Reparto rápido en moto/auto",
    guidePlaceholder: "Ej. UBER-1928",
    urlPlaceholder: "https://m.uber.com",
    phonePlaceholder: "Ej. 987 654 321 (Celular motorizado)",
  },
  {
    name: "Otro Courier",
    hint: "Especificar otro operador",
    guidePlaceholder: "Ej. Nro. de guía o código de despacho",
    urlPlaceholder: "https://...",
    phonePlaceholder: "Ej. 987 654 321",
  },
];

function isInternalApolenaCode(val?: string | null, trackingId?: string) {
  if (!val) return false;
  const clean = val.trim().toUpperCase();
  if (trackingId && clean === trackingId.trim().toUpperCase()) return true;
  return clean.startsWith("APO-") || clean.startsWith("AP0-");
}

function isInternalApolenaUrl(url?: string | null) {
  if (!url) return false;
  return url.startsWith("/track") || url.includes("apolena");
}

export function EditTrackingModal({
  order,
  open,
  onClose,
  onOrderUpdated,
}: EditTrackingModalProps) {
  if (!open || !order) return null;

  const pkg = order.packages?.[0];
  const initialIsApolena = Boolean(
    !pkg?.courier ||
      pkg.courier.toLowerCase().includes("apolena") ||
      pkg.courier.toLowerCase().includes("propio"),
  );

  const initialCourierName =
    pkg?.courier && !initialIsApolena ? pkg.courier : "Shalom";

  const [trackingId, setTrackingId] = useState(order.tracking_id);
  const [transportMode, setTransportMode] = useState<"apolena" | "courier">(
    initialIsApolena ? "apolena" : "courier",
  );
  const [courierName, setCourierName] = useState(initialCourierName);

  // Si el valor guardado es el código interno de Apolena, iniciamos vacío para mostrar el placeholder del courier
  const [trackingNumber, setTrackingNumber] = useState(
    isInternalApolenaCode(pkg?.tracking_number, order.tracking_id)
      ? ""
      : pkg?.tracking_number || "",
  );
  const [trackingUrl, setTrackingUrl] = useState(
    isInternalApolenaUrl(pkg?.tracking_url) ? "" : pkg?.tracking_url || "",
  );
  const [carrierPhone, setCarrierPhone] = useState(pkg?.carrier_phone || "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    pkg?.estimated_delivery ? pkg.estimated_delivery.split("T")[0] : "",
  );
  const [notes, setNotes] = useState(order.notes || "");
  const [changeStatusToInTransit, setChangeStatusToInTransit] = useState(
    order.status === "manufacturing",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar estado cuando cambia la orden
  useEffect(() => {
    if (order) {
      const p = order.packages?.[0];
      const isApo = Boolean(
        !p?.courier ||
          p.courier.toLowerCase().includes("apolena") ||
          p.courier.toLowerCase().includes("propio"),
      );
      setTrackingId(order.tracking_id);
      setTransportMode(isApo ? "apolena" : "courier");
      setCourierName(p?.courier && !isApo ? p.courier : "Shalom");
      setTrackingNumber(
        isInternalApolenaCode(p?.tracking_number, order.tracking_id)
          ? ""
          : p?.tracking_number || "",
      );
      setTrackingUrl(
        isInternalApolenaUrl(p?.tracking_url) ? "" : p?.tracking_url || "",
      );
      setCarrierPhone(p?.carrier_phone || "");
      setEstimatedDelivery(
        p?.estimated_delivery ? p.estimated_delivery.split("T")[0] : "",
      );
      setNotes(order.notes || "");
      setChangeStatusToInTransit(order.status === "manufacturing");
      setErrorMessage(null);
    }
  }, [order]);

  // Obtener presets y placeholders dinámicos del courier seleccionado
  const currentPreset =
    COURIER_PRESETS.find(
      (c) => c.name.toLowerCase() === courierName.trim().toLowerCase(),
    ) || COURIER_PRESETS[COURIER_PRESETS.length - 1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) {
      setErrorMessage("El Tracking ID de la orden no puede estar vacío.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const effectiveCourier =
      transportMode === "apolena"
        ? "Apolena (Transporte Propio)"
        : courierName.trim() || "Courier Externo";

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit_tracking_courier",
          tracking_id: trackingId.trim().toUpperCase(),
          courier: effectiveCourier,
          tracking_number: trackingNumber.trim() || null,
          tracking_url: trackingUrl.trim() || null,
          carrierPhone: carrierPhone.trim() || null,
          estimated_delivery: estimatedDelivery ? estimatedDelivery : null,
          notes: notes.trim() || null,
          changeStatusToInTransit:
            order.status === "manufacturing" && changeStatusToInTransit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Error al actualizar los datos de tracking y courier.",
        );
      }

      onOrderUpdated(data.order);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Ocurrió un error al guardar los cambios.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepAdvanceable = order.status === "manufacturing";

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E8DEC8] rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-hover space-y-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E8DEC8] gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-[10px] font-bold tracking-wider uppercase border border-[#174B3D]/20">
              <Truck className="w-3.5 h-3.5 text-[#c6a26c]" />
              <span>Logística y Despacho · {order.order_code}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#174B3D]">
              Tracking y Empresa Courier
            </h2>
            <p className="text-xs text-stone-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                Cliente: <strong>{order.shipping?.name}</strong> ·{" "}
                {order.shipping?.district || "Lima"},{" "}
                {order.shipping?.department || "Lima"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECCIÓN 1: TRACKING ID DE APOLENA */}
          <div className="p-4 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8] space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#174B3D] uppercase tracking-wider">
                Tracking ID Oficial (Apolena)
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] font-bold">
                PÚBLICO
              </span>
            </div>
            <p className="text-[11px] text-stone-600">
              Código público con el que el cliente consulta su pedido en la
              página de rastreo. Puedes personalizarlo si lo requieres.
            </p>
            <input
              type="text"
              required
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              placeholder="Ej. APO-2026-123456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white font-mono font-bold text-sm text-[#174B3D] placeholder:text-stone-400 placeholder:font-normal focus:ring-2 focus:ring-[#174B3D] focus:border-transparent outline-none uppercase shadow-2xs"
            />
          </div>

          {/* SECCIÓN 2: SELECCIÓN DE MODALIDAD DE TRANSPORTE */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#174B3D] uppercase tracking-wider">
              Modalidad de Transporte y Entrega
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tarjeta Apolena */}
              <button
                type="button"
                onClick={() => setTransportMode("apolena")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  transportMode === "apolena"
                    ? "bg-[#174B3D] text-white border-[#174B3D] shadow-sm"
                    : "bg-white text-stone-800 border-[#E8DEC8] hover:bg-[#FFFBF2]"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    transportMode === "apolena"
                      ? "bg-white/15 text-[#c6a26c]"
                      : "bg-[#174B3D]/10 text-[#174B3D]"
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">
                      Transporte Propio Apolena
                    </span>
                    {transportMode === "apolena" && (
                      <CheckCircle2 className="w-4 h-4 text-[#c6a26c]" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      transportMode === "apolena"
                        ? "text-white/80"
                        : "text-stone-500"
                    }`}
                  >
                    Entrega directa a cargo del equipo o chofer interno de
                    Apolena.
                  </p>
                </div>
              </button>

              {/* Tarjeta Courier Externo */}
              <button
                type="button"
                onClick={() => setTransportMode("courier")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  transportMode === "courier"
                    ? "bg-[#174B3D] text-white border-[#174B3D] shadow-sm"
                    : "bg-white text-stone-800 border-[#E8DEC8] hover:bg-[#FFFBF2]"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    transportMode === "courier"
                      ? "bg-white/15 text-[#c6a26c]"
                      : "bg-[#174B3D]/10 text-[#174B3D]"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">
                      Empresa Courier Externa
                    </span>
                    {transportMode === "courier" && (
                      <CheckCircle2 className="w-4 h-4 text-[#c6a26c]" />
                    )}
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      transportMode === "courier"
                        ? "text-white/80"
                        : "text-stone-500"
                    }`}
                  >
                    Envío mediante Shalom, DiDi, inDrive, Olva u otro operador.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SECCIÓN 3: CAMPOS SEGÚN MODALIDAD */}
          {transportMode === "courier" ? (
            <div className="space-y-4 p-4 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8]">
              {/* Presets rápidos de Courier */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Seleccionar Empresa Courier
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COURIER_PRESETS.map((item) => {
                    const isSelected =
                      courierName.toLowerCase() === item.name.toLowerCase() ||
                      (item.name === "Otro Courier" &&
                        !COURIER_PRESETS.slice(0, 5).some(
                          (c) =>
                            c.name.toLowerCase() === courierName.toLowerCase(),
                        ));

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          if (item.name === "Otro Courier") {
                            setCourierName("");
                          } else {
                            setCourierName(item.name);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#174B3D] text-white border-[#174B3D] shadow-2xs"
                            : "bg-white text-stone-700 border-[#E8DEC8] hover:bg-stone-50"
                        }`}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nombre de Courier y Nro de Guía */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-stone-700">
                    Nombre del Operador Courier *
                  </label>
                  <input
                    type="text"
                    required
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="Ej. Shalom, DiDi Entrega, Olva..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                    <Hash className="w-3.5 h-3.5 text-[#174B3D]" />
                    <span>Nro. de Guía / Código de Envío</span>
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={currentPreset.guidePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs font-mono text-stone-900 placeholder:text-stone-400 placeholder:font-sans focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* URL de Rastreo y Teléfono de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                    <ExternalLink className="w-3.5 h-3.5 text-[#174B3D]" />
                    <span>Enlace de Seguimiento Courier (URL)</span>
                  </label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder={currentPreset.urlPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                    <Phone className="w-3.5 h-3.5 text-[#174B3D]" />
                    <span>Teléfono del Motorizado / Chofer</span>
                  </label>
                  <input
                    type="tel"
                    value={carrierPhone}
                    onChange={(e) => setCarrierPhone(e.target.value)}
                    placeholder={currentPreset.phonePlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Fecha Estimada */}
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                  <Calendar className="w-3.5 h-3.5 text-[#174B3D]" />
                  <span>Fecha Estimada de Entrega al Cliente</span>
                </label>
                <div className="max-w-xs">
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs text-stone-900 focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Campos cuando es Transporte Propio Apolena */
            <div className="space-y-4 p-4 rounded-2xl bg-[#FFFBF2] border border-[#E8DEC8]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#174B3D]">
                <Truck className="w-4 h-4 text-[#c6a26c]" />
                <span>Despacho Directo por Apolena</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                    <Phone className="w-3.5 h-3.5 text-[#174B3D]" />
                    <span>Celular del Repartidor / Chofer Apolena</span>
                  </label>
                  <input
                    type="tel"
                    value={carrierPhone}
                    onChange={(e) => setCarrierPhone(e.target.value)}
                    placeholder="Ej. 987 654 321 - Juan Carlos"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700">
                    <Calendar className="w-3.5 h-3.5 text-[#174B3D]" />
                    <span>Fecha Estimada de Entrega</span>
                  </label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs text-stone-900 focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: NOTAS INTERNAS DE DESPACHO */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
              <FileText className="w-3.5 h-3.5 text-[#174B3D]" />
              <span>Instrucciones / Notas de Entrega (Opcional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Dejar en recepción de conserjería, llamar 10 min antes..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DEC8] bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-[#174B3D] outline-none shadow-2xs"
            />
          </div>

          {/* SECCIÓN 5: AVANCE DE PASO INMEDIATO (SI APLICA) */}
          {isStepAdvanceable && (
            <label className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={changeStatusToInTransit}
                onChange={(e) => setChangeStatusToInTransit(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#174B3D] rounded border-[#E8DEC8] focus:ring-[#174B3D]"
              />
              <div className="text-xs">
                <span className="font-bold text-stone-900 block">
                  Marcar orden automáticamente como &quot;En Camino&quot; (Paso
                  2)
                </span>
                <p className="text-stone-600 text-[11px]">
                  Si está marcado, la orden avanzará a estado en reparto y se
                  notificará al cliente con los datos del envío.
                </p>
              </div>
            </label>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DEC8]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full bg-[#174B3D] hover:bg-[#134034] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#c6a26c]" />
                  <span>Guardar Tracking y Courier</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
