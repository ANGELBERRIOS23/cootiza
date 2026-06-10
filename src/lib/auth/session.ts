import "server-only";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";

export type UserRole = "promoter" | "admin" | "superadmin";
export type UserStatus = "pending_approval" | "active" | "suspended";

export type SessionProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  points_balance: number;
};

/**
 * Lee la sesión actual (cookies) y su profile desde la BD de Cooitza.
 * La verificación de rol/status SIEMPRE se hace server-side contra la BD,
 * nunca confiando en claims del cliente.
 *
 * Devuelve null si no hay sesión válida.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createCooitzaServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, status, points_balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    id: profile.id,
    email: user.email ?? "",
    full_name: profile.full_name,
    phone: profile.phone,
    role: profile.role as UserRole,
    status: profile.status as UserStatus,
    points_balance: profile.points_balance,
  };
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}
