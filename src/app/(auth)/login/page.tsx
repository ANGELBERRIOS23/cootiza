import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile, homePathForRole } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import { GoogleButton } from "./google-button";

export const metadata = { title: "Iniciar sesión — Cooitza" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Google OAuth se muestra solo si está habilitado (degradación elegante:
  // sin el flag el portal funciona perfecto solo con correo/contraseña).
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  // Si ya hay sesión activa, mandar al destino correcto.
  const profile = await getSessionProfile();
  if (profile) {
    if (profile.status === "suspended") redirect("/cuenta-suspendida");
    if (profile.status === "pending_approval") redirect("/cuenta-pendiente");
    redirect(homePathForRole(profile.role));
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f2a43] via-brand-800 to-brand-700 px-4 py-10">
      {/* atmósfera */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" className="h-12 w-auto rounded-xl bg-white/95 px-3 py-1.5 shadow-lg" />
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">Portal de Promotores</h1>
          <p className="mt-1 text-sm text-white/70">Iniciá sesión para continuar</p>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white p-6 shadow-2xl">
          {googleEnabled ? (
            <>
              <GoogleButton next={next} />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">o con tu correo</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          ) : null}

          <LoginForm next={next} />
        </div>

        <p className="text-center text-xs text-white/60">
          ¿Sos promotor y no tenés cuenta? Pedí tu acceso al equipo de Viajexmundo.
        </p>
        <p className="text-center">
          <Link href="/" className="text-xs font-medium text-white/70 underline underline-offset-4 hover:text-white">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
