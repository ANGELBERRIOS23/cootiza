"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { LeadForm } from "./lead-form";
import { Button } from "@/components/ui";

/**
 * Botón "Registrar cliente interesado" que abre el formulario en un MODAL.
 * Reusa LeadForm (con su propio estado de éxito/error). Cierra con ✕, backdrop o Esc.
 */
export function LeadFormModal({ packageVxmId, packageTitle }: { packageVxmId?: string; packageTitle?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full">
        <UserPlus className="mr-1.5 inline h-4 w-4" />Registrar cliente interesado
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="my-6 w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-800">Registrar cliente interesado</h2>
                {packageTitle ? <p className="truncate text-xs text-slate-500">{packageTitle}</p> : null}
              </div>
              <button onClick={() => setOpen(false)} className="shrink-0 text-slate-400 hover:text-slate-700" aria-label="Cerrar">✕</button>
            </div>
            <div className="p-5">
              <LeadForm packageVxmId={packageVxmId} packageTitle={packageTitle} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
