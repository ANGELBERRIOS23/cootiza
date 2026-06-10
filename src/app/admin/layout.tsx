import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";
import { SignOutButton } from "@/components/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";

/**
 * Layout del panel admin. Verificación server-side:
 *  - sin sesión → /login
 *  - no admin   → 404 (notFound) — NO 403, para no revelar que el panel existe.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (!isAdminRole(profile.role)) notFound();

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/admin" className="font-bold text-slate-900">
            Cooitza · Admin
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              {profile.full_name} · {profile.role}
            </span>
            <SignOutButton className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50" />
          </div>
        </div>
      </header>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}
