"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Printer,
  ShieldCheck,
  Info,
} from "lucide-react";

export default function LibroReclamacionesPage() {
  // Form State
  const [consumerName, setConsumerName] = useState("");
  const [docType, setDocType] = useState<"DNI" | "CE" | "RUC" | "Pasaporte">("DNI");
  const [docNumber, setDocNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("Lima");
  const [province, setProvince] = useState("Lima");
  const [district, setDistrict] = useState("");

  const [isMinor, setIsMinor] = useState(false);
  const [parentName, setParentName] = useState("");

  const [contractedType, setContractedType] = useState<"producto" | "servicio">("producto");
  const [claimAmount, setClaimAmount] = useState("");
  const [orderCode, setOrderCode] = useState("");

  const [claimType, setClaimType] = useState<"reclamo" | "queja">("reclamo");
  const [description, setDescription] = useState("");
  const [consumerRequest, setConsumerRequest] = useState("");

  // Submission State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimSuccessData, setClaimSuccessData] = useState<{
    claim_code: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumer_name: consumerName,
          document_type: docType,
          document_number: docNumber,
          email,
          phone,
          address,
          department,
          province,
          district,
          is_minor: isMinor,
          parent_name: isMinor ? parentName : null,
          contracted_type: contractedType,
          claim_amount: claimAmount,
          order_code: orderCode,
          claim_type: claimType,
          description,
          consumer_request: consumerRequest,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo registrar la hoja de reclamación.");
        return;
      }

      setClaimSuccessData(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Error de conexión al procesar el reclamo. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-10 w-full space-y-8">
        {/* Banner Institucional INDECOPI */}
        <div className="bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-[#174B3D] text-[#c6a26c] flex items-center justify-center shrink-0 shadow-md">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c6a26c] block">
              Conforme a la Ley N° 29571 y D.S. N° 011-2011-PCM
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#174B3D]">
              Libro de Reclamaciones Virtual
            </h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              <strong>Razón Social:</strong> APOLENA STUDIO S.A.C. · <strong>RUC:</strong> 20612345678 · <strong>Giro:</strong> Comercio Electrónico de Cuadros y Retratos Artísticos Personalizados.
            </p>
          </div>
        </div>

        {/* VISTA DE ÉXITO TRAS EL ENVÍO */}
        {claimSuccessData ? (
          <div className="bg-white border-2 border-sage-300 rounded-3xl p-8 sm:p-10 shadow-soft space-y-6 animate-in fade-in">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-sage-50 text-sage-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Hoja de Reclamación Registrada
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
                {claimSuccessData.message}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FFFBF2] border border-[#c6a26c]/40 text-center space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                Código Único de Reclamación
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#174B3D]">
                {claimSuccessData.claim_code}
              </p>
              <p className="text-[11px] text-stone-500">
                Fecha y hora de registro: {new Date().toLocaleDateString("es-PE")} · Plazo legal máximo de respuesta: <strong>15 días hábiles</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-700 space-y-2">
              <p className="font-semibold text-stone-900">Resumen de tu Hoja de Reclamación:</p>
              <p><strong>Consumidor:</strong> {consumerName} ({docType}: {docNumber})</p>
              <p><strong>Correo para respuesta:</strong> {email} · <strong>Teléfono:</strong> {phone}</p>
              <p><strong>Tipo:</strong> {claimType === "queja" ? "Queja (Disconformidad con la atención)" : "Reclamo (Disconformidad con el producto/servicio)"}</p>
              <p><strong>Pedido concreto:</strong> {consumerRequest}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-[#c6a26c] text-[#174B3D] text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#FFFBF2] transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Hoja de Reclamación</span>
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#174B3D] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#134034] transition-colors"
              >
                <span>Volver al Inicio</span>
              </Link>
            </div>
          </div>
        ) : (
          /* FORMULARIO OFICIAL DE HOJA DE RECLAMACIÓN */
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
            <div className="bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-7 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E8DEC8]">
                <User className="w-4 h-4 text-[#c6a26c]" />
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D]">
                  1. Identificación del Consumidor Reclamante
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-stone-800 block">
                    Nombres y Apellidos Completos *
                  </label>
                  <input
                    type="text"
                    required
                    value={consumerName}
                    onChange={(e) => setConsumerName(e.target.value)}
                    placeholder="Ej. Valeria Mendoza Carranza"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Tipo de Documento *
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné de Extranjería (CE)</option>
                    <option value="RUC">RUC</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="72849102"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Correo Electrónico (para notificación formal) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Teléfono / Celular de Contacto *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="999 888 777"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-stone-800 block">
                    Domicilio del Consumidor *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. / Calle, número, interior, urbanización"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">Departamento</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Lima"
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">Provincia</label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="Lima"
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-800 block">Distrito</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Miraflores"
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900"
                    />
                  </div>
                </div>

                {/* Checkbox Menor de Edad */}
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isMinor}
                      onChange={(e) => setIsMinor(e.target.checked)}
                      className="rounded text-[#174B3D] focus:ring-[#174B3D]"
                    />
                    <span className="text-xs text-stone-700">
                      El consumidor es menor de edad (requiere datos del padre/madre o apoderado)
                    </span>
                  </label>
                </div>

                {isMinor && (
                  <div className="sm:col-span-2 space-y-1 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                    <label className="font-semibold text-stone-800 block">
                      Nombre Completo del Padre, Madre o Apoderado *
                    </label>
                    <input
                      type="text"
                      required={isMinor}
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Nombres y DNI del apoderado legal"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-stone-900"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: IDENTIFICACIÓN DEL BIEN CONTRATADO */}
            <div className="bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-7 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E8DEC8]">
                <Package className="w-4 h-4 text-[#c6a26c]" />
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D]">
                  2. Identificación del Bien Contratado
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Tipo de Bien *
                  </label>
                  <select
                    value={contractedType}
                    onChange={(e) => setContractedType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900"
                  >
                    <option value="producto">Producto (Cuadro / Retrato Físico)</option>
                    <option value="servicio">Servicio (Diseño / Simulación Digital)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Monto Reclamado en Soles (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    placeholder="Ej. 180.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Código de Orden o Tracking ID
                  </label>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Ej. AP-94812 o TRK-..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DETALLE DE LA RECLAMACIÓN */}
            <div className="bg-white border border-[#c6a26c]/30 rounded-3xl p-6 sm:p-7 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E8DEC8]">
                <FileText className="w-4 h-4 text-[#c6a26c]" />
                <h2 className="font-serif text-base sm:text-lg font-bold text-[#174B3D]">
                  3. Detalle de la Reclamación
                </h2>
              </div>

              {/* Selector de Reclamo vs Queja con Explicación Legal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setClaimType("reclamo")}
                  className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                    claimType === "reclamo"
                      ? "border-[#174B3D] bg-[#174B3D]/5 text-[#174B3D] ring-1 ring-[#174B3D]"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Reclamo</span>
                    {claimType === "reclamo" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#174B3D] text-white">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Disconformidad relacionada directamente a los <strong>bienes o servicios adquiridos</strong> (ej. producto, medidas, entrega).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setClaimType("queja")}
                  className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                    claimType === "queja"
                      ? "border-[#174B3D] bg-[#174B3D]/5 text-[#174B3D] ring-1 ring-[#174B3D]"
                      : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Queja</span>
                    {claimType === "queja" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#174B3D] text-white">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    Disconformidad que <strong>no guarda relación directa</strong> con los bienes adquiridos, sino con el malestar en la atención al público.
                  </p>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Detalle de los hechos que sustentan la reclamación *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe de forma clara y cronológica lo sucedido..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-800 block">
                    Pedido concreto del consumidor *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={consumerRequest}
                    onChange={(e) => setConsumerRequest(e.target.value)}
                    placeholder="Indica qué solución o acción concreta solicitas a la empresa..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-stone-900 focus:outline-none focus:border-[#174B3D]"
                  />
                </div>
              </div>
            </div>

            {/* Aviso Legal y Plazo de Respuesta */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-stone-700 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-stone-900">
                  Constancia Legal y Plazo de Atención (Artículo 24 de la Ley N° 29571):
                </p>
                <p>
                  La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante INDECOPI. El proveedor deberá dar respuesta al reclamo en un plazo no mayor a <strong>quince (15) días hábiles</strong>.
                </p>
              </div>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-full bg-[#174B3D] hover:bg-[#134034] disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#c6a26c]" />
                  <span>Registrando Hoja de Reclamación...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-[#c6a26c]" />
                  <span>Enviar Hoja de Reclamación</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
