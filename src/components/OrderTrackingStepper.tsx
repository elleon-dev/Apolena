"use client";

import React from "react";
import {
  Hammer,
  Truck,
  PackageCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { OrderStatus, PaymentStatus } from "@/lib/db-service";

interface OrderTrackingStepperProps {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  manufacturingStartedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
}

export function OrderTrackingStepper({
  status,
  paymentStatus,
  manufacturingStartedAt,
  shippedAt,
  deliveredAt,
  completedAt,
}: OrderTrackingStepperProps) {
  if (status === "cancelled") {
    return (
      <div className="p-5 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-700 flex items-center gap-3">
        <XCircle className="w-6 h-6 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold">Orden Cancelada</p>
          <p className="text-xs opacity-80">
            Este pedido ha sido anulado por administración.
          </p>
        </div>
      </div>
    );
  }

  const stepIndexMap: Record<OrderStatus, number> = {
    manufacturing: 1,
    in_transit: 2,
    delivered: 3,
    completed: 4,
    cancelled: 0,
  };

  const currentStep = stepIndexMap[status] || 1;

  const steps = [
    {
      num: 1,
      key: "manufacturing",
      title: "1. Fabricación",
      subtitle:
        "Impresión 300 DPI sobre lienzo de algodón y enmarcado artesanal",
      icon: Hammer,
      timestamp: manufacturingStartedAt,
    },
    {
      num: 2,
      key: "in_transit",
      title: "2. En Camino",
      subtitle: "Tu cuadro salió del taller rumbo a tu dirección de entrega",
      icon: Truck,
      timestamp: shippedAt,
    },
    {
      num: 3,
      key: "delivered",
      title: "3. Entregado",
      subtitle:
        "Recibido en tu domicilio · Pago del 50% restante contraentrega",
      icon: PackageCheck,
      timestamp: deliveredAt,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <div
              key={step.key}
              className={`p-4 rounded-2xl border transition-all ${
                isCurrent
                  ? "bg-white border-terracotta-500 ring-2 ring-terracotta-500/20 shadow-card"
                  : isCompleted
                    ? "bg-sage-50/70 border-sage-100"
                    : "bg-cream-50/60 border-cream-200 opacity-65"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isCurrent
                      ? "bg-terracotta-500 text-white"
                      : isCompleted
                        ? "bg-sage-600 text-white"
                        : "bg-cream-200 text-stone-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isCurrent
                      ? "bg-terracotta-50 text-terracotta-700 border border-terracotta-100"
                      : isCompleted
                        ? "bg-sage-100 text-sage-800"
                        : "bg-cream-100 text-stone-500"
                  }`}
                >
                  {isCompleted
                    ? "Completado"
                    : isCurrent
                      ? "Paso Actual"
                      : "Pendiente"}
                </span>
              </div>
              <h4 className="font-serif text-base font-semibold text-stone-900">
                {step.title}
              </h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {step.subtitle}
              </p>
              {step.timestamp && (
                <p className="text-[11px] font-mono text-stone-400 mt-2">
                  {new Date(step.timestamp).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Culminación: Estado Exitoso cuando se entrega y se paga el otro 50% */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          status === "completed" && paymentStatus === "paid_full"
            ? "bg-sage-50 border-sage-200 text-sage-900"
            : "bg-cream-100/70 border-cream-200 text-stone-600"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              status === "completed"
                ? "bg-sage-600 text-white"
                : "bg-white border border-cream-200 text-stone-400"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold">
              {status === "completed"
                ? "Estado de la Orden: EXITOSO (100% Pagado y Entregado)"
                : "Cierre de Orden: Exitoso al abonar el 50% restante contraentrega"}
            </p>
            <p className="text-[11px] opacity-80">
              {status === "completed"
                ? "¡Gracias por confiar en Apolena! El segundo 50% contraentrega fue completado y tu pedido ha culminado con éxito."
                : "Una vez entregado tu producto y completado el segundo 50%, tu orden pasará automáticamente al estatus Exitoso."}
            </p>
          </div>
        </div>
        {completedAt && (
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/80 border border-sage-200 text-sage-800">
            Finalizado:{" "}
            {new Date(completedAt).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
