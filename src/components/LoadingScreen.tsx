'use client';

import React, { useEffect, useState } from 'react';
import { PIPELINE_STEPS } from '@/lib/types';
import { Template } from '@/data/templates';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  Timer,
  Layers,
  Sparkle
} from 'lucide-react';

interface LoadingScreenProps {
  jobId: string;
  template: Template;
  petImageUrl: string;
  petName: string;
  progress: number;
  currentStepMessage: string;
}

export function LoadingScreen({
  jobId,
  template,
  petImageUrl,
  petName,
  progress,
  currentStepMessage
}: LoadingScreenProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const funFacts = [
    'Nuestro modelo FLUX.1 evalúa más de 12 puntos anatómicos para fundir el cuello con la solapa sin costuras visibles.',
    'El Clarity Upscaler reconstruye cada pelo individual a 300 DPI, garantizando nitidez perfecta en cuadros impresos.',
    'La iluminación de la plantilla se armoniza dinámicamente con el color del pelaje para evitar reflejos artificiales.',
    'Cada retrato se genera con 32 pasos de inferencia para lograr una textura digna de galería de arte.'
  ];

  const currentFactIndex = Math.min(
    Math.floor((elapsed / 4) % funFacts.length),
    funFacts.length - 1
  );

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-6">
      
      {/* Central Visual Hologram Animation */}
      <div className="relative flex flex-col items-center justify-center text-center space-y-6">
        
        {/* Glow Halo */}
        <div className="absolute w-80 h-80 bg-amber-500/15 rounded-full blur-3xl -z-10 animate-pulse-subtle pointer-events-none" />

        {/* Dual Merging Avatars */}
        <div className="relative w-44 h-44 rounded-3xl overflow-hidden border-2 border-amber-500/40 p-2 bg-navy-950/80 shadow-2xl shadow-amber-500/20">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            <img
              src={petImageUrl}
              alt="Mascota"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 animate-pulse"
            />
            {/* Template silhouette overlay blending in and out */}
            <img
              src={template.templateUrl}
              alt={template.name}
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-50 transition-opacity duration-1000"
            />
          </div>

          {/* Orbiting Spinner Ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-amber-400 border-t-transparent animate-spin pointer-events-none" />
        </div>

        {/* Header Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>Procesamiento Asíncrono en Fal.ai Serverless</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
            Creando el Retrato de <span className="text-amber-400">{petName}</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            {currentStepMessage || 'Inicializando los tensores de inpainting de FLUX.1 y cargando la máscara...'}
          </p>
        </div>

      </div>

      {/* Main Progress Bar */}
      <div className="space-y-3 p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Progreso General</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-amber-400 font-bold text-sm">
              {progress}%
            </span>
            <span className="text-slate-500 text-xs flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> {elapsed}s transcurridos
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 transition-all duration-500 shadow-md shadow-amber-500/30"
            style={{ width: `${Math.max(progress, 6)}%` }}
          />
        </div>
      </div>

      {/* Pipeline Steps Grid (From Spec Phase 3) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Etapas del Pipeline Neuronal</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PIPELINE_STEPS.map((step, idx) => {
            // Determine active/completed based on progress thresholds
            const thresholds = [15, 35, 65, 85, 100];
            const isCompleted = progress >= thresholds[idx];
            const isActive = progress < thresholds[idx] && (idx === 0 || progress >= thresholds[idx - 1]);

            return (
              <div
                key={step.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-900/80 border-emerald-500/30 text-white'
                    : isActive
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10 text-white'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        {idx + 1}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className={`text-xs font-bold ${isActive ? 'text-amber-300' : isCompleted ? 'text-white' : 'text-slate-400'}`}>
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Did You Know Tip Box */}
      <div className="p-4 rounded-2xl bg-navy-950/90 border border-amber-500/20 flex items-center gap-3 text-xs text-slate-300">
        <Sparkle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
        <div>
          <span className="font-bold text-amber-300">¿Sabías que? </span>
          <span>{funFacts[currentFactIndex]}</span>
        </div>
      </div>

    </div>
  );
}
