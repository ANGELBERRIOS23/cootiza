import { NextResponse, type NextRequest } from "next/server";
import { createCooitzaServerClient } from "@/lib/db/cooitza-server";

/**
 * Cierra la sesión y vuelve al login. POST para evitar logout por prefetch.
 */
export async function POST(request: NextRequest) {
  const supabase = await createCooitzaServerClient();
  await supabase.auth.signOut();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
