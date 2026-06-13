import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { appConfig } from "@/lib/config";
import { PortalNav } from "@/components/portal/portal-nav";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { ImpersonationBanner } from "@/components/impersonation-banner";

/**
 * Layout del portal del promotor. Verificación server-side en CADA request:
 *  - sin sesión → /login
 *  - status pending_approval → /cuenta-pendiente
 *  - status suspended → /cuenta-suspendida
 * Si un admin está impersonando, se muestra una barra para volver.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.status === "pending_approval") redirect("/cuenta-pendiente");
  if (profile.status === "suspended") redirect("/cuenta-suspendida");
  // Onboarding obligatorio: promotor aprobado sin agencia debe completar su
  // perfil antes de usar el portal. (No aplica cuando un admin impersona.)
  if (profile.role === "promoter" && !profile.impersonating && !profile.agency_id) {
    redirect("/completar-perfil");
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      {profile.impersonating ? <ImpersonationBanner name={profile.full_name} /> : null}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5">
          <Link href="/portal" className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" className="h-7 w-auto sm:h-8" />
            <span className="text-sm font-black text-[#0B4EA2]">×</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} className="h-8 w-auto sm:h-9" />
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell userId={profile.id} />
            <UserMenu
              name={profile.full_name || "Promotor"}
              role={profile.impersonating ? "vista de promotor" : profile.role}
              avatarUrl={profile.avatar_url}
              profileHref="/portal/perfil"
            />
          </div>
        </div>
      </header>
      <PortalNav />
      {/* pb-24 en móvil para no tapar contenido con la barra inferior fija */}
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24 sm:pb-6">{children}</main>
    </div>
  );
}
