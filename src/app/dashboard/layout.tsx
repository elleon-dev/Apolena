import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser, isAdminRole, resolveUserRole } from "@/lib/auth";
import { findProfileById } from "@/lib/db-service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();

  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  // Verificación en vivo contra la base de datos para impedir sesiones con rol desactualizado
  const profile = await findProfileById(session.id);
  const effectiveRole = resolveUserRole(
    profile?.email || session.email,
    profile?.role || session.role,
  );

  if (!profile?.is_active || !isAdminRole(effectiveRole)) {
    redirect("/orders");
  }

  return <>{children}</>;
}
