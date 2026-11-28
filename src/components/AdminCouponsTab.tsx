"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Pencil,
  Trash2,
  X,
  Loader2,
  Percent,
  BadgeDollarSign,
  Calendar,
} from "lucide-react";
import type { DiscountCoupon } from "@/lib/coupons";
import {
  FormCheckbox,
  FormFieldError,
  FormInput,
} from "@/components/ui/FormFields";

const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Ingresa un código de al menos 3 caracteres.")
      .max(32, "El código no puede superar 32 caracteres.")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Usa solo letras mayúsculas, números, guiones o guion bajo.",
      ),
    type: z.enum(["percentage", "fixed"]),
    value: z
      .string()
      .trim()
      .min(1, "Ingresa el valor del descuento.")
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
        message: "El valor debe ser un número mayor a 0.",
      }),
    description: z
      .string()
      .max(140, "La nota interna no puede superar 140 caracteres.")
      .optional(),
    minOrderAmount: z
      .string()
      .optional()
      .refine(
        (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
        "Ingresa un monto mínimo válido (0 o mayor).",
      ),
    maxUses: z
      .string()
      .optional()
      .refine(
        (v) =>
          !v ||
          (!Number.isNaN(Number(v)) &&
            Number.isInteger(Number(v)) &&
            Number(v) >= 1),
        "Ingresa un número entero mayor o igual a 1.",
      ),
    expiresAt: z.string().optional(),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const numVal = Number(data.value);
    if (data.type === "percentage" && numVal > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "El porcentaje máximo permitido es 90%.",
      });
    }
    if (data.type === "fixed" && numVal > 9999) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "El monto fijo no puede superar S/ 9,999.",
      });
    }
  });

type CouponFormValues = z.infer<typeof couponFormSchema>;

interface AdminCouponsTabProps {
  coupons: DiscountCoupon[];
  onCouponsChange: (coupons: DiscountCoupon[]) => void;
  showToast: (type: "success" | "error", text: string) => void;
}

export function AdminCouponsTab({
  coupons,
  onCouponsChange,
  showToast,
}: AdminCouponsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: "15",
      description: "",
      minOrderAmount: "",
      maxUses: "",
      expiresAt: "",
      isActive: true,
    },
  });

  const watchedType = watch("type");

  const openCreateModal = () => {
    setEditingCoupon(null);
    reset({
      code: "",
      type: "percentage",
      value: "15",
      description: "",
      minOrderAmount: "",
      maxUses: "",
      expiresAt: "",
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      description: coupon.description || "",
      minOrderAmount:
        coupon.minOrderAmount > 0 ? String(coupon.minOrderAmount) : "",
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const onSubmitCoupon = async (values: CouponFormValues) => {
    try {
      const payload = {
        ...(editingCoupon ? { id: editingCoupon.id } : {}),
        code: values.code.trim().toUpperCase(),
        type: values.type,
        value: Number(values.value),
        description: values.description?.trim() || null,
        minOrderAmount: values.minOrderAmount
          ? Number(values.minOrderAmount)
          : 0,
        maxUses: values.maxUses ? Number(values.maxUses) : null,
        expiresAt: values.expiresAt ? `${values.expiresAt}T23:59:59.000Z` : null,
        isActive: values.isActive,
      };

      const res = await fetch("/api/admin/coupons", {
        method: editingCoupon ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError("code", {
            type: "server",
            message: data.error || "Este código ya está registrado.",
          });
          return;
        }
        showToast("error", data.error || "No se pudo guardar el cupón.");
        return;
      }

      if (Array.isArray(data.coupons)) {
        onCouponsChange(data.coupons);
      }
      setShowModal(false);
      showToast(
        "success",
        editingCoupon
          ? `Cupón "${payload.code}" actualizado.`
          : `Cupón "${payload.code}" creado y listo para campañas.`,
      );
    } catch {
      showToast("error", "Error de conexión al guardar el cupón.");
    }
  };

  const handleToggleActive = async (coupon: DiscountCoupon) => {
    setBusyId(coupon.id);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.coupons)) {
        onCouponsChange(data.coupons);
        showToast(
          "success",
          !coupon.isActive
            ? `Cupón "${coupon.code}" activado.`
            : `Cupón "${coupon.code}" pausado.`,
        );
      } else {
        showToast("error", data.error || "No se pudo actualizar el estado.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (coupon: DiscountCoupon) => {
    setBusyId(coupon.id);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.coupons)) {
        onCouponsChange(data.coupons);
        showToast("success", `Cupón "${coupon.code}" eliminado.`);
      } else {
        showToast("error", data.error || "No se pudo eliminar el cupón.");
      }
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleCopyCode = (coupon: DiscountCoupon) => {
    navigator.clipboard?.writeText(coupon.code);
    setCopiedId(coupon.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header + Stats */}
      <div className="bg-white border border-cream-200 rounded-3xl p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-terracotta-600 text-[11px] font-bold uppercase tracking-wider">
            <Ticket className="w-3.5 h-3.5" />
            <span>Campañas y Colaboraciones</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
            Cupones de Descuento
          </h2>
          <p className="text-xs text-stone-500">
            Crea códigos en porcentaje (%) o monto fijo (S/) para influencers,
            lanzamientos y promociones. {activeCount} activos · {totalUses}{" "}
            canjes totales.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-full bg-[#174B3D] hover:bg-[#123B30] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-soft self-start sm:self-auto cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 text-[#c6a26c]" />
          <span>Nuevo Cupón</span>
        </button>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-3xl p-10 text-center space-y-2 shadow-soft">
          <Ticket className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="font-serif text-lg font-semibold text-stone-900">
            Aún no hay cupones creados
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Crea tu primer cupón (por ejemplo, APOLENA15 o un código de
            influencer) para que tus clientes lo apliquen en el Estudio o en el
            Checkout.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => {
            const isExpired = Boolean(
              coupon.expiresAt &&
                new Date(coupon.expiresAt).getTime() < Date.now(),
            );
            const isExhausted = Boolean(
              coupon.maxUses && coupon.usedCount >= coupon.maxUses,
            );
            const isBusy = busyId === coupon.id;

            return (
              <div
                key={coupon.id}
                className={`bg-white border rounded-3xl p-5 shadow-soft flex flex-col justify-between gap-4 transition-all ${
                  coupon.isActive && !isExpired && !isExhausted
                    ? "border-cream-200"
                    : "border-stone-200 opacity-75"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon)}
                        title="Copiar código"
                        className="px-3 py-1.5 rounded-xl bg-[#174B3D]/10 hover:bg-[#174B3D]/15 border border-[#174B3D]/25 font-mono text-sm font-bold text-[#174B3D] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{coupon.code}</span>
                        {copiedId === coupon.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-[#94713F]" />
                        )}
                      </button>
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                        {coupon.type === "percentage"
                          ? `-${coupon.value}%`
                          : `-S/ ${coupon.value.toFixed(2)}`}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        isExpired
                          ? "bg-rose-100 text-rose-700"
                          : isExhausted
                            ? "bg-amber-100 text-amber-800"
                            : coupon.isActive
                              ? "bg-sage-100 text-sage-800"
                              : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {isExpired
                        ? "Vencido"
                        : isExhausted
                          ? "Agotado"
                          : coupon.isActive
                            ? "Activo"
                            : "Pausado"}
                    </span>
                  </div>

                  {coupon.description && (
                    <p className="text-xs text-stone-600">
                      {coupon.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-[11px] bg-cream-50 border border-cream-200 rounded-2xl p-3">
                    <div>
                      <span className="text-stone-400 block">Canjes</span>
                      <span className="font-mono font-bold text-stone-900">
                        {coupon.usedCount}
                        {coupon.maxUses ? ` / ${coupon.maxUses}` : " / ∞"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Mínimo</span>
                      <span className="font-mono font-bold text-stone-900">
                        {coupon.minOrderAmount > 0
                          ? `S/ ${coupon.minOrderAmount.toFixed(0)}`
                          : "Sin mín."}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block">Vence</span>
                      <span className="font-semibold text-stone-800">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString(
                              "es-PE",
                              { day: "2-digit", month: "short" },
                            )
                          : "Sin fecha"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => openEditModal(coupon)}
                      className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleToggleActive(coupon)}
                      className="px-3.5 py-1.5 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-semibold cursor-pointer"
                    >
                      {coupon.isActive ? "Pausar" : "Activar"}
                    </button>
                  </div>

                  {confirmDeleteId === coupon.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleDelete(coupon)}
                        className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-[11px] font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setConfirmDeleteId(coupon.id)}
                      className="px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Cupón (React Hook Form + Zod + Componentes Genéricos) */}
      {showModal && (
        <div
          className="fixed inset-0 z-[75] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !isSubmitting && setShowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#174B3D] text-white flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#c6a26c] font-bold">
                  Gestión de Campañas
                </p>
                <h3 className="font-serif text-lg font-bold">
                  {editingCoupon ? "Editar Cupón" : "Nuevo Cupón de Descuento"}
                </h3>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit(onSubmitCoupon)}
              className="p-6 space-y-4 text-xs"
            >
              <FormInput
                label="Código del Cupón"
                required
                placeholder="Ej. APOLENA15 o PETLOVER20"
                maxLength={32}
                className="font-mono uppercase tracking-wider"
                error={errors.code?.message}
                {...register("code", {
                  onChange: (e) => {
                    const cleaned = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_-]/g, "");
                    setValue("code", cleaned, { shouldValidate: true });
                  },
                })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div className="space-y-1">
                  <label className="font-bold text-stone-800 text-xs block">
                    Tipo de Descuento <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setValue("type", "percentage", { shouldValidate: true })
                      }
                      className={`py-2.5 px-2.5 rounded-xl border font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        watchedType === "percentage"
                          ? "bg-[#174B3D] text-white border-[#174B3D]"
                          : "bg-cream-50 text-stone-700 border-cream-300 hover:bg-cream-100"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Porcentaje</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setValue("type", "fixed", { shouldValidate: true })
                      }
                      className={`py-2.5 px-2.5 rounded-xl border font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        watchedType === "fixed"
                          ? "bg-[#174B3D] text-white border-[#174B3D]"
                          : "bg-cream-50 text-stone-700 border-cream-300 hover:bg-cream-100"
                      }`}
                    >
                      <BadgeDollarSign className="w-3.5 h-3.5" />
                      <span>S/ Fijo</span>
                    </button>
                  </div>
                  <FormFieldError message={errors.type?.message} />
                </div>

                <FormInput
                  label={
                    watchedType === "percentage"
                      ? "Porcentaje (1% - 90%)"
                      : "Monto Fijo en Soles (S/)"
                  }
                  required
                  type="number"
                  step={watchedType === "percentage" ? 1 : 0.5}
                  className="font-mono"
                  error={errors.value?.message}
                  {...register("value")}
                />
              </div>

              <FormInput
                label="Campaña / Nota interna (opcional)"
                placeholder="Ej. Colaboración Instagram @huellitas · Navidad"
                maxLength={140}
                error={errors.description?.message}
                {...register("description")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-start">
                <FormInput
                  label="Pedido mín. (S/)"
                  type="number"
                  step={1}
                  placeholder="0"
                  className="font-mono"
                  error={errors.minOrderAmount?.message}
                  {...register("minOrderAmount")}
                />
                <FormInput
                  label="Límite de usos"
                  type="number"
                  step={1}
                  placeholder="Ilimitado"
                  className="font-mono"
                  error={errors.maxUses?.message}
                  {...register("maxUses")}
                />
                <FormInput
                  label="Vence"
                  type="date"
                  icon={<Calendar className="w-3 h-3" />}
                  error={errors.expiresAt?.message}
                  {...register("expiresAt")}
                />
              </div>

              <FormCheckbox
                label="Cupón activo inmediatamente"
                error={errors.isActive?.message}
                {...register("isActive")}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full bg-[#174B3D] hover:bg-[#123B30] disabled:opacity-50 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>
                    {editingCoupon ? "Guardar Cambios" : "Crear Cupón"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
