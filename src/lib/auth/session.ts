import "server-only";
import { cookies } from "next/headers";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";

export type UserRole = "promoter" | "admin" | "superadmin";
export type UserStatus = "pending_approval" | "active" | "suspended";

export const IMPERSONATION_COOKIE = "cooitza_imp";

export type SessionProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  points_balance: number;
  avatar_url: string | null;
  /** true cuando un admin está viendo el portal como este promotor. */
  impersonating: boolean;
  /** rol real del usuario logueado (no el impersonado). */
  realRole: UserRole;
};

const SELECT = "id, full_name, phone, role, status, points_balance, avatar_url";

/**
 * Lee la sesión actual (cookies) y su profile desde la BD de Cooitza.
 * La verificación de rol/status SIEMPRE se hace server-side contra la BD.
 *
 * Impersonación: si el usuario real es admin y existe la cookie de
 * impersonación con un promotor válido, devuelve el profile de ESE promotor
 * (con impersonating=true). RLS permite al admin leerlo. Las páginas del portal
 * filtran por profile.id, así que muestran los datos del promotor impersonado.
 */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createCooitzaServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: real, error: profileError } = await supabase
    .from("profiles")
    .select(SELECT)
    .eq("id", user.id)
    .single();
  if (profileError || !real) return null;

  const realRole = real.role as UserRole;

  // ¿Impersonando?
  if (isAdminRole(realRole)) {
    const cookieStore = await cookies();
    const impId = cookieStore.get(IMPERSONATION_COOKIE)?.value;
    if (impId && impId !== user.id) {
      const { data: imp } = await supabase.from("profiles").select(SELECT).eq("id", impId).single();
      if (imp) {
        return {
          id: imp.id,
          email: "",
          full_name: imp.full_name,
          phone: imp.phone,
          role: imp.role as UserRole,
          status: imp.status as UserStatus,
          points_balance: imp.points_balance,
          avatar_url: imp.avatar_url ?? null,
          impersonating: true,
          realRole,
        };
      }
    }
  }

  return {
    id: real.id,
    email: user.email ?? "",
    full_name: real.full_name,
    phone: real.phone,
    role: realRole,
    status: real.status as UserStatus,
    points_balance: real.points_balance,
    avatar_url: real.avatar_url ?? null,
    impersonating: false,
    realRole,
  };
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}
