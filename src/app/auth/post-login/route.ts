import { NextResponse, type NextRequest } from "next/server";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";

/**
 * Decide a dónde mandar al usuario después de iniciar sesión (email o Google).
 * Lee el profile server-side y redirige según rol/status. Centraliza el ruteo
 * post-login para que el login client-side no tenga que decidirlo.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  const profile = await getSessionProfile();
  if (!profile) return NextResponse.redirect(`${origin}/login`);
  if (profile.status === "suspended") return NextResponse.redirect(`${origin}/cuenta-suspendida`);
  if (profile.status === "pending_approval") return NextResponse.redirect(`${origin}/cuenta-pendiente`);

  const dest = next && next.startsWith("/") ? next : isAdminRole(profile.role) ? "/admin" : "/portal";
  return NextResponse.redirect(`${origin}${dest}`);
}
