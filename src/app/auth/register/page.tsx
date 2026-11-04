"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo completar el registro.");
        return;
      }
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-stone-900">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full mx-auto bg-white border border-cream-200 rounded-3xl p-8 shadow-soft space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-3xl font-semibold text-stone-900">
              Crea tu cuenta en Apolena
            </h1>
            <p className="text-xs text-stone-500">
              Guarda tus retratos generados con IA y haz seguimiento de tus
              cuadros personalizados.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-terracotta-50 border border-terracotta-100 text-terracotta-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 block">
                Nombre completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Valeria Mendoza"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 block">
                Celular / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="999 888 777"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-800 block">
                Contraseña (mín. 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-cream-50 border border-cream-200 text-xs text-stone-900 focus:border-terracotta-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-soft transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Registrarme en Apolena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-stone-500">
            ¿Ya tienes una cuenta?{" "}
            <Link
              href="/auth/login"
              className="text-terracotta-600 font-semibold hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
