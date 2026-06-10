"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Botón que ejecuta una Server Action admin (que devuelve {ok}|{ok,error}),
 * muestra estado de carga, error inline y refresca la vista al terminar.
 * Opcional: confirm() antes de ejecutar.
 */
export function ActionButton({
  action,
  children,
  variant = "secondary",
  size = "sm",
  confirm,
  className,
}: {
  action: () => Promise<{ ok: true } | { ok: false; error: string }>;
  children: React.ReactNode;
  variant?: Variant;
  size?: "sm" | "md";
  confirm?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <Button variant={variant} size={size} onClick={run} disabled={pending} className={cn(className)}>
        {pending ? "…" : children}
      </Button>
      {error ? <span className="text-[10px] text-red-600">{error}</span> : null}
    </span>
  );
}
