import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile, homePathForRole } from "@/lib/auth/session";
import { appConfig } from "@/lib/config";
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
    <main className="flex min-h-dvh items-center justify-center bg-brand-800 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          {/* Logos Cooitza × Viajexmundo, emparejados y simétricos (como en la landing) */}
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/95 px-5 py-3 shadow-lg sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" className="h-9 w-auto sm:h-10" />
            <span className="text-base font-black text-[#0B4EA2] sm:text-lg">×</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} className="h-10 w-auto sm:h-12" />
          </div>
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
