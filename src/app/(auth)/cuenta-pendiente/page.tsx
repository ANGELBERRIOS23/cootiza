import { SignOutButton } from "@/components/sign-out-button";

export const metadata = { title: "Cuenta pendiente — Cooitza" };

export default function CuentaPendientePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
          ⏳
        </div>
        <h1 className="text-lg font-bold text-slate-900">Cuenta pendiente de aprobación</h1>
        <p className="text-sm text-slate-500">
          Tu cuenta fue creada y está esperando que el equipo de Viajexmundo la apruebe.
          Te avisaremos cuando puedas ingresar.
        </p>
        <SignOutButton />
      </div>
    </main>
  );
}
