"use client";

import { useRef, useState } from "react";
import { createCooitzaBrowserClient } from "@/lib/db/cooitza-browser";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/cn";

/**
 * Subida de imagen directa a Supabase Storage (con la sesión del usuario).
 * Devuelve la URL pública vía onChange. Variantes: 'avatar' (redondo) y 'rect'.
 *
 * Para 'avatars' la policy exige que el path empiece con {uid}/, así que pasá
 * pathPrefix = userId. Para 'reward-images' (solo admin) cualquier path sirve.
 */
export function ImageUpload({
  bucket,
  pathPrefix,
  value,
  onChange,
  variant = "rect",
  name = "",
}: {
  bucket: string;
  pathPrefix: string;
  value?: string | null;
  onChange: (url: string) => void;
  variant?: "rect" | "avatar";
  name?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Elegí un archivo de imagen.");
    if (file.size > 5 * 1024 * 1024) return setError("La imagen no puede pesar más de 5 MB.");

    setUploading(true);
    try {
      const supabase = createCooitzaBrowserClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setError("No se pudo subir la imagen. Intentá de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  const pick = () => inputRef.current?.click();

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {variant === "avatar" ? (
        <div className="flex items-center gap-4">
          <Avatar name={name} url={value || null} size="lg" />
          <div className="space-y-1">
            <button
              type="button"
              onClick={pick}
              disabled={uploading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {uploading ? "Subiendo…" : value ? "Cambiar foto" : "Subir foto"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="ml-2 text-xs text-slate-400 underline"
              >
                Quitar
              </button>
            ) : null}
            <p className="text-[11px] text-slate-400">JPG o PNG, hasta 5 MB.</p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={uploading}
          className={cn(
            "flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 transition hover:border-brand-400",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{uploading ? "Subiendo…" : "📷 Tocá para subir una imagen"}</span>
          )}
        </button>
      )}

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
