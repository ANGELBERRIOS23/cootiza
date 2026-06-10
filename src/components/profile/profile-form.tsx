"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/lib/profile/actions";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { ImageUpload } from "@/components/image-upload";
import { cn } from "@/lib/cn";

/** Form de "Mi perfil" compartido por admin y promotor. */
export function ProfileForm({
  userId,
  initial,
}: {
  userId: string;
  initial: { full_name: string; phone: string | null; avatar_url: string | null };
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [avatar, setAvatar] = useState(initial.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await updateMyProfile({ full_name: fullName, phone, avatar_url: avatar });
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Perfil guardado ✓" } : { ok: false, text: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <Card className="space-y-5 p-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-700">Foto de perfil</p>
        <ImageUpload bucket="avatars" pathPrefix={userId} value={avatar} onChange={setAvatar} variant="avatar" name={fullName} />
      </div>

      <Field label="Nombre completo">
        <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>

      <Field label="Teléfono" hint="Opcional">
        <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+502 ..." />
      </Field>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
        {msg ? <span className={cn("text-sm", msg.ok ? "text-emerald-600" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </Card>
  );
}
