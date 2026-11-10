"use client";

import React from "react";
import {
  Hammer,
  Truck,
  PackageCheck,
  CheckCircle2,
  Check,
  Clock,
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

function formatStepTimestamp(ts?: string | null): string | null {
  if (!ts) return null;
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const isAllCompleted =
    status === "completed" && paymentStatus === "paid_full";

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
    {
      num: 4,
      key: "completed",
      title: "4. Exitoso (100%)",
      subtitle:
        "Segundo 50% contraentrega confirmado y orden culminada con éxito",
      icon: CheckCircle2,
      timestamp: completedAt,
    },
  ];

  // Porcentaje de la línea conectora horizontal (entre los 4 nodos: 0%, 33.3%, 66.6%, 100%)
  const progressPercentage =
    currentStep <= 1
      ? 0
      : currentStep === 2
        ? 33.33
        : currentStep === 3
          ? 66.66
          : 100;

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 sm:p-6 shadow-soft space-y-6">
      {/* ================================================================= */}
      {/* DESKTOP & TABLET: STEPPER CON LÍNEA CONECTORA CONTINUA            */}
      {/* ================================================================= */}
      <div className="hidden md:block">
        {/* Barra superior de nodos e indicadores unidos por línea de progreso */}
        <div className="relative px-10 mb-5">
          {/* Línea base gris/crema de fondo */}
          <div className="absolute left-16 right-16 top-6 -translate-y-1/2 h-1.5 rounded-full bg-cream-200 overflow-hidden">
            {/* Línea activa coloreada según el avance */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAllCompleted
                  ? "bg-sage-600"
                  : "bg-gradient-to-r from-sage-600 via-sage-500 to-terracotta-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Nodos circulares sobre la línea */}
          <div className="relative z-10 grid grid-cols-4 gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted =
                currentStep > step.num || (step.num === 4 && isAllCompleted);
              const isCurrent =
                currentStep === step.num && !(step.num === 4 && isAllCompleted);

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                      isCompleted
                        ? "bg-sage-600 text-white border-sage-600 shadow-soft"
                        : isCurrent
                          ? "bg-terracotta-500 text-white border-terracotta-500 ring-4 ring-terracotta-500/20 shadow-card scale-105"
                          : "bg-white text-stone-400 border-cream-200"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tarjetas de detalle alineadas debajo de cada nodo */}
        <div className="grid grid-cols-4 gap-3.5">
          {steps.map((step) => {
            const isCompleted =
              currentStep > step.num || (step.num === 4 && isAllCompleted);
            const isCurrent =
              currentStep === step.num && !(step.num === 4 && isAllCompleted);
            const formattedDate = formatStepTimestamp(step.timestamp);

            return (
              <div
                key={step.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? "bg-terracotta-50/40 border-terracotta-500 ring-1 ring-terracotta-500/20 shadow-soft"
                    : isCompleted
                      ? "bg-sage-50/60 border-sage-200"
                      : "bg-cream-50/50 border-cream-200 opacity-70"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                      PASO 0{step.num}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? "bg-sage-100 text-sage-800"
                          : isCurrent
                            ? "bg-terracotta-500 text-white"
                            : "bg-cream-200/80 text-stone-500"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          <span>Completado</span>
                        </>
                      ) : isCurrent ? (
                        <span>En Curso</span>
                      ) : (
                        <span>Pendiente</span>
                      )}
                    </span>
                  </div>

                  <h4 className="font-serif text-sm lg:text-base font-bold text-stone-900">
                    {step.title}
                  </h4>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {step.subtitle}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-cream-200/80 flex items-center gap-1.5 text-[11px] font-mono text-stone-500">
                  <Clock className="w-3 h-3 text-stone-400 flex-shrink-0" />
                  <span>{formattedDate || "En espera"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* MOBILE: TIMELINE VERTICAL CON LÍNEA CONECTORA                     */}
      {/* ================================================================= */}
      <div className="md:hidden space-y-0">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted =
            currentStep > step.num || (step.num === 4 && isAllCompleted);
          const isCurrent =
            currentStep === step.num && !(step.num === 4 && isAllCompleted);
          const isLast = idx === steps.length - 1;
          const formattedDate = formatStepTimestamp(step.timestamp);

          return (
            <div key={step.key} className="relative flex gap-3.5">
              {/* Columna de Nodo + Línea Vertical */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 z-10 ${
                    isCompleted
                      ? "bg-sage-600 text-white border-sage-600"
                      : isCurrent
                        ? "bg-terracotta-500 text-white border-terracotta-500 ring-4 ring-terracotta-500/20"
                        : "bg-white text-stone-400 border-cream-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {!isLast && (
                  <div
                    className={`w-1 flex-1 my-1 rounded-full ${
                      currentStep > step.num ? "bg-sage-600" : "bg-cream-200"
                    }`}
                  />
                )}
              </div>

              {/* Contenido del Paso */}
              <div
                className={`flex-1 mb-4 p-3.5 rounded-2xl border ${
                  isCurrent
                    ? "bg-terracotta-50/40 border-terracotta-500"
                    : isCompleted
                      ? "bg-sage-50/60 border-sage-200"
                      : "bg-cream-50/60 border-cream-200 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-serif text-sm font-bold text-stone-900">
                    {step.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? "bg-sage-100 text-sage-800"
                        : isCurrent
                          ? "bg-terracotta-500 text-white"
                          : "bg-cream-200 text-stone-500"
                    }`}
                  >
                    {isCompleted
                      ? "Completado"
                      : isCurrent
                        ? "En Curso"
                        : "Pendiente"}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {step.subtitle}
                </p>
                {formattedDate && (
                  <p className="text-[11px] font-mono text-stone-400 mt-1.5">
                    {formattedDate}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
