"use client";

import { useActionState } from "react";
import { loginWithPassword, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginWithPassword,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Correo</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.com"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Contraseña</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
        />
      </label>

      {state?.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
