"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  Loader2,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Mail,
  FileImage,
  Upload,
} from "lucide-react";
import type { OrderRecord } from "@/lib/db-service";
import {
  CANVAS_WRAP_BLEED_CM,
  exportPrintReadyImage,
  resolvePrintBleedSpec,
} from "@/lib/print-export";
import { parseDeliveryPinFromOrder } from "@/lib/delivery-location";

export const DEFAULT_SUPPLIER_EMAIL = "mariano260996@gmail.com";

interface SendToSupplierModalProps {
  order: OrderRecord | null;
  defaultSupplierEmail?: string;
  onClose: () => void;
  onSentSuccess: (message: string) => void;
}

function buildDefaultSupplierContent(order: OrderRecord) {
  const item = order.packages?.[0]?.items?.[0];
  const cust = item?.customizations || {};
  const bleedSpec = resolvePrintBleedSpec(
    {
      sizeId: cust.size_id,
      cmDimensions: cust.cm_dimensions || cust.size_label,
    },
    CANVAS_WRAP_BLEED_CM,
  );

  const themeName = cust.theme_name || "Retrato Personalizado";
  const frameName = cust.frame_name || "Canvas - Estilo 3D (Sin marco)";
  const finishLabel =
    cust.finish_label ||
    (cust.finish_mode === "museum-matte"
      ? "Con Borde Blanco (Passepartout)"
      : "Lienzo Completo (Full Screen)");
  const petCount = cust.pet_count || 1;
  const hasInscription = Boolean(
    cust.pet_inscription?.enabled && cust.pet_inscription?.pet_name?.trim(),
  );
  const inscriptionText = hasInscription
    ? `SÍ — "${cust.pet_inscription!.pet_name.trim()}" (ya viene impreso en el archivo adjunto, esquina inferior derecha en diagonal)`
    : "NO (Solo arte, sin texto en el lienzo)";
  const dedication = cust.dedication_note?.trim() || null;
  const { cleanReference, pin } = parseDeliveryPinFromOrder(
    order.shipping?.reference,
    cust.delivery_location,
    order.shipping,
  );

  const shipping = order.shipping;
  const locationParts = [
    shipping?.district,
    shipping?.province,
    shipping?.department,
  ]
    .filter(Boolean)
    .join(", ");

  const subject = `[ORDEN DE FABRICACIÓN APOLENA] ${order.order_code} · Cuadro ${bleedSpec.faceCmLabel} (Impresión ${bleedSpec.totalCmLabel}) · ${frameName}`;

  const lines: string[] = [
    `Hola equipo de producción,`,
    ``,
    `Se confirma PAGO 100% VERIFICADO para iniciar la fabricación del siguiente cuadro personalizado:`,
    ``,
    `=== 1. IDENTIFICACIÓN DE LA ORDEN ===`,
    `- Código de Orden: ${order.order_code}`,
    `- Tracking ID: ${order.tracking_id}`,
    `- Cantidad: ${item?.quantity || 1} unidad(es)`,
    `- Temática / Arte: ${themeName} (${petCount} mascota${petCount > 1 ? "s" : ""})`,
    ``,
    `=== 2. ESPECIFICACIONES TÉCNICAS DE IMPRESIÓN Y ARMADO ===`,
    `- Medida visible del cuadro (bastidor frontal): ${bleedSpec.faceCmLabel}`,
    `- Medida TOTAL de impresión (+${CANVAS_WRAP_BLEED_CM} cm por los 4 lados para remangado): ${bleedSpec.totalCmLabel} a 300 DPI`,
    `- Presentación / Marco: ${frameName}`,
    `- Acabado de lienzo: ${finishLabel}`,
    `- Nombre de mascota en lienzo: ${inscriptionText}`,
    ...(dedication
      ? [`- Tarjeta de dedicatoria impresa: "${dedication}"`]
      : []),
    ``,
    `=== 3. DATOS DE ENTREGA / ROTULADO ===`,
    `- Destinatario: ${shipping?.name || "Por confirmar"}`,
    `- Teléfono / WhatsApp: ${shipping?.phone || "Por confirmar"}`,
    `- Ubicación: ${locationParts || "Lima, Perú"}`,
    `- Dirección exacta: ${shipping?.address || "Por confirmar"}`,
    ...(cleanReference ? [`- Referencia: ${cleanReference}`] : []),
    ...(pin?.googleMapsUrl
      ? [`- Pin GPS Google Maps: ${pin.googleMapsUrl}`]
      : []),
    ...(order.notes?.trim() ? [``, `=== 4. NOTAS ADICIONALES ===`, order.notes.trim()] : []),
    ``,
    `El archivo maestro en alta resolución con el margen de +${CANVAS_WRAP_BLEED_CM} cm por lado se encuentra adjunto a este correo.`,
    `Por favor confirmar recepción y fecha estimada de entrega.`,
    ``,
    `Saludos,`,
    `Equipo Apolena`,
  ];

  return {
    subject,
    message: lines.join("\n"),
    bleedSpec,
    inscriptionName: hasInscription
      ? cust.pet_inscription!.pet_name.trim()
      : null,
  };
}

async function compressDataUrlForEmailAttachment(
  dataUrl: string,
  maxBytes = 2_400_000,
): Promise<{ base64: string; ext: "png" | "jpg"; approxKb: number }> {
  const rawB64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
  const approxBytes = Math.round((rawB64.length * 3) / 4);
  if (approxBytes <= maxBytes) {
    return {
      base64: rawB64,
      ext: dataUrl.startsWith("data:image/jpeg") ? "jpg" : "png",
      approxKb: Math.round(approxBytes / 1024),
    };
  }

  // Si el PNG supera ~2.4MB (ej. cuadro 2XL), convertir a JPEG de máxima calidad (0.93)
  // para mantener 300 DPI sin exceder el límite de carga serverless/Resend
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          base64: rawB64,
          ext: "png",
          approxKb: Math.round(approxBytes / 1024),
        });
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      for (const quality of [0.93, 0.86, 0.78]) {
        const jpgDataUrl = canvas.toDataURL("image/jpeg", quality);
        const jpgB64 = jpgDataUrl.replace(/^data:[^;]+;base64,/, "");
        const jpgBytes = Math.round((jpgB64.length * 3) / 4);
        if (jpgBytes <= maxBytes || quality === 0.78) {
          resolve({
            base64: jpgB64,
            ext: "jpg",
            approxKb: Math.round(jpgBytes / 1024),
          });
          return;
        }
      }
    };
    img.onerror = () => {
      resolve({
        base64: rawB64,
        ext: "png",
        approxKb: Math.round(approxBytes / 1024),
      });
    };
    img.src = dataUrl;
  });
}

export function SendToSupplierModal({
  order,
  defaultSupplierEmail,
  onClose,
  onSentSuccess,
}: SendToSupplierModalProps) {
  const customFileRef = useRef<HTMLInputElement>(null);

  const resolvedDefaultEmail =
    defaultSupplierEmail?.trim() || DEFAULT_SUPPLIER_EMAIL;
  const [toEmail, setToEmail] = useState(resolvedDefaultEmail);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [isPreparingAttachment, setIsPreparingAttachment] = useState(false);
  const [attachment, setAttachment] = useState<{
    filename: string;
    base64: string;
    previewUrl: string;
    sizeKb: number;
    dimensionsLabel: string;
  } | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    let cancelled = false;

    const defaults = buildDefaultSupplierContent(order);
    const prevDispatch = (
      order.packages?.[0]?.items?.[0]?.customizations as any
    )?.production_dispatch;

    setToEmail(prevDispatch?.supplier_email || resolvedDefaultEmail);
    setSubject(defaults.subject);
    setMessage(defaults.message);
    setSubmitError(null);
    setAttachment(null);
    setAttachmentError(null);

    // Preparar automáticamente el Archivo Maestro HD con +4 cm para adjuntar
    const prepareMasterAttachment = async () => {
      const item = order.packages?.[0]?.items?.[0];
      if (!item) return;

      setIsPreparingAttachment(true);
      try {
        let imageSrc = item.customizations?.master_art_url || null;
        if (!imageSrc || imageSrc.includes("/previews/")) {
          const res = await fetch(`/api/admin/orders/${order.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.masterArtUrl) {
              imageSrc = data.masterArtUrl;
            }
          }
        }
        if (!imageSrc) {
          imageSrc = item.generated_art_url || "/samples/cat-suit.jpg";
        }

        const exported = await exportPrintReadyImage(
          imageSrc,
          defaults.bleedSpec.preset,
          item.customizations?.finish_mode === "museum-matte"
            ? "museum-matte"
            : "full-bleed",
          CANVAS_WRAP_BLEED_CM,
          defaults.inscriptionName,
        );

        const prepared = await compressDataUrlForEmailAttachment(
          exported.dataUrl,
        );
        if (cancelled) return;

        const fileName = `Orden-${order.order_code}-cuadro-${defaults.bleedSpec.faceWidthCm}x${defaults.bleedSpec.faceHeightCm}cm-impresion-${defaults.bleedSpec.totalWidthCm}x${defaults.bleedSpec.totalHeightCm}cm-300DPI.${prepared.ext}`;
        setAttachment({
          filename: fileName,
          base64: prepared.base64,
          previewUrl: exported.dataUrl,
          sizeKb: prepared.approxKb,
          dimensionsLabel: `${defaults.bleedSpec.totalCmLabel} (+${CANVAS_WRAP_BLEED_CM} cm por lado)`,
        });
      } catch (err) {
        console.warn("[SendToSupplierModal] Error preparando adjunto:", err);
        if (!cancelled) {
          setAttachmentError(
            "No se pudo generar el adjunto automático. Puedes adjuntar el archivo manualmente abajo.",
          );
        }
      } finally {
        if (!cancelled) setIsPreparingAttachment(false);
      }
    };

    void prepareMasterAttachment();
    return () => {
      cancelled = true;
    };
  }, [order, resolvedDefaultEmail]);

  if (!order) return null;

  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 3.0 * 1024 * 1024) {
      setAttachmentError(
        "El archivo seleccionado supera los 3.0 MB. Usa una versión optimizada para envío por correo.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = String(ev.target?.result || "");
      const base64 = result.replace(/^data:[^;]+;base64,/, "");
      setAttachment({
        filename: file.name,
        base64,
        previewUrl: file.type.startsWith("image/") ? result : "",
        sizeKb: Math.round(file.size / 1024),
        dimensionsLabel: "Archivo adjunto manualmente",
      });
      setAttachmentError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!toEmail.trim()) {
      setSubmitError("Ingresa el correo del proveedor.");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      setSubmitError("Completa el asunto y el mensaje detallado.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/send-to-supplier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: toEmail.trim(),
          subject: subject.trim(),
          message: message.trim(),
          attachment: attachment
            ? { filename: attachment.filename, base64: attachment.base64 }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(
          data?.error || "No se pudo enviar el correo al proveedor.",
        );
        return;
      }
      onSentSuccess(
        data?.message || `Orden enviada al proveedor (${toEmail.trim()}).`,
      );
      onClose();
    } catch {
      setSubmitError("Error de conexión al enviar el correo al proveedor.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
      onClick={() => !isSending && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Enviar orden a proveedor de fabricación"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#174B3D] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#c6a26c]">
              Despacho a Taller / Proveedor
            </p>
            <h3 className="font-serif text-lg sm:text-xl font-bold truncate">
              Enviar Orden {order.order_code} a Fabricación
            </h3>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs"
        >
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Campo 1: Correo del proveedor */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#94713F]" />
              <span>Correo del Proveedor / Fabricador *</span>
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="proveedor@correo.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Campo 2: Asunto */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 block">Asunto *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm text-stone-900 font-medium focus:border-[#174B3D] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Campo 3: Mensaje técnico detallado */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800">
                Mensaje y Ficha Técnica Detallada *
              </label>
              <span className="text-[10px] text-stone-500">
                Editable antes de enviar
              </span>
            </div>
            <textarea
              required
              rows={11}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-cream-50 border border-cream-300 text-xs font-mono leading-relaxed text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none resize-y"
            />
          </div>

          {/* Campo 4: Archivo Maestro HD adjunto (+4 cm) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-cream-50 border border-cream-200">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#174B3D]" />
                <span>Archivo Adjunto para Imprenta (HD con +4 cm)</span>
              </span>
              <button
                type="button"
                onClick={() => customFileRef.current?.click()}
                className="text-[11px] font-bold text-[#174B3D] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Cambiar archivo</span>
              </button>
              <input
                ref={customFileRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleCustomFileChange}
                className="hidden"
              />
            </div>

            {isPreparingAttachment ? (
              <div className="flex items-center gap-2.5 py-2 text-stone-600">
                <Loader2 className="w-4 h-4 animate-spin text-[#174B3D]" />
                <span>
                  Preparando Archivo Maestro HD con margen de +{CANVAS_WRAP_BLEED_CM} cm por lado...
                </span>
              </div>
            ) : attachment ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-emerald-200">
                {attachment.previewUrl ? (
                  <img
                    src={attachment.previewUrl}
                    alt="Vista previa adjunto"
                    className="w-12 h-12 rounded-lg object-cover border border-cream-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-cream-100 flex items-center justify-center shrink-0">
                    <FileImage className="w-5 h-5 text-[#174B3D]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900 truncate flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{attachment.filename}</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {attachment.dimensionsLabel} · {attachment.sizeKb} KB
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-stone-500 italic">
                Sin archivo adjunto listo todavía.
              </p>
            )}

            {attachmentError && (
              <p className="text-[11px] text-amber-800 font-medium">
                {attachmentError}
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-cream-200">
            <button
              type="button"
              disabled={isSending}
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending || isPreparingAttachment}
              className="px-6 py-2.5 rounded-full bg-[#174B3D] hover:bg-[#123B30] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-soft cursor-pointer transition-colors"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando al proveedor...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#c6a26c]" />
                  <span>Enviar Orden al Proveedor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
