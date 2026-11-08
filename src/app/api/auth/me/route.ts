import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findProfileById } from "@/lib/db-service";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const profile = await findProfileById(session.id);
  return NextResponse.json({
    user: {
      ...session,
      name: profile?.name || session.name,
      phone: profile?.phone || session.phone,
      avatar_url: profile?.avatar_url || session.avatar_url || null,
      address: profile?.address || null,
      district: profile?.district || null,
      department: profile?.department || null,
      role: profile?.role || session.role,
    },
  });
}
