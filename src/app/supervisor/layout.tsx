import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile, homePathForRole } from "@/lib/auth/session";
import { appConfig } from "@/lib/config";
import { UserMenu } from "@/components/user-menu";

/**
 * Layout del área de Supervisor. Solo rol 'supervisor' (o admin) entra; el resto
 * va a su propia home. El supervisor supervisa su agencia/región y puede referir
 * clientes, pero no administra el sistema.
 */
export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.realRole !== "supervisor" && profile.realRole !== "admin" && profile.realRole !== "superadmin") {
    redirect(homePathForRole(profile.realRole));
  }
  if (profile.status === "suspended") redirect("/cuenta-suspendida");

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2.5">
          <Link href="/supervisor" className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/COOITZA-LOGO-WEB-1.png" alt="Cooitza" className="h-7 w-auto" />
            <span className="text-sm font-black text-[#0B4EA2]">×</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={appConfig.agencyLogoUrl} alt={appConfig.agencyName} className="h-6 w-auto" />
            <span className="ml-1 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Supervisor
            </span>
          </Link>
          <UserMenu
            name={profile.full_name || "Supervisor"}
            role={profile.role}
            avatarUrl={profile.avatar_url}
            profileHref="/supervisor/perfil"
          />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
