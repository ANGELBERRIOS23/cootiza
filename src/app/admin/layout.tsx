import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionProfile, isAdminRole } from "@/lib/auth/session";
import { appConfig } from "@/lib/config";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserMenu } from "@/components/user-menu";

/**
 * Layout del panel admin. Verificación server-side:
 *  - sin sesión → /login
 *  - no admin   → 404 (notFound) — NO 403, para no revelar que el panel existe.
 *  - impersonando → /portal (no se opera el panel mientras se impersona).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (!isAdminRole(profile.realRole)) notFound();
  if (profile.impersonating) redirect("/portal");

  return (
    <div className="min-h-dvh bg-slate-100">
      <div className="sticky top-0 z-30">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-2.5">
          <Link href="/admin" className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" className="h-7 w-auto sm:h-8" />
            <span className="text-sm font-black text-[#0B4EA2]">×</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} className="h-8 w-auto sm:h-9" />
            <span className="ml-1 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Admin
            </span>
          </Link>
          <UserMenu
            name={profile.full_name || "Admin"}
            role={profile.role}
            avatarUrl={profile.avatar_url}
            profileHref="/admin/perfil"
          />
        </div>
      </header>
      <AdminNav />
      </div>
      <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
    </div>
  );
}
