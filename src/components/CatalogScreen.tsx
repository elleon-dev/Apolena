"use client";

import React, { useState, useMemo } from "react";
import { TEMPLATES, Template } from "@/data/templates";
import {
  Sparkles,
  Sun,
  Check,
  Search,
  ShieldCheck,
  Dog,
  Cat,
  ArrowRight,
  Eye,
  Star,
} from "lucide-react";

interface CatalogScreenProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplateId?: string;
}

export function CatalogScreen({
  onSelectTemplate,
  selectedTemplateId,
}: CatalogScreenProps) {
  const [speciesFilter, setSpeciesFilter] = useState<"all" | "dog" | "cat">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set(TEMPLATES.map((t) => t.category));
    return ["all", ...Array.from(set)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      // Species match
      if (
        speciesFilter !== "all" &&
        t.species !== "both" &&
        t.species !== speciesFilter
      ) {
        return false;
      }
      // Category match
      if (selectedCategory !== "all" && t.category !== selectedCategory) {
        return false;
      }
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [speciesFilter, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-navy-900 via-navy-950 to-amber-950/40 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Colección de Atuendos Base Calibrados para FLUX.1</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Convierte a tu Mascota en una{" "}
            <span className="text-amber-400 italic">Obra Maestra</span> de
            Galería
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Selecciona un atuendo estandarizado de nuestro catálogo. Cada
            plantilla cuenta con máscara morfológica 8-bit e iluminación de
            estudio calibrada para una fusión perfecta de rostro y cuello sin
            deformidades.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Resolución 4K a 300 DPI</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Fusión Anatómica Orgánica</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Renderizado &lt; 25 Segundos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Species Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => setSpeciesFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              speciesFilter === "all"
                ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Todos ({TEMPLATES.length})
          </button>
          <button
            onClick={() => setSpeciesFilter("dog")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              speciesFilter === "dog"
                ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span>Perros</span>
          </button>
          <button
            onClick={() => setSpeciesFilter("cat")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              speciesFilter === "cat"
                ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cat className="w-3.5 h-3.5" />
            <span>Gatos</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por personaje, estilo o atuendo..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40"
          />
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "border-amber-500 ring-2 ring-amber-500/50 bg-slate-900 shadow-xl shadow-amber-500/10 scale-[1.02]"
                  : "border-slate-800 hover:border-amber-500/40 bg-slate-900/60 hover:bg-slate-900 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1"
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                <img
                  src={template.templateUrl}
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Lighting Overlay Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-navy-950/80 backdrop-blur-md border border-white/10 text-slate-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{template.lightingDisplay}</span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-400 flex-shrink-0 font-bold">
                    s:{template.strength}
                  </span>
                </div>

                {/* Badge Top Left */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${template.badgeColor}`}
                  >
                    {template.badgeText}
                  </span>
                </div>

                {/* Species Icon Top Right */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 text-[10px]">
                  {template.species === "both" && (
                    <>
                      <Dog className="w-3 h-3 text-amber-400" />
                      <Cat className="w-3 h-3 text-amber-400" />
                    </>
                  )}
                  {template.species === "dog" && (
                    <Dog className="w-3 h-3 text-amber-400" />
                  )}
                  {template.species === "cat" && (
                    <Cat className="w-3 h-3 text-amber-400" />
                  )}
                </div>

                {/* Selected Checkmark Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-amber-500/15 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-navy-950 flex items-center justify-center shadow-lg shadow-amber-500/40">
                      <Check className="w-7 h-7 stroke-[3]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                    {template.category}
                  </div>
                  <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? "bg-amber-500 text-navy-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-800 hover:bg-amber-500 hover:text-navy-950 text-slate-200"
                  }`}
                >
                  <span>
                    {isSelected
                      ? "Plantilla Seleccionada"
                      : "Elegir Este Atuendo"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm">
            No encontramos atuendos con ese criterio de búsqueda.
          </p>
          <button
            onClick={() => {
              setSpeciesFilter("all");
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="text-amber-400 hover:underline text-xs font-bold"
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </div>
  );
}
