"use client";

import React, { useState } from "react";
import { X, Save, Upload, Loader2, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import type { OrderRecord } from "@/lib/db-service";

interface EditOrderModalProps {
  order: OrderRecord | null;
  open: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: OrderRecord) => void;
}

export function EditOrderModal({
  order,
  open,
  onClose,
  onOrderUpdated,
}: EditOrderModalProps) {
  if (!open || !order) return null;

  // Validación de seguridad de estado
const isEditable = (order.status as string) === "pending" || (order.status as string) === "manufacturing";
  // Estados del Formulario (Contacto y Envío)
  const [shippingForm, setShippingForm] = useState({
    name: order.shipping?.name || "",
    document_type: order.shipping?.document_type || "DNI",
    document_number: order.shipping?.document_number || "",
    email: order.shipping?.email || "",
    phone: order.shipping?.phone || "",
    department: order.shipping?.department || "Lima",
    province: order.shipping?.province || "Lima",
    district: order.shipping?.district || "",
    address: order.shipping?.address || "",
    reference: order.shipping?.reference || "",
  });

  // Estados del Comprobante Adicional
  const [paymentUpdate, setPaymentUpdate] = useState({
    payment_method: "yape",
    operation_number: "",
    proof_image_url: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carga de imagen del comprobante
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPaymentUpdate((prev) => ({
        ...prev,
        proof_image_url: ev.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit_order_details",
          shipping: shippingForm,
          ...(paymentUpdate.proof_image_url
            ? { paymentUpdate }
            : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar la orden.");
      }

      onOrderUpdated(data.order);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocurrió un error al guardar los cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-cream-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-hover space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-200">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-terracotta-600 block">
              Edición de Expediente
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              Editar Orden #{order.order_code}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 flex items-center justify-center text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerta de Estado Logístico */}
        {!isEditable ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Esta orden se encuentra en estado <strong>{order.status}</strong> (fuera de fabricación). No se pueden modificar los datos de entrega ni comprobantes.
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 flex items-center gap-2.5 text-stone-700 text-xs">
            <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
            <span>
              Orden en fase editable (<strong>En Fabricación</strong> / <strong>Pendiente</strong>). Los cambios se guardarán en el historial.
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* SECCIÓN 1: DATOS DEL CLIENTE Y ENVÍO */}
          <div className="space-y-4">
            <h4 className="font-serif text-lg font-bold text-stone-900 border-b pb-2">
              1. Datos de Contacto y Entrega
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="font-semibold text-stone-800">Nombre del Destinatario</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={shippingForm.name}
                  onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="font-semibold text-stone-800">Doc</label>
                  <select
                    disabled={!isEditable}
                    value={shippingForm.document_type}
                    onChange={(e) => setShippingForm({ ...shippingForm, document_type: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-cream-50 border border-cream-200 font-semibold disabled:opacity-60"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">CE</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-stone-800">N° Documento</label>
                  <input
                    type="text"
                    disabled={!isEditable}
                    value={shippingForm.document_number}
                    onChange={(e) => setShippingForm({ ...shippingForm, document_number: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800">Correo Electrónico</label>
                <input
                  type="email"
                  disabled={!isEditable}
                  value={shippingForm.email}
                  onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={shippingForm.phone}
                  onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800">Distrito</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={shippingForm.district}
                  onChange={(e) => setShippingForm({ ...shippingForm, district: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-stone-800">Dirección Exacta</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={shippingForm.address}
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-800">Referencia de Entrega</label>
              <input
                type="text"
                disabled={!isEditable}
                value={shippingForm.reference}
                onChange={(e) => setShippingForm({ ...shippingForm, reference: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-cream-50 border border-cream-200 disabled:opacity-60"
                placeholder="Ej. Frente al parque, puerta color blanca"
              />
            </div>
          </div>

          {/* SECCIÓN 2: HISTORIAL DE COMPROBANTES Y NUEVA FOTO */}
          <div className="space-y-4 pt-2">
            <h4 className="font-serif text-lg font-bold text-stone-900 border-b pb-2">
              2. Comprobantes de Pago e Historial (Auditoría)
            </h4>

            {/* Muestra Comprobantes Anteriores */}
            <div className="space-y-2">
              <span className="font-semibold text-stone-800 block">Comprobantes Registrados:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.paymentTransactions?.map((tx, idx) => (
                  <div key={tx.id || idx} className="p-3 rounded-2xl bg-cream-50 border border-cream-200 flex items-center gap-3">
                    {tx.proof_image_url ? (
                      <img
                        src={tx.proof_image_url}
                        alt="Comprobante"
                        className="w-14 h-14 object-cover rounded-xl border border-cream-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-cream-200 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                    <div className="min-w-0 text-[11px] space-y-0.5">
                      <p className="font-bold text-stone-900">Comprobante #{idx + 1}</p>
                      <p className="text-stone-600">Método: {tx.payment_method?.toUpperCase()}</p>
                      <p className="text-stone-500 font-mono">Op: {tx.operation_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subir Nuevo Comprobante */}
            {isEditable && (
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <span className="font-semibold text-stone-900 block text-xs">
                  Adjuntar Nuevo Comprobante / Vouché (Opcional):
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800">Método de Pago</label>
                    <select
                      value={paymentUpdate.payment_method}
                      onChange={(e) => setPaymentUpdate({ ...paymentUpdate, payment_method: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-cream-200 font-semibold"
                    >
                      <option value="yape">Yape</option>
                      <option value="plin">Plin</option>
                      <option value="bank_transfer">Transferencia Bancaria</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800">N° de Operación</label>
                    <input
                      type="text"
                      value={paymentUpdate.operation_number}
                      onChange={(e) => setPaymentUpdate({ ...paymentUpdate, operation_number: e.target.value })}
                      placeholder="Ej. 1849204"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-cream-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {paymentUpdate.proof_image_url ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-cream-200 shrink-0">
                      <img src={paymentUpdate.proof_image_url} alt="Nuevo Comprobante" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <label className="px-4 py-2.5 rounded-full bg-white hover:bg-cream-100 text-stone-800 font-semibold text-xs border border-cream-200 cursor-pointer flex items-center gap-2 shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-terracotta-500" />
                      <span>Subir Foto de Comprobante</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  {paymentUpdate.proof_image_url && (
                    <span className="text-sage-700 font-semibold text-xs">Nueva imagen lista para agregar al historial.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-cream-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold"
            >
              Cancelar
            </button>
            {isEditable && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-soft flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-terracotta-400" />
                )}
                <span>Guardar Cambios</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}