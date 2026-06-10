import { SignOutButton } from "@/components/sign-out-button";

export const metadata = { title: "Cuenta suspendida — Cooitza" };

export default function CuentaSuspendidaPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
          🚫
        </div>
        <h1 className="text-lg font-bold text-slate-900">Cuenta suspendida</h1>
        <p className="text-sm text-slate-500">
          Tu acceso al portal está suspendido. Si creés que es un error, contactá al
          equipo de Viajexmundo.
        </p>
        <SignOutButton />
      </div>
    </main>
  );
}
