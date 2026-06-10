"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPromotersBulk, type BulkRow } from "@/lib/admin/promoters";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";

type Row = { full_name: string; email: string; password: string; phone: string };
const emptyRow = (): Row => ({ full_name: "", email: "", password: "", phone: "" });

function randomPassword(): string {
  // crypto.getRandomValues: Math.random() no es seguro para generar credenciales.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint32Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => chars[n % chars.length]).join("");
}

/** Mapea un encabezado del archivo a nuestro campo. */
function fieldOf(header: string): keyof Row | null {
  const h = header.trim().toLowerCase();
  if (/(nombre|name)/.test(h)) return "full_name";
  if (/(correo|email|e-mail|mail)/.test(h)) return "email";
  if (/(contrase|password|clave)/.test(h)) return "password";
  if (/(tel|phone|celular|móvil|movil)/.test(h)) return "phone";
  return null;
}

type Agency = { id: string; name: string; region: string };

export function CreatePromotersModal({ agencies = [] }: { agencies?: Agency[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [agencyId, setAgencyId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ email: string; ok: boolean; error?: string; password?: string }[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setRows([emptyRow()]);
    setResults(null);
    setSubmitting(false);
  }
  function close() {
    setOpen(false);
    reset();
  }

  function update(i: number, key: keyof Row, val: string) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, emptyRow()]);
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length === 1 ? [emptyRow()] : rs.filter((_, idx) => idx !== i)));
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
      if (matrix.length === 0) return;

      // Primera fila = encabezados; mapear columnas a campos.
      const headers = (matrix[0] as unknown[]).map((c) => String(c ?? ""));
      const colMap = headers.map(fieldOf);
      const hasHeader = colMap.some(Boolean);
      const dataRows = hasHeader ? matrix.slice(1) : matrix;
      const order: (keyof Row)[] = ["full_name", "email", "password", "phone"];

      const parsed: Row[] = dataRows
        .map((cells) => {
          const r = emptyRow();
          (cells as unknown[]).forEach((cell, idx) => {
            const field = hasHeader ? colMap[idx] : order[idx];
            if (field) r[field] = String(cell ?? "").trim();
          });
          return r;
        })
        .filter((r) => r.full_name || r.email);

      if (parsed.length) setRows(parsed);
    } catch {
      alert("No se pudo leer el archivo. Asegurate de que sea CSV o Excel con columnas nombre, correo, contraseña.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit() {
    const clean: BulkRow[] = rows
      .filter((r) => r.full_name.trim() && r.email.trim())
      .map((r) => ({
        full_name: r.full_name.trim(),
        email: r.email.trim(),
        password: r.password.trim() || randomPassword(),
        phone: r.phone.trim(),
        agency_id: agencyId || null,
      }));
    if (clean.length === 0) {
      alert("Agregá al menos un promotor con nombre y correo.");
      return;
    }
    setSubmitting(true);
    const { results } = await createPromotersBulk(clean);
    // Adjuntar la contraseña usada (para compartirla) a cada resultado ok.
    const withPwd = results.map((res) => {
      const src = clean.find((c) => c.email === res.email);
      return { ...res, password: res.ok ? src?.password : undefined };
    });
    setResults(withPwd);
    setSubmitting(false);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Nuevo promotor</Button>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold text-slate-800">Crear promotores</h2>
          <button onClick={close} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>

        {results ? (
          // --- Resultados ---
          <div className="space-y-3 p-5">
            <p className="text-sm text-slate-600">
              {results.filter((r) => r.ok).length} creados · {results.filter((r) => !r.ok).length} con error.
              Guardá las contraseñas para compartirlas con cada promotor.
            </p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <tr><th className="px-3 py-2">Correo</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Contraseña</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r.email}>
                      <td className="px-3 py-2 text-slate-700">{r.email}</td>
                      <td className="px-3 py-2">{r.ok ? <span className="text-emerald-600">✓ Creado</span> : <span className="text-red-600">{r.error}</span>}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{r.password ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { reset(); }}>Crear más</Button>
              <Button onClick={close}>Listo</Button>
            </div>
          </div>
        ) : (
          // --- Editor ---
          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">Cargá uno por uno o importá un archivo. Si dejás la contraseña vacía, se genera una automática.</p>
              <div>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
                <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Importar CSV/Excel
                </button>
              </div>
            </div>

            {agencies.length > 0 ? (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Agencia <span className="font-normal text-slate-400">(se aplica a todos los de este lote)</span></span>
                <select className={cn(inputClass, "py-2")} value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
                  <option value="">Sin agencia</option>
                  {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.region}</option>)}
                </select>
              </label>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-2 py-2">Nombre*</th><th className="px-2 py-2">Correo*</th>
                    <th className="px-2 py-2">Contraseña</th><th className="px-2 py-2">Teléfono</th><th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="p-1"><input className={cn(inputClass, "py-2")} value={r.full_name} onChange={(e) => update(i, "full_name", e.target.value)} /></td>
                      <td className="p-1"><input className={cn(inputClass, "py-2")} value={r.email} onChange={(e) => update(i, "email", e.target.value)} /></td>
                      <td className="p-1"><input className={cn(inputClass, "py-2")} value={r.password} placeholder="(auto)" onChange={(e) => update(i, "password", e.target.value)} /></td>
                      <td className="p-1"><input className={cn(inputClass, "py-2")} value={r.phone} onChange={(e) => update(i, "phone", e.target.value)} /></td>
                      <td className="p-1 text-center"><button onClick={() => removeRow(i)} className="text-slate-300 hover:text-red-500" aria-label="Quitar fila">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="text-sm font-semibold text-brand-600 hover:text-brand-700">+ Agregar fila</button>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button variant="ghost" onClick={close}>Cancelar</Button>
              <Button onClick={submit} disabled={submitting}>{submitting ? "Creando…" : "Crear promotores"}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
