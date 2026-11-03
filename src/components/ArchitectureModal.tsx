"use client";

import React from "react";
import {
  X,
  Cpu,
  Layers,
  DollarSign,
  Database,
  GitBranch,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950 border border-amber-500/30 shadow-2xl p-6 sm:p-8 space-y-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Especificación Técnica & Blueprint de Producción</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
            Arquitectura del Sistema Apolena
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Pipeline integral con FLUX.1 [dev] Inpainting, Clarity Upscaler 4K,
            colas asíncronas BullMQ y persistencia Supabase.
          </p>
        </div>

        {/* 1. ASCII / Flow Architecture Visualizer */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-400" />
            <span>1. Diagrama de Flujo Asíncrono</span>
          </h3>

          <div className="p-4 sm:p-5 rounded-2xl bg-navy-950 border border-slate-800 font-mono text-[11px] sm:text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <pre>{`[Usuario / Web Client] 
       │ (1. Carga foto mascota + Selección de plantilla)
       ▼
[Frontend: Next.js + Tailwind CSS + Shadcn UI]
       │ (2. Envío de Payload a POST /api/generate)
       ▼
[Backend: Node.js / App Router] ───> [Supabase Storage: pet-uploads / templates]
       │ (3. Registro de Job en Postgres: generation_jobs)
       ▼
[Cola Asíncrona: Redis + BullMQ] (Sin timeouts HTTP)
       │ (4. Petición POST con Webhook a fal.ai)
       ▼
[fal.ai Serverless Pipeline]
  ├── FLUX.1 [dev] Inpainting (Fusión de rostro + cuello | s: 0.91, guidance: 3.5)
  └── Clarity Upscaler (Escalado 4K a 300 DPI | factor 2x)
       │ (5. Notificación vía Webhook POST /api/webhooks/fal)
       ▼
[Backend Webhook Handler] ───> [Supabase DB: Job completado + URL final]
       │ (6. Server-Sent Events / SSE o Polling a /api/jobs/[id])
       ▼
[Usuario: Visualizador de Resultado Final con Deep Zoom 4K]`}</pre>
          </div>
        </div>

        {/* 2. Estandarización de Plantillas */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>2. Estandarización de Plantillas (Assets Base)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="font-mono text-amber-400 font-bold text-xs">
                template.jpg
              </span>
              <p className="font-semibold text-white">Base del Atuendo</p>
              <p className="text-slate-400 text-[11px]">
                Imagen de alta resolución (1024×1365) del cuerpo sin rostro o
                con cuello neutro. Base visual y lumínica.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="font-mono text-amber-400 font-bold text-xs">
                mask.png
              </span>
              <p className="font-semibold text-white">
                Máscara Monocromática 8-bit
              </p>
              <p className="text-slate-400 text-[11px]">
                Blanco (#FFFFFF) en cabeza/cuello; negro (#000000) en el cuerpo.
                Delimita la región exacta de inpainting.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="font-mono text-amber-400 font-bold text-xs">
                config.json
              </span>
              <p className="font-semibold text-white">
                Parámetros de Inferencia
              </p>
              <p className="text-slate-400 text-[11px]">
                Prompts, ángulo de iluminación (studio_soft, dramatic),
                compatibilidad de especie y strength calibrado (0.88-0.94).
              </p>
            </div>
          </div>
        </div>

        {/* 3. Matriz de Costos Unitarios Estimada (fal.ai) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>3. Matriz de Costos Estimada por Generación (fal.ai)</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Operación</th>
                  <th className="py-3 px-4 font-bold">Modelo / Servicio</th>
                  <th className="py-3 px-4 font-bold">Tiempo Aprox.</th>
                  <th className="py-3 px-4 font-bold">Costo Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-white">
                    Inpainting / Fusión
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-amber-300">
                    fal-ai/flux-general/inpainting
                  </td>
                  <td className="py-2.5 px-4">5 - 8 seg</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-mono font-semibold">
                    ~$0.025 - $0.035 USD
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-white">
                    Super-Resolución 4K
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-amber-300">
                    fal-ai/clarity-upscaler
                  </td>
                  <td className="py-2.5 px-4">4 - 6 seg</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-mono font-semibold">
                    ~$0.015 - $0.020 USD
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-white">
                    Almacenamiento y Webhook
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                    Supabase Storage + Compute
                  </td>
                  <td className="py-2.5 px-4">Instantáneo</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-mono font-semibold">
                    &lt; $0.001 USD
                  </td>
                </tr>
                <tr className="bg-amber-500/10 font-bold">
                  <td className="py-3 px-4 text-amber-300">
                    Costo Total Unitario
                  </td>
                  <td className="py-3 px-4 text-amber-300">
                    Pipeline Completo E2E
                  </td>
                  <td className="py-3 px-4 text-amber-300">~10 - 14 seg</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono text-sm">
                    ~$0.040 - $0.055 USD
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Criterios de Aceptación del MVP */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>4. Criterios de Aceptación del MVP Funcional</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Fidelidad del Rostro:</strong>
                <p className="text-slate-400 text-[11px]">
                  Patrón de coloración, mirada y orejas reconocibles respecto a
                  la foto original.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Integración Anatómica:</strong>
                <p className="text-slate-400 text-[11px]">
                  Cuello fundido orgánicamente con camisa/corbata/uniforme sin
                  cortes rectos.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">
                  Tiempo Total &lt; 25 Segundos:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  Inpainting + upscaling completado sin provocar timeout en el
                  cliente.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">
                  Calidad de Salida 4K / 300 DPI:
                </strong>
                <p className="text-slate-400 text-[11px]">
                  PNG mínimo 2048×2048 px apto para impresión en cuadros A4 o
                  lienzos grandes sin pixelar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-serif text-xs font-bold transition-all shadow-md"
          >
            Entendido, volver a la App
          </button>
        </div>
      </div>
    </div>
  );
}
