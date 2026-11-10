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
  { label: "INICIO", href: "/" },
  { label: "CÓMO FUNCIONA", href: "/#como-funciona" },
  { label: "QUIÉNES SOMOS", href: "/#quienes-somos" },
  { label: "TRACKING", href: "/track" },
  { label: "CONTACTO", href: "/#contacto" },
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
    <header className="sticky top-0 z-50 bg-[#174B3D] text-white border-b border-[#c6a26c]/25 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28 gap-4">
          {/* 1. Logotipo Oficial Apolena (Variación Gold sobre fondo Primary #174B3D) */}
          <Link
            href="/"
            className="flex items-center gap-3 group py-1 shrink-0"
          >
            <div className="relative w-32 h-20 sm:w-40 sm:h-24 transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo-gold.png"
                alt="Apolena — Retratos Personalizados de Mascotas"
                fill
                sizes="(min-width: 640px) 160px, 128px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* 2. Navegación Central Desktop con separadores de punto (estilo editorial) */}
          <nav
            aria-label="Navegación principal"
            className="hidden xl:flex items-center justify-center gap-1"
          >
            {NAV_ITEMS.map((item, idx) => (
              <React.Fragment key={item.label}>
                <Link
                  href={item.href}
                  className="px-2 py-1.5 text-base font-semibold tracking-[0.03em] text-white hover:text-[#c6a26c] transition-colors uppercase whitespace-nowrap"
                >
                  {item.label}
                </Link>
                {idx < NAV_ITEMS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="text-[#c6a26c] text-lg font-bold select-none"
                  >
                    ·
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* 3. Acciones Derecha Desktop (Usuario + Botón CREAR en Secondary #c6a26c, sin search ni cart) */}
          <div className="hidden xl:flex items-center gap-3.5 shrink-0">
            {sessionUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 bg-[#123B30] hover:bg-[#0E2F26] border border-[#c6a26c]/50 pl-1.5 pr-3.5 py-1.5 rounded-full shadow-sm transition-all"
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
                        ? "Super Admin"
                        : sessionUser.role === "admin"
                          ? "Admin"
                          : "En línea"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#c6a26c] transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-[#FFFBF2] text-[#141414] rounded-2xl shadow-xl border border-[#c6a26c]/40 py-2 z-50">
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
                className={`w-10 h-10 rounded-full border-2 border-[#c6a26c] text-[#c6a26c] hover:bg-[#c6a26c] hover:text-[#174B3D] flex items-center justify-center transition-all ${
                  !authLoaded ? "opacity-90" : ""
                }`}
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            {/* Botón CREAR estilo imagen de referencia */}
            <Link
              href="/products/cuadros-personalizados"
              className="bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] px-6 py-2.5 rounded-xl font-extrabold text-sm sm:text-base tracking-[0.04em] uppercase transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              CREAR
            </Link>
          </div>

          {/* Botón Hamburguesa Mobile / Tablet */}
          <div className="xl:hidden flex items-center gap-2.5 shrink-0">
            {sessionUser ? (
              <Link
                href={isAdmin ? "/dashboard" : "/orders"}
                className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#c6a26c] bg-[#c6a26c] text-[#174B3D] flex items-center justify-center font-bold text-xs shadow-sm"
                title={sessionUser.name || sessionUser.email}
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
              </Link>
            ) : (
              <Link
                href="/auth/login"
                aria-label="Iniciar Sesión"
                className="w-9 h-9 rounded-full border-2 border-[#c6a26c] text-[#c6a26c] flex items-center justify-center"
              >
                <User className="w-4 h-4" />
              </Link>
            )}

            <button
              onClick={toggleDrawer}
              className="p-2 rounded-lg text-[#c6a26c] hover:bg-white/10 transition-colors"
              aria-label="Abrir menú"
            >
              {isDrawerOpen ? (
                <X className="w-7 h-7 sm:w-8 sm:h-8" />
              ) : (
                <Menu className="w-7 h-7 sm:w-8 sm:h-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Mobile tipo Drawer Vertical */}
      {isDrawerOpen && (
        <div
          className="xl:hidden fixed inset-0 top-24 sm:top-28 bg-black/50 backdrop-blur-sm z-40"
          onClick={toggleDrawer}
        >
          <div
            className="w-full bg-[#174B3D] text-white border-b border-[#c6a26c]/40 p-6 flex flex-col gap-5 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {sessionUser && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#123B30] border border-[#c6a26c]/40">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#c6a26c] bg-[#c6a26c] text-[#174B3D] flex items-center justify-center font-bold text-sm shrink-0">
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
                    {sessionUser.name || firstName}
                  </p>
                  <p className="text-xs text-[#FFFBF2]/70 truncate">
                    {sessionUser.email}
                  </p>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={toggleDrawer}
                  className="px-4 py-2.5 rounded-xl font-bold text-base tracking-[0.03em] uppercase text-white hover:bg-white/10 hover:text-[#c6a26c] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="h-px w-full bg-[#c6a26c]/25 my-1" />

            <div className="flex flex-col gap-3">
              <Link
                href="/products/cuadros-personalizados"
                onClick={toggleDrawer}
                className="w-full flex items-center justify-center gap-2 bg-[#c6a26c] hover:bg-[#b58f56] text-[#174B3D] py-3 rounded-xl font-extrabold text-sm tracking-wider uppercase shadow-md"
              >
                CREAR RETRATO
              </Link>

              {sessionUser ? (
                <>
                  <Link
                    href="/orders"
                    onClick={toggleDrawer}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-bold text-sm border border-[#c6a26c]/30"
                  >
                    <PackageCheck className="w-4 h-4 text-[#c6a26c]" />
                    MIS ÓRDENES Y ESTADO
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      onClick={toggleDrawer}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-[#c6a26c] py-3 rounded-xl font-bold text-sm border border-[#c6a26c]/40"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#c6a26c]" />
                      DASHBOARD ADMINISTRADOR
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 py-3 rounded-xl font-bold text-sm border border-red-400/30"
                  >
                    <LogOut className="w-4 h-4" />
                    CERRAR SESIÓN
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={toggleDrawer}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl font-bold text-sm border border-[#c6a26c]/40"
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
