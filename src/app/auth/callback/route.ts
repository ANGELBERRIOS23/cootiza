import { NextResponse, type NextRequest } from "next/server";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";

/**
 * Callback de OAuth (Google). Supabase redirige acá con un `code` que
 * intercambiamos por una sesión (cookies). Luego mandamos al usuario al
 * destino correcto según su rol/status.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;

  if (code) {
    const supabase = await createCooitzaServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=oauth`);
    }
  }

  // Decidir destino según el profile.
  const profile = await getSessionProfile();
  if (!profile) return NextResponse.redirect(`${origin}/login?error=session`);
  if (profile.status === "suspended") return NextResponse.redirect(`${origin}/cuenta-suspendida`);
  if (profile.status === "pending_approval") return NextResponse.redirect(`${origin}/cuenta-pendiente`);

  const dest = next && next.startsWith("/") ? next : isAdminRole(profile.role) ? "/admin" : "/portal";
  return NextResponse.redirect(`${origin}${dest}`);
}
