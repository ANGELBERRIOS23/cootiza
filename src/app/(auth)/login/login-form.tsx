"use client";

import { useState } from "react";

/**
 * Login con email + contraseña. Hace POST a /auth/login (Route Handler) que
 * inicia sesión SERVER-side y setea las cookies en la respuesta de forma
 * confiable, luego devuelve el destino. Sin el problema de timing del login
 * client-side (cookies asíncronas) ni del Server Action + useActionState
 * (redirect colgado con Turbopack).
 */
export function LoginForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Ingresá tu correo y contraseña.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next }),
      });
      const data = await res.json();

      if (!res.ok || !data?.redirect) {
        setError(data?.error ?? "No se pudo iniciar sesión.");
        setLoading(false);
        return;
      }

      // Cookies ya seteadas por el server. Navegación dura para que el
      // middleware lea la sesión fresca.
      window.location.assign(data.redirect);
    } catch {
      setError("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
