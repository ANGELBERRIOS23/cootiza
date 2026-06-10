import Link from "next/link";
import { cn } from "@/lib/cn";

/* ============================================================================
 * Componentes UI base del portal Cooitza. Ligeros (solo Tailwind), pensados
 * mobile-first y consistentes en mobile + desktop. Sin dependencias externas.
 * ========================================================================== */

// --- Button -----------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

// --- Card --------------------------------------------------------------------
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

// --- Badge -------------------------------------------------------------------
type BadgeTone = "neutral" | "brand" | "green" | "amber" | "red" | "blue";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-brand-100 text-brand-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// --- Field (label + input) ---------------------------------------------------
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

// --- EmptyState --------------------------------------------------------------
export function EmptyState({
  emoji = "🗂️",
  title,
  description,
  action,
}: {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <span className="text-4xl">{emoji}</span>
      <h3 className="text-base font-bold text-slate-700">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action}
    </div>
  );
}

// --- StatCard ----------------------------------------------------------------
export function StatCard({
  label,
  value,
  sub,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "brand" | "green" | "amber" | "slate";
}) {
  const valueColor = {
    brand: "text-brand-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
    slate: "text-slate-800",
  }[tone];
  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("mt-1 text-2xl font-black tabular-nums", valueColor)}>{value}</p>
      {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
    </Card>
  );
}
