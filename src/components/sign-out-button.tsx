/**
 * Botón de cerrar sesión. Es un form que hace POST a /auth/signout
 * (POST para que un prefetch no cierre la sesión por accidente).
 */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={
          className ??
          "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        }
      >
        Cerrar sesión
      </button>
    </form>
  );
}
