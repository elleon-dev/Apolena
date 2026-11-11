"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

export interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "success";
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  icon,
  isLoading = false,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  const getIconContainerClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-50 text-red-600 border border-red-200";
      case "success":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      default:
        return "bg-orange-50 text-[#f25c05] border border-orange-200";
    }
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertTriangle className="w-5 h-5" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white";
      default:
        return "bg-[#f25c05] hover:bg-[#d94d04] text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-[#c6a26c]/30 rounded-2xl p-6 shadow-2xl space-y-4 relative">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 p-1 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-2xl shrink-0 ${getIconContainerClass()}`}>
            {icon || getDefaultIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#112237]">
              {title}
            </h3>
            <div className="text-xs text-[#64748b] leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold h-10 px-4 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            className={`rounded-xl text-xs font-bold h-10 px-5 shadow-sm transition-all cursor-pointer flex items-center gap-2 ${getConfirmButtonClass()} disabled:opacity-50`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}