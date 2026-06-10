import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { SignOutButton } from "@/components/sign-out-button";

/**
 * Layout del portal del promotor. Verificación server-side en CADA request:
 *  - sin sesión → /login
 *  - status pending_approval → /cuenta-pendiente
 *  - status suspended → /cuenta-suspendida
 * Solo un promotor (o admin) con status 'active' ve el portal.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.status === "pending_approval") redirect("/cuenta-pendiente");
  if (profile.status === "suspended") redirect("/cuenta-suspendida");

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/portal" className="font-bold text-slate-900">
            Cooitza
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{profile.full_name}</span>
            <SignOutButton className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
