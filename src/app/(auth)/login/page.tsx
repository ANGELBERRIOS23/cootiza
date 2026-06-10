import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";
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
    redirect(isAdminRole(profile.role) ? "/admin" : "/portal");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Portal de Promotores</h1>
          <p className="mt-1 text-sm text-slate-500">Iniciá sesión para continuar</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

        <p className="text-center text-xs text-slate-400">
          ¿Sos promotor y no tenés cuenta? Pedí tu acceso al equipo de Viajexmundo.
        </p>
        <p className="text-center">
          <Link href="/" className="text-xs text-slate-500 underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
