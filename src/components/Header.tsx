'use client';

import React from 'react';
import { PawPrint, SlidersHorizontal, Camera, Palette, Frame, ChevronRight } from 'lucide-react';
import { AIProviderId, AI_PROVIDERS } from '@/lib/types';

interface HeaderProps {
  currentStep: 1 | 2 | 3;
  onReset: () => void;
  selectedProvider?: AIProviderId;
  onOpenSettings?: () => void;
  hasActiveKey?: boolean;
}

export function Header({
  currentStep,
  onReset,
  selectedProvider = 'openai',
  onOpenSettings,
  hasActiveKey = false
}: HeaderProps) {
  const providerObj = AI_PROVIDERS.find((p) => p.id === selectedProvider) || AI_PROVIDERS[0];

  const steps = [
    { num: 1, label: 'Tu Mascota', icon: Camera },
    { num: 2, label: 'Estilo y Escena', icon: Palette },
    { num: 3, label: 'Retrato Final', icon: Frame }
  ] as const;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cream-200 bg-cream-50/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <button 
          onClick={onReset}
          className="flex items-center gap-3.5 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-terracotta-50 border border-terracotta-100 flex items-center justify-center text-terracotta-600 transition-colors group-hover:bg-terracotta-500 group-hover:text-white">
            <PawPrint className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
                Apolena
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cream-100 text-stone-600 border border-cream-200">
                Atelier
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden md:block">
              Retratos fotográficos personalizados para mascotas
            </p>
          </div>
        </button>

        {/* Center Stepper */}
        <nav aria-label="Progreso del retrato" className="hidden sm:flex items-center gap-1.5 text-xs">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <React.Fragment key={s.num}>
                <div
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-full transition-all ${
                    isActive
                      ? 'bg-stone-900 text-white font-medium shadow-soft'
                      : isDone
                      ? 'bg-sage-50 text-sage-700 border border-sage-100 font-medium'
                      : 'text-stone-500 bg-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right Studio Configuration */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white hover:bg-cream-100 border border-cream-200 text-xs font-medium text-stone-700 transition-all shadow-soft"
            title="Configurar credenciales de OpenAI y Google Gemini"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: hasActiveKey ? '#3B6E52' : '#C85A32' }}
            />
            <span className="hidden md:inline text-stone-800">Credenciales API</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
          </button>
        )}

      </div>
    </header>
  );
}
