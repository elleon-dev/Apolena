"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, PackageCheck, User, PlusCircle } from 'lucide-react';

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF6F0]/90 backdrop-blur-md border-b border-[#D4A343]/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-28 gap-3">
          
          {/* 1. Logotipo Completo (Logo circular con borde + Texto en HTML) */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group py-2 min-w-0">
            {/* Logo en círculo con borde (solo el círculo lleva borde) */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 xl:w-24 xl:h-24 shrink-0 rounded-full overflow-hidden border-[3px] border-[#D4A343] bg-white shadow-md transition-transform duration-300 group-hover:scale-105">
              <Image 
                src="/logo.png" 
                alt="Apolena Logo" 
                fill 
                sizes="(min-width: 1280px) 96px, (min-width: 640px) 80px, 64px"
                className="object-contain p-1"
                priority
              />
            </div>
            {/* Texto de la marca */}
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1C1B1A] leading-none">
                Apolena
              </span>
              <span className="text-[9px] sm:text-[13px] uppercase tracking-wider text-[#D4A343] font-bold mt-1 sm:mt-1.5 truncate">
                RETRATOS PERSONALIZADOS
              </span>
            </div>
          </Link>

          {/* 2. Menú Desktop (Navegación) */}
          <nav className="hidden xl:flex items-center gap-1 bg-white/80 px-5 py-2 rounded-full border border-gray-200/80 shadow-sm">
            <Link 
              href="/" 
              className="px-4 py-1.5 text-sm font-semibold text-[#1C1B1A] hover:text-[#D4A343] transition-colors rounded-full"
            >
              INICIO
            </Link>
            <Link 
              href="#quienes-somos" 
              className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-[#1C1B1A] transition-colors rounded-full"
            >
              QUIENES SOMOS
            </Link>
            <Link 
              href="#tracking" 
              className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-[#1C1B1A] transition-colors rounded-full flex items-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4 text-[#D4A343]" />
              TRACKING
            </Link>
            <Link 
              href="#contacto" 
              className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:text-[#1C1B1A] transition-colors rounded-full"
            >
              CONTACTO
            </Link>
          </nav>

          {/* Botones de Acción Desktop */}
          <div className="hidden xl:flex items-center gap-3">
            {/* Botón CREAR -> /products/personalized-wall-Art */}
            <Link
              href="/products/personalized-wall-Art"
              className="flex items-center gap-2 bg-[#D4A343] hover:bg-[#b88c32] text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              CREAR
            </Link>

            {/* Botón INGRESAR */}
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-[#1C1B1A] hover:bg-black text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <User className="w-4 h-4" />
              INGRESAR
            </Link>
          </div>

          {/* Botón Hamburguesa Mobile / Tablet */}
          <div className="xl:hidden flex items-center shrink-0">
            <button
              onClick={toggleDrawer}
              className="p-2 rounded-lg text-[#1C1B1A] hover:bg-black/5 transition-colors"
              aria-label="Abrir menú"
            >
              {isDrawerOpen ? <X className="w-7 h-7 sm:w-8 sm:h-8" /> : <Menu className="w-7 h-7 sm:w-8 sm:h-8" />}
            </button>
          </div>

        </div>
      </div>

      {/* 3. Menú Mobile tipo Drawer Vertical */}
      {isDrawerOpen && (
        <div className="xl:hidden fixed inset-0 top-20 sm:top-28 bg-black/40 backdrop-blur-sm z-40" onClick={toggleDrawer}>
          <div 
            className="w-full bg-[#FAF6F0] border-b border-[#D4A343]/30 p-6 flex flex-col gap-5 shadow-2xl animate-in slide-in-from-top duration-300 max-h-[calc(100vh-5rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-3">
              <Link 
                href="/" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-[#1C1B1A] hover:bg-white/80 transition-colors"
              >
                INICIO
              </Link>
              <Link 
                href="#quienes-somos" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-gray-700 hover:bg-white/80 transition-colors"
              >
                QUIENES SOMOS
              </Link>
              <Link 
                href="#tracking" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-gray-700 hover:bg-white/80 transition-colors flex items-center gap-2"
              >
                <PackageCheck className="w-5 h-5 text-[#D4A343]" />
                TRACKING
              </Link>
              <Link 
                href="#contacto" 
                onClick={toggleDrawer}
                className="px-4 py-2.5 rounded-xl font-semibold text-base text-gray-700 hover:bg-white/80 transition-colors"
              >
                CONTACTO
              </Link>
            </nav>

            <div className="h-px w-full bg-gray-200 my-1" />

            {/* Botones verticales Mobile */}
            <div className="flex flex-col gap-3">
              <Link
                href="/products/personalized-wall-Art"
                onClick={toggleDrawer}
                className="w-full flex items-center justify-center gap-2 bg-[#D4A343] hover:bg-[#b88c32] text-white py-3 rounded-xl font-bold text-base shadow-md"
              >
                <PlusCircle className="w-5 h-5" />
                CREAR
              </Link>

              <Link
                href="/auth/login"
                onClick={toggleDrawer}
                className="w-full flex items-center justify-center gap-2 bg-[#1C1B1A] hover:bg-black text-white py-3 rounded-xl font-bold text-base shadow-md"
              >
                <User className="w-5 h-5" />
                INGRESAR
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
