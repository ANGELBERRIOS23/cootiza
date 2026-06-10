"use client";

import { useState } from "react";
import { createCooitzaBrowserClient } from "@/lib/db/cooitza-browser";

/**
 * Botón de login con Google. Usa OAuth de Supabase con scopes básicos
 * (openid/email/profile) — no requiere verificación de la app de Google ni
 * muestra advertencia de "app no verificada".
 *
 * Redirige a /auth/callback que intercambia el code por sesión.
 */
export function GoogleButton({ next }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createCooitzaBrowserClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const callback = new URL("/auth/callback", siteUrl);
    if (next) callback.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (error) {
      setLoading(false);
      alert("No se pudo iniciar con Google. Intentá de nuevo.");
    }
    // Si no hay error, el navegador redirige a Google.
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
        <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 4.75 12 4.75Z" />
      </svg>
      {loading ? "Conectando…" : "Continuar con Google"}
    </button>
  );
}
