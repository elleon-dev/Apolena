"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  Trash2,
  Lock,
  PackageCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  refreshSessionUser,
  setCachedSessionUser,
} from "@/lib/client-session";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface UserProfileData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "user" | "admin" | "super_admin";
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  created_at: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState({ ordersCount: 0, jobsCount: 0 });

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarDataUrl, setPendingAvatarDataUrl] = useState<
    string | null
  >(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Self-deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/auth/login?callbackUrl=/profile");
          return null;
        }
        if (!res.ok) throw new Error("No se pudo cargar tu perfil.");
        return res.json();
      })
      .then((data) => {
        if (!active || !data?.profile) return;
        const p: UserProfileData = data.profile;
        setProfile(p);
        setStats(data.stats || { ordersCount: 0, jobsCount: 0 });
        setName(p.name || "");
        setPhone(p.phone || "");
        setDepartment(p.department || "");
        setProvince(p.province || "");
        setDistrict(p.district || "");
        setAddress(p.address || "");
        setAvatarPreview(p.avatar_url || null);
      })
      .catch((err) => {
        if (active) {
          setFeedback({
            type: "error",
            text: err?.message || "Error al cargar los datos de tu perfil.",
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        text: "Selecciona un archivo de imagen válido (JPG, PNG o WEBP).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 512;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Recorte cuadrado centrado para avatar limpio
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
        setAvatarPreview(dataUrl);
        setPendingAvatarDataUrl(dataUrl);
        setRemoveAvatar(false);
        setFeedback(null);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (name.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Ingresa tu nombre completo (mínimo 2 caracteres).",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim(),
          province: province.trim(),
          district: district.trim(),
          address: address.trim(),
          ...(pendingAvatarDataUrl
            ? { avatarDataUrl: pendingAvatarDataUrl }
            : {}),
          ...(removeAvatar ? { removeAvatar: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data?.error || "No se pudieron guardar los cambios.",
        });
        return;
      }

      if (data.profile) {
        setProfile(data.profile);
        setAvatarPreview(data.profile.avatar_url || null);
      }
      setPendingAvatarDataUrl(null);
      setRemoveAvatar(false);

      if (data.user) {
        setCachedSessionUser(data.user);
      }
      await refreshSessionUser().catch(() => {});

      setFeedback({
        type: "success",
        text: "Tu perfil y datos fueron actualizados correctamente.",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Error de conexión al guardar tu perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOwnAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "ELIMINAR") {
      setDeleteError('Escribe "ELIMINAR" para confirmar la baja definitiva.');
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data?.error || "No se pudo eliminar tu cuenta.");
        setIsDeleting(false);
        return;
      }

      setCachedSessionUser(null);
      try {
        localStorage.removeItem("apolena_saved_creations_v1");
        localStorage.removeItem("apolena_checkout_draft");
        localStorage.removeItem("apolena_pending_checkout");
        sessionStorage.removeItem("apolena_studio_state");
      } catch {}
      await supabaseBrowser?.auth.signOut().catch(() => {});

      window.location.href = "/";
    } catch {
      setDeleteError("Error de conexión al procesar la baja.");
      setIsDeleting(false);
    }
  };

  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF2] text-[#141414]">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#E8DEC8]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#94713F]">
              Cuenta Apolena
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#174B3D] mt-1">
              Mi Perfil
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#E8DEC8] hover:border-[#174B3D] text-xs font-bold text-[#174B3D] transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#c6a26c]" />
              <span>Mis Órdenes ({stats.ordersCount})</span>
            </Link>
            <Link
              href="/products/cuadros-personalizados?step=1"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#174B3D] hover:bg-[#123B30] text-xs font-bold text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c6a26c]" />
              <span>Estudio IA</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-500">
            <Loader2 className="w-7 h-7 animate-spin text-[#174B3D]" />
            <span className="text-sm font-medium">Cargando tu perfil...</span>
          </div>
        ) : !profile ? (
          <div className="p-8 rounded-3xl bg-white border border-[#E8DEC8] text-center space-y-3">
            <p className="text-sm text-stone-600">
              No pudimos cargar tu perfil. Intenta iniciar sesión nuevamente.
            </p>
            <Link
              href="/auth/login?callbackUrl=/profile"
              className="inline-flex px-5 py-2.5 rounded-full bg-[#174B3D] text-white text-xs font-bold"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {feedback && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* TARJETA PRINCIPAL DE PERFIL Y FORMULARIO */}
            <form
              onSubmit={handleSaveProfile}
              className="bg-white border border-[#E8DEC8] rounded-3xl p-6 sm:p-8 shadow-soft space-y-7"
            >
              {/* Sección Foto de Perfil */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-[#E8DEC8]/80">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#c6a26c]/70 bg-[#174B3D] text-white flex items-center justify-center font-serif text-2xl font-bold shadow-md">
                    {avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt={profile.name || "Avatar"}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(name || profile.name, profile.email)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Cambiar foto de perfil"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#174B3D] hover:bg-[#123B30] text-white border-2 border-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#c6a26c]" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>

                <div className="text-center sm:text-left space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="font-serif text-xl font-bold text-stone-900 truncate">
                      {profile.name || profile.email.split("@")[0]}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#174B3D]/10 text-[#174B3D] text-[10px] font-bold uppercase tracking-wider">
                      {profile.role === "super_admin"
                        ? "Super Admin"
                        : profile.role === "admin"
                          ? "Admin"
                          : "Cliente"}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{profile.email}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-full bg-[#FFFBF2] hover:bg-[#F5EBD6] border border-[#E8DEC8] text-[#174B3D] text-xs font-bold cursor-pointer transition-colors"
                    >
                      Cambiar foto
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview(null);
                          setPendingAvatarDataUrl(null);
                          setRemoveAvatar(true);
                        }}
                        className="px-3 py-1.5 rounded-full text-stone-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Datos personales */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94713F] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Datos Personales</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. María Fernanda López"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-sm text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#94713F]" />
                      <span>Teléfono / WhatsApp</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. 999 888 777"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-sm text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-stone-800 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#94713F]" />
                      <span>Correo electrónico (identificador de cuenta)</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profile.email}
                      className="w-full px-3.5 py-3 rounded-xl bg-stone-100 border border-stone-200 text-sm text-stone-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección predeterminada de entrega */}
              <div className="space-y-4 pt-2 border-t border-[#E8DEC8]/70">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#94713F] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Dirección predeterminada de envío (Opcional)</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Se completará automáticamente al realizar tus próximos pedidos en el checkout.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Ej. Lima"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-sm text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="Ej. Lima"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-sm text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      Distrito
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Ej. Miraflores"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-sm text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="font-semibold text-stone-800 block">
                      Dirección exacta
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej. Av. Larco 1234, Dpto. 502"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#FFFBF2] border border-[#E8DEC8] text-sm text-stone-900 focus:border-[#174B3D] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#174B3D] hover:bg-[#123B30] disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-colors cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando cambios...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#c6a26c]" />
                      <span>Guardar cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* ZONA DE PELIGRO: DARSE DE BAJA */}
            <div className="bg-white border border-red-200 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-red-900">
                  Darse de baja de Apolena
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                  Al eliminar tu cuenta se borrarán definitivamente tu perfil,
                  todos tus retratos generados ({stats.jobsCount}), tus órdenes
                  ({stats.ordersCount}) y los archivos asociados. Podrás volver
                  a registrarte cuando desees como una cuenta nueva.
                </p>
              </div>

              {isSuperAdmin ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-stone-100 text-stone-500 text-xs font-semibold shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Super Admin protegido</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmText("");
                    setDeleteError(null);
                    setShowDeleteModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar mi cuenta</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE CONFIRMACIÓN DE BAJA DEFINITIVA */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de cuenta"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-red-200 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-red-900">
                  ¿Eliminar tu cuenta definitivamente?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Esta acción no se puede deshacer. Se eliminarán todos tus
                  datos personales, retratos guardados y archivos en Apolena.
                </p>
              </div>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-800 block">
                Escribe <strong className="text-red-700">ELIMINAR</strong> para
                confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-3.5 py-2.5 rounded-xl bg-red-50/40 border border-red-200 text-sm font-mono uppercase text-stone-900 focus:border-red-500 focus:outline-none"
              />
              {deleteError && (
                <p className="text-xs font-semibold text-red-700">
                  {deleteError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  isDeleting ||
                  deleteConfirmText.trim().toUpperCase() !== "ELIMINAR"
                }
                onClick={handleDeleteOwnAccount}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar baja</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
