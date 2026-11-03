'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Template } from '@/data/templates';
import { 
  UploadCloud, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Crop, 
  Dog, 
  Cat, 
  Eye, 
  Sliders,
  Maximize2
} from 'lucide-react';

interface UploadScreenProps {
  template: Template;
  onBack: () => void;
  onStartGeneration: (data: {
    petImageUrl: string;
    petName: string;
    species: 'dog' | 'cat' | 'both';
  }) => void;
}

export function UploadScreen({ template, onBack, onStartGeneration }: UploadScreenProps) {
  const [petImage, setPetImage] = useState<string | null>(null);
  const [petName, setPetName] = useState<string>('Milo');
  const [species, setSpecies] = useState<'dog' | 'cat' | 'both'>(template.species === 'cat' ? 'cat' : 'dog');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showFaceGuide, setShowFaceGuide] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Client-side image optimization: compresses to max 1500px to save bandwidth
   * as specified in Phase 4 of the architectural requirements
   */
  const processAndCompressFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor sube un archivo de imagen válido (JPG, PNG o WEBP).');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1500;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setPetImage(compressedDataUrl);
        }
        setIsCompressing(false);
      };
      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndCompressFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndCompressFile(e.target.files[0]);
    }
  };

  // Quick Demo Samples
  const loadDemoCat = () => {
    setPetImage('/samples/cat-suit.jpg');
    setPetName('Oliver el Aristócrata');
    setSpecies('cat');
  };

  const handleSubmit = () => {
    if (!petImage) return;
    onStartGeneration({
      petImageUrl: petImage,
      petName,
      species
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Top Bar with Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Atuendo elegido:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{template.name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Upload & Framing Zone (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-white">
                  Carga y Enfoque Facial
                </h2>
                <p className="text-xs text-slate-400">
                  Asegúrate de que la cabeza y el cuello de tu mascota queden bien visibles.
                </p>
              </div>

              {petImage && (
                <button
                  onClick={() => setShowFaceGuide(!showFaceGuide)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    showFaceGuide
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Guía Facial {showFaceGuide ? 'ON' : 'OFF'}</span>
                </button>
              )}
            </div>

            {/* Drag & Drop Area or Preview */}
            {!petImage ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
                    : 'border-slate-700 hover:border-amber-500/50 bg-slate-950/70 hover:bg-slate-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                  {isCompressing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <p className="text-sm font-bold text-white mb-1">
                  Arrastra la foto de tu mascota aquí
                </p>
                <p className="text-xs text-slate-400 mb-4 max-w-sm">
                  o haz clic para explorar tus archivos (JPG, PNG o WEBP hasta 15MB). Se optimizará automáticamente a 1500px.
                </p>

                <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Calibrado para FLUX.1 [dev] Inpainting</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Framing Container */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-slate-700 flex items-center justify-center group">
                  <img
                    src={petImage}
                    alt="Foto mascota"
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="w-full h-full object-cover transition-transform duration-200"
                  />

                  {/* Face Framing Overlay Guide */}
                  {showFaceGuide && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      {/* Darkened Vignette Outside Target */}
                      <div className="absolute inset-0 bg-black/35" />

                      {/* Head Oval Target */}
                      <div className="relative z-10 w-48 h-56 rounded-[50%] border-2 border-dashed border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] flex flex-col items-center justify-center text-center p-4">
                        <div className="text-[11px] font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded-full border border-amber-400/40 mb-1">
                          Área de Fusión Facial
                        </div>
                        <div className="text-[9px] text-white/80 bg-black/60 px-1.5 py-0.5 rounded">
                          Ojos y cuello alineados
                        </div>
                      </div>

                      {/* Neck Blending Horizon */}
                      <div className="relative z-10 w-64 border-t border-dashed border-cyan-400 mt-2 text-[10px] text-cyan-300 font-mono text-center">
                        Línea de Cuello / Solapa
                      </div>
                    </div>
                  )}

                  {/* Floating Action to Change Photo */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 shadow-lg"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Cambiar Foto</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Framing Zoom Slider */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Ajuste de Escala del Rostro:</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 max-w-xs">
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.05"
                      value={zoomLevel}
                      onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                    <span className="font-mono text-amber-400 text-xs font-bold w-12 text-right">
                      {(zoomLevel * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Photo Loader */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">¿No tienes una foto a mano?</span>
              <button
                type="button"
                onClick={loadDemoCat}
                className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cargar Mascota Demo (Gato Atigrado)</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Pet Details & Validation Warnings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Metadata Form */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            <h3 className="font-serif text-lg font-bold text-white">
              Ficha de la Mascota
            </h3>

            {/* Pet Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Nombre de tu Mascota
              </label>
              <input
                type="text"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Ej. Milo, Rocky, Luna..."
                className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Species Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Especie
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSpecies('dog')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                    species === 'dog'
                      ? 'bg-amber-500 text-navy-950 border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Dog className="w-4 h-4" />
                  <span>Perro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpecies('cat')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                    species === 'cat'
                      ? 'bg-amber-500 text-navy-950 border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Cat className="w-4 h-4" />
                  <span>Gato</span>
                </button>
              </div>
            </div>

            {/* Quality Checklist (From Spec Section 3 Phase 3) */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recomendaciones de Calidad</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Iluminación natural o de estudio:</strong> Evita fotos con contraluz extremo o sombras muy duras.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Ángulo a la altura de los ojos:</strong> Mirando hacia adelante o 3/4.</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Evitar fotos borrosas o pixeladas:</strong> Cuanta mayor nitidez en el pelaje, mayor detalle en el upscale 4K.</span>
                </li>
              </ul>
            </div>

            {/* Launch Button */}
            <button
              type="button"
              disabled={!petImage}
              onClick={handleSubmit}
              className={`w-full py-4 px-6 rounded-2xl font-serif text-sm font-bold flex items-center justify-center gap-3 transition-all ${
                petImage
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-navy-950 shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-5 h-5 text-navy-950" />
              <span>Generar Retrato Maestro (FLUX + 4K)</span>
            </button>

            <p className="text-[11px] text-center text-slate-500">
              Tiempo estimado de generación: <strong>~12 a 18 segundos</strong>.
            </p>

          </div>

          {/* Selected Template Preview Mini Card */}
          <div className="p-4 rounded-2xl bg-navy-950/70 border border-amber-900/40 flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-amber-500/30">
              <img src={template.templateUrl} alt={template.name} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400">Atuendo Seleccionado</span>
              <h4 className="font-serif text-sm font-bold text-white">{template.name}</h4>
              <p className="text-[11px] text-slate-400">{template.lightingDisplay}</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
