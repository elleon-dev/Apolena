"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  PackageCheck,
  User,
  PlusCircle,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import type { AIProviderId } from '@/lib/types';
import { supabaseBrowser } from '@/lib/supabase-browser';

export interface HeaderProps {
  currentStep?: 1 | 2 | 3;
  onReset?: () => void;
  selectedProvider?: AIProviderId;
  onOpenSettings?: () => void;
  hasActiveKey?: boolean;
}

interface SessionUserInfo {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  avatar_url?: string | null;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function Header(_props: HeaderProps = {}) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUserInfo | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then(async (data) => {
        if (!mounted) return;
        let user: SessionUserInfo | null = data?.user || null;
        if (user && !user.avatar_url && supabaseBrowser) {
          try {
            const { data: sb } = await supabaseBrowser.auth.getSession();
            const meta = sb.session?.user?.user_metadata;
            const googlePic = meta?.avatar_url || meta?.picture || null;
            if (googlePic) {
              user = { ...user, avatar_url: googlePic };
            }
          } catch {
            // ignore
          }
        }
        setAvatarError(false);
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
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleLogout = async () => {
    try {
      await Promise.allSettled([
        fetch('/api/auth/logout', { method: 'POST' }),
        supabaseBrowser?.auth.signOut(),
      ]);
      setSessionUser(null);
      setIsUserMenuOpen(false);
      setIsDrawerOpen(false);
      router.push('/');
      router.refresh();
    } catch {
      window.location.href = '/';
    }
  };

  const isAdmin =
    sessionUser?.role === 'admin' || sessionUser?.role === 'super_admin';
  const firstName = sessionUser?.name
    ? sessionUser.name.replace(/\s*\(.*?\)\s*/g, '').split(' ')[0]
    : sessionUser?.email?.split('@')[0] || 'Mi Cuenta';
  const initials = getInitials(sessionUser?.name, sessionUser?.email);

  return (
    <header className="sticky top-0 z-50 bg-cream-100/95 backdrop-blur-md border-b border-primary/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24 gap-3">
          
          {/* 1. Logotipo Oficial Apolena (Isotipo Naranja #FD9414 + Tipografía Azul Marino #102854) */}
          <Link href="/" className="flex items-center gap-3 group py-2 min-w-0">
            <div className="relative w-40 h-12 sm:w-52 sm:h-16 xl:w-60 xl:h-16 shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
              <Image 
                src="/logo1.png" 
                alt="Apolena — Retratos Personalizados de Mascotas" 
                fill 
                sizes="(min-width: 1280px) 240px, (min-width: 640px) 208px, 160px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* 2. Menú Desktop (Navegación) */}
          <nav className="hidden xl:flex items-center gap-1 bg-white/90 px-5 py-2 rounded-full border border-secondary/10 shadow-sm">
            <Link 
              href="/" 
              className="px-4 py-1.5 text-sm font-semibold text-secondary hover:text-primary transition-colors rounded-full"
            >
              INICIO
            </Link>
            <Link 
              href="#quienes-somos" 
              className="px-4 py-1.5 text-sm font-semibold text-secondary/75 hover:text-secondary transition-colors rounded-full"
            >
              QUIENES SOMOS
            </Link>
            <Link 
              href="/track" 
              className="px-4 py-1.5 text-sm font-semibold text-secondary/75 hover:text-secondary transition-colors rounded-full flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4 text-primary" />
              TRACKING
            </Link>
            <Link 
              href="#contacto" 
              className="px-4 py-1.5 text-sm font-semibold text-secondary/75 hover:text-secondary transition-colors rounded-full"
            >
              CONTACTO
            </Link>
          </nav>

          {/* Botones de Acción Desktop */}
          <div className="hidden xl:flex items-center gap-3">
            {/* Botón CREAR -> /products/cuadros-personalizados */}
            <Link
              href="/products/cuadros-personalizados"
              className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              CREAR
            </Link>

            {/* Avatar de Usuario en Sesión o Botón INGRESAR */}
            {sessionUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 bg-white hover:bg-cream-50 border border-primary/40 pl-1.5 pr-3.5 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all"
                  aria-label="Menú de usuario"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-primary bg-secondary text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="flex flex-col items-start text-left max-w-[120px]">
                    <span className="text-xs font-bold text-secondary leading-tight truncate w-full">
                      {firstName}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary leading-none mt-0.5">
                      {sessionUser.role === 'super_admin'
                        ? 'Super Admin'
                        : sessionUser.role === 'admin'
                        ? 'Admin'
                        : 'En línea'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-secondary/60 transition-transform ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-secondary/10 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary bg-secondary text-white flex items-center justify-center font-bold text-sm shrink-0">
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
                        <p className="text-sm font-bold text-secondary truncate">
                          {sessionUser.name || firstName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {sessionUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="py-1.5 px-2 flex flex-col gap-1">
                      <Link
                        href="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-secondary/80 hover:bg-cream-100 hover:text-secondary transition-colors"
                      >
                        <PackageCheck className="w-4 h-4 text-primary" />
                        Mis Órdenes y Estado
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-secondary bg-primary-50 hover:bg-primary-100 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          Dashboard Administrador
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-100 mt-1 pt-1.5 px-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
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
                className={`flex items-center gap-2 bg-secondary hover:bg-secondary-800 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 ${
                  !authLoaded ? 'opacity-90' : ''
                }`}
              >
                <User className="w-4 h-4" />
                INGRESAR
              </Link>
            )}
          </div>

          {/* Botón Hamburguesa Mobile / Tablet */}
          <div className="xl:hidden flex items-center gap-2.5 shrink-0">
            {sessionUser && (
              <Link
                href={isAdmin ? '/dashboard' : '/orders'}
                className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-primary bg-secondary text-white flex items-center justify-center font-bold text-xs shadow-sm"
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
            )}
            <button
              onClick={toggleDrawer}
              className="p-2 rounded-lg text-secondary hover:bg-secondary/5 transition-colors"
              aria-label="Abrir menú"
            >
              {isDrawerOpen ? <X className="w-7 h-7 sm:w-8 sm:h-8" /> : <Menu className="w-7 h-7 sm:w-8 sm:h-8" />}
            </button>
          </div>

        </div>
      </div>

      {/* 3. Menú Mobile tipo Drawer Vertical */}
      {isDrawerOpen && (
        <div className="xl:hidden fixed inset-0 top-20 sm:top-24 bg-secondary/40 backdrop-blur-sm z-40" onClick={toggleDrawer}>
          <div 
            className="w-full bg-cream-100 border-b border-primary/30 p-6 flex flex-col gap-5 shadow-2xl animate-in slide-in-from-top duration-300 max-h-[calc(100vh-5rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {sessionUser && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-primary/30 shadow-sm">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary bg-secondary text-white flex items-center justify-center font-bold text-sm shrink-0">
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
                  <p className="text-sm font-bold text-secondary truncate">
                    {sessionUser.name || firstName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {sessionUser.email}
                  </p>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-3">
              <Link 
                href="/" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-secondary hover:bg-white/80 transition-colors"
              >
                INICIO
              </Link>
              <Link 
                href="#quienes-somos" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-secondary/80 hover:bg-white/80 transition-colors"
              >
                QUIENES SOMOS
              </Link>
              <Link 
                href="/track" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-secondary/80 hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <PackageCheck className="w-5 h-5 text-primary" />
                TRACKING
              </Link>
              <Link 
                href="#contacto" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-secondary/80 hover:bg-white/80 transition-colors"
              >
                CONTACTO
              </Link>
            </nav>

            <div className="h-px w-full bg-secondary/10 my-1" />

            {/* Botones verticales Mobile */}
            <div className="flex flex-col gap-3">
              <Link
                href="/products/cuadros-personalizados"
                onClick={toggleDrawer}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white py-3 rounded-xl font-bold text-base shadow-md"
              >
                <PlusCircle className="w-5 h-5" />
                CREAR
              </Link>

              {sessionUser ? (
                <>
                  <Link
                    href="/orders"
                    onClick={toggleDrawer}
                    className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-800 text-white py-3 rounded-xl font-bold text-base shadow-md"
                  >
                    <PackageCheck className="w-5 h-5 text-primary" />
                    MIS ÓRDENES Y ESTADO
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/dashboard"
                      onClick={toggleDrawer}
                      className="w-full flex items-center justify-center gap-2 bg-secondary-800 hover:bg-secondary-900 text-primary-100 py-3 rounded-xl font-bold text-base shadow-md"
                    >
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      DASHBOARD ADMINISTRADOR
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-bold text-base border border-red-200"
                  >
                    <LogOut className="w-5 h-5" />
                    CERRAR SESIÓN
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={toggleDrawer}
                  className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-800 text-white py-3 rounded-xl font-bold text-base shadow-md"
                >
                  <User className="w-5 h-5" />
                  INGRESAR
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
