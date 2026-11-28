"use client";

import React, { useState } from "react";
import { Ticket, CheckCircle2, X, Loader2, AlertCircle } from "lucide-react";

export interface AppliedCouponClient {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description?: string | null;
  discountAmount: number;
}

interface CouponInputBoxProps {
  subtotal: number;
  appliedCoupon: AppliedCouponClient | null;
  onApply: (coupon: AppliedCouponClient) => void;
  onRemove: () => void;
  compact?: boolean;
}

export function CouponInputBox({
  subtotal,
  appliedCoupon,
  onApply,
  onRemove,
  compact = false,
}: CouponInputBoxProps) {
  const [isOpen, setIsOpen] = useState(Boolean(appliedCoupon));
  const [codeInput, setCodeInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleValidate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = codeInput.trim().toUpperCase();
    if (!clean) {
      setErrorMsg("Ingresa un código de cupón.");
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid || !data.coupon) {
        setErrorMsg(data.error || "El cupón no es válido.");
        return;
      }

      onApply({
        code: data.coupon.code,
        type: data.coupon.type,
        value: data.coupon.value,
        description: data.coupon.description || null,
        discountAmount: Number(data.discountAmount || 0),
      });
      setCodeInput("");
      setErrorMsg(null);
    } catch {
      setErrorMsg("Error de conexión al validar el cupón.");
    } finally {
      setIsValidating(false);
    }
  };

  if (appliedCoupon) {
    const label =
      appliedCoupon.type === "percentage"
        ? `-${appliedCoupon.value}%`
        : `-S/ ${appliedCoupon.value.toFixed(2)}`;
    return (
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-emerald-950 truncate">
              Cupón <span className="font-mono">{appliedCoupon.code}</span>{" "}
              <span className="text-emerald-700">({label})</span>
            </p>
            <p className="text-[11px] text-emerald-800">
              Ahorras S/ {appliedCoupon.discountAmount.toFixed(2)} en este pedido
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onRemove();
            setErrorMsg(null);
          }}
          aria-label="Quitar cupón"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-red-50 border border-emerald-200 hover:border-red-200 text-stone-600 hover:text-red-700 text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
        >
          <X className="w-3 h-3" />
          <span>Quitar</span>
        </button>
      </div>
    );
  }

  if (!isOpen && compact) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-cream-50/80 hover:bg-cream-100 border border-dashed border-cream-300 text-xs text-stone-700 transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-2 font-semibold text-[#174B3D]">
          <Ticket className="w-3.5 h-3.5 text-[#94713F]" />
          <span>¿Tienes un cupón de descuento?</span>
        </span>
        <span className="text-[11px] font-bold text-[#94713F]">Aplicar</span>
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-stone-700 inline-flex items-center gap-1.5">
          <Ticket className="w-3.5 h-3.5 text-[#94713F]" />
          <span>¿Tienes un cupón de descuento?</span>
        </span>
        {compact && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setErrorMsg(null);
            }}
            className="text-stone-400 hover:text-stone-700 text-[10px] cursor-pointer"
          >
            Ocultar
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={codeInput}
          onChange={(e) => {
            setCodeInput(e.target.value.toUpperCase());
            if (errorMsg) setErrorMsg(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleValidate();
            }
          }}
          placeholder="Ej. APOLENA15"
          maxLength={32}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-mono uppercase tracking-wider text-stone-900 placeholder:normal-case placeholder:font-sans focus:border-[#174B3D] focus:outline-none"
        />
        <button
          type="button"
          disabled={isValidating || !codeInput.trim()}
          onClick={() => void handleValidate()}
          className="px-4 py-2 rounded-xl bg-[#174B3D] hover:bg-[#123B30] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          {isValidating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <span>Aplicar</span>
          )}
        </button>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-red-700 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </p>
      )}
    </div>
  );
}
