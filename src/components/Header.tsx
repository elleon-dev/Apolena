"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  PackageCheck,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Truck,
} from "lucide-react";
import type { AIProviderId } from "@/lib/types";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  type SessionUserInfo,
  getCachedSessionUser,
  getHydrationSafeSessionUser,
  isSessionHydratedOnClient,
  refreshSessionUser,
  setCachedSessionUser,
  subscribeSessionUser,
} from "@/lib/client-session";

export interface HeaderProps {
  currentStep?: 1 | 2 | 3;
  onReset?: () => void;
  selectedProvider?: AIProviderId;
  onOpenSettings?: () => void;
  hasActiveKey?: boolean;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const NAV_ITEMS = [
  { label: "Estilos", href: "/#estilos" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Preguntas frecuentes", href: "/#faq" },
];

const MOBILE_NAV_ITEMS = [
  { label: "Estilos", href: "/#estilos" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Preguntas frecuentes", href: "/#faq" },
  { label: "Rastrear Pedido (Tracking)", href: "/track" },
  { label: "Quiénes Somos", href: "/#quienes-somos" },
  { label: "Contacto", href: "/#contacto" },
];

export function Header(_props: HeaderProps = {}) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUserInfo | null>(() =>
    getHydrationSafeSessionUser(),
  );
  const [authLoaded, setAuthLoaded] = useState<boolean>(() =>
    isSessionHydratedOnClient(),
  );
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const cached = getCachedSessionUser();
    if (cached) {
      setSessionUser(cached);
      setAuthLoaded(true);
    }

    const unsubscribe = subscribeSessionUser((nextUser) => {
      if (!mounted) return;
      setAvatarError(false);
      setSessionUser(nextUser);
      setAuthLoaded(true);
    });

    refreshSessionUser()
      .then((user) => {
        if (!mounted) return;
        setSessionUser(user);
        setAuthLoaded(true);
      })
      .catch(() => {
        if (mounted) {
          setAuthLoaded(true);
        }
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleLogout = async () => {
    try {
      setCachedSessionUser(null);
      await Promise.allSettled([
        fetch("/api/auth/logout", { method: "POST" }),
        supabaseBrowser?.auth.signOut(),
      ]);
      setSessionUser(null);
      setIsUserMenuOpen(false);
      setIsDrawerOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      window.location.href = "/";
    }
  };

  const isAdmin =
    sessionUser?.role === "admin" || sessionUser?.role === "super_admin";
  const firstName = sessionUser?.name
    ? sessionUser.name.replace(/\s*\(.*?\)\s*/g, "").split(" ")[0]
    : sessionUser?.email?.split("@")[0] || "Mi Cuenta";
  const initials = getInitials(sessionUser?.name, sessionUser?.email);

  return (
    <header className="sticky top-0 z-50 transition-all shadow-xs">
      {/* 1. Barra Superior de Anuncio: Delivery Incluido (Fiel al concepto visual) */}
      <div className="bg-[#0e362b] text-white py-2 px-4 text-center border-b border-[#174B3D]/30">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold tracking-[0.12em] uppercase">
          <Truck className="w-4 h-4 text-[#c6a26c] shrink-0" />
          <span>Delivery incluido en tu pedido</span>
        </div>
      </div>

      {/* 2. Barra Principal de Navegación (Fondo Marfil Cálido #FFFBF2) */}
      <div className="bg-[#FFFBF2] text-[#174B3D] border-b border-[#E8DEC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-22 gap-4">
            {/* Logotipo Oficial Apolena */}
            <Link
              href="/"
              className="flex items-center gap-3 group py-1 shrink-0"
            >
              <div className="relative w-40 h-11 sm:w-48 sm:h-12 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo-green.png"
                  alt="Apolena — Retratos Personalizados de Mascotas"
                  fill
                  sizes="(min-width: 640px) 192px, 160px"
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            {/* Navegación Central Desktop */}
            <nav
              aria-label="Navegación principal"
              className="hidden lg:flex items-center justify-center gap-8"
            >
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-base font-semibold text-[#174B3D] hover:text-[#c6a26c] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Acciones Derecha Desktop */}
            <div className="hidden lg:flex items-center gap-3.5 shrink-0">
              {/* AVATAR DEL USUARIO (INALTERABLE según instrucción explícita) */}
              {sessionUser ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2.5 bg-[#123B30] hover:bg-[#0E2F26] border border-[#c6a26c] pl-1.5 pr-3.5 py-1.5 rounded-full shadow-sm transition-all"
                    aria-label="Menú de usuario"
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#c6a26c] bg-[#c6a26c] text-[#174B3D] flex items-center justify-center font-extrabold text-xs shrink-0">
                      {sessionUser.avatar_url && !avatarError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sessionUser.avatar_url}
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={() => setAvatarError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#174B3D]" />
                    </div>
                    <div className="flex flex-col items-start text-left max-w-[120px]">
                      <span className="text-xs font-bold text-white leading-tight truncate w-full">
                        {firstName}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#c6a26c] leading-none mt-0.5">
                        {sessionUser.role === "super_admin"
                          ? "SUPER ADMIN"
                          : sessionUser.role === "admin"
                            ? "ADMIN"
                            : "EN LÍNEA"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#c6a26c] transition-transform ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2.5 w-64 bg-[#FFFBF2] text-[#141414] rounded-2xl shadow-xl border border-[#c6a26c]/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-[#E8DEC8] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#c6a26c] bg-[#174B3D] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {sessionUser.avatar_url && !avatarError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sessionUser.avatar_url}
                              alt=""
                              referrerPolicy="no-referrer"
                              onError={() => setAvatarError(true)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#174B3D] truncate">
                            {sessionUser.name || firstName}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {sessionUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="py-1.5 px-2 flex flex-col gap-1">
                        <Link
                          href="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#141414] hover:bg-[#c6a26c]/15 hover:text-[#174B3D] transition-colors"
                        >
                          <PackageCheck className="w-4 h-4 text-[#174B3D]" />
                          Mis Órdenes y Estado
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#174B3D] bg-[#174B3D]/10 hover:bg-[#174B3D]/15 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#174B3D]" />
                            Dashboard Administrador
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-[#E8DEC8] mt-1 pt-1.5 px-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  title="Iniciar Sesión"
                  aria-label="Iniciar Sesión"
                  className={`flex items-center gap-2 border border-[#174B3D] text-[#174B3D] hover:bg-[#174B3D] hover:text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                    !authLoaded ? "opacity-90" : ""
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Ingresar</span>
                </Link>
              )}

              {/* Botón CTA Crear mi retrato */}
              <Link
                href="/products/cuadros-personalizados"
                className="bg-[#174B3D] hover:bg-[#0E2F26] text-white px-5 sm:px-6 py-2.5 rounded-full font-semibold text-sm tracking-normal transition-all shadow-sm hover:shadow-md active:scale-95 whitespace-nowrap"
              >
                Crear mi retrato
              </Link>
            </div>

            {/* Acciones Mobile / Tablet */}
            <div className="lg:hidden flex items-center gap-2.5 shrink-0">
              {sessionUser ? (
                <button
                  type="button"
                  onClick={toggleDrawer}
                  className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#c6a26c] bg-[#123B30] text-white flex items-center justify-center font-bold text-xs shadow-xs"
                  aria-label="Menú de usuario"
                >
                  {sessionUser.avatar_url && !avatarError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sessionUser.avatar_url}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  aria-label="Iniciar Sesión"
                  className="w-9 h-9 rounded-full border border-[#174B3D] text-[#174B3D] flex items-center justify-center"
                >
                  <User className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={toggleDrawer}
                className="p-2 rounded-xl text-[#174B3D] hover:bg-stone-100 transition-colors"
                aria-label="Abrir menú"
              >
                {isDrawerOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menú Mobile tipo Drawer Lateral */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={toggleDrawer}
          />

          <div
            className="fixed inset-y-0 right-0 w-full max-w-xs bg-[#FFFBF2] text-[#141414] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-[#E8DEC8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DEC8]">
                <Link href="/" onClick={toggleDrawer} className="flex items-center gap-2">
                  <div className="relative w-36 h-10 shrink-0">
                    <Image
                      src="/logo-green.png"
                      alt="Apolena"
                      fill
                      className="object-contain object-left"
                      priority
                    />
                  </div>
                </Link>
                <button
                  onClick={toggleDrawer}
                  className="p-2 rounded-xl border border-[#D9C7AE] text-[#174B3D] hover:bg-[#FAF0E4] transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Card de Usuario en Drawer Lateral */}
              {sessionUser && (
                <div className="p-4 rounded-2xl bg-[#123B30] border border-[#c6a26c] shadow-sm flex items-center gap-3 text-white">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#c6a26c] bg-[#c6a26c] text-[#174B3D] flex items-center justify-center font-bold text-sm shrink-0">
                    {sessionUser.avatar_url && !avatarError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sessionUser.avatar_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">
                      {sessionUser.name || firstName}{" "}
                      <span className="text-[10px] text-[#c6a26c] font-semibold block uppercase">
                        {sessionUser.role === "super_admin"
                          ? "SUPER ADMIN"
                          : sessionUser.role === "admin"
                            ? "ADMIN"
                            : "USUARIO"}
                      </span>
                    </p>
                    <p className="text-xs text-[#FFFBF2]/70 truncate">
                      {sessionUser.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Lista de Links Navegación */}
              <nav className="flex flex-col gap-1 pt-1">
                {MOBILE_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={toggleDrawer}
                    className="px-4 py-2.5 rounded-xl font-bold text-base text-[#174B3D] hover:bg-[#FAF0E4] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* CTAs del Drawer Móvil */}
            <div className="space-y-3 pt-6 border-t border-[#E8DEC8]">
              <Link
                href="/products/cuadros-personalizados"
                onClick={toggleDrawer}
                className="w-full flex items-center justify-center gap-2 bg-[#174B3D] hover:bg-[#0E2F26] text-white py-3.5 rounded-full font-bold text-sm tracking-normal shadow-md transition-all"
              >
                Crear mi retrato
              </Link>

              {sessionUser ? (
                <>
                  <Link
                    href="/orders"
                    onClick={toggleDrawer}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-[#174B3D] py-3 rounded-xl font-bold text-sm border border-[#D9C7AE] transition-all"
                  >
                    <PackageCheck className="w-4 h-4 text-[#c6a26c]" />
                    MIS ÓRDENES Y ESTADO
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      onClick={toggleDrawer}
                      className="w-full flex items-center justify-center gap-2 bg-[#174B3D]/10 hover:bg-[#174B3D]/15 text-[#174B3D] py-3 rounded-xl font-bold text-sm border border-[#174B3D]/20 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#174B3D]" />
                      DASHBOARD ADMINISTRADOR
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-3 rounded-xl font-bold text-sm border border-red-200 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    CERRAR SESIÓN
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={toggleDrawer}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-[#174B3D] py-3 rounded-xl font-bold text-sm border border-[#D9C7AE] transition-all"
                >
                  <User className="w-4 h-4 text-[#c6a26c]" />
                  INGRESAR A MI CUENTA
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
