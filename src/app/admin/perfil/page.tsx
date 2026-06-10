import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata = { title: "Mi perfil — Cooitza Admin" };

export default async function AdminPerfilPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Mi perfil</h1>
      <ProfileForm
        userId={profile.id}
        initial={{ full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url }}
      />
    </div>
  );
}
