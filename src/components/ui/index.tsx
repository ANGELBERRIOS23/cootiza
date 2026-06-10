import Link from "next/link";
import { cn } from "@/lib/cn";

/* ============================================================================
 * Sistema UI de Cooitza — "travel-premium": navy/teal de marca + acento dorado
 * (los puntos son oro), tarjetas redondeadas, sombras suaves en capas.
 * Ligero (solo Tailwind), mobile-first, consistente en claro y oscuro.
 * ========================================================================== */

// Borde fino + sombra apenas perceptible. Estética minimal/elegante.
export const softShadow = "shadow-[0_1px_2px_rgba(2,6,23,0.05)]";

// --- Button -----------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-300",
  gold: "bg-amber-500 text-amber-950 hover:bg-amber-600 focus-visible:ring-amber-300",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-slate-300",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs",
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
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-tight transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
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
  target,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-tight transition-all duration-150 active:scale-[0.98]",
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
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white", softShadow, className)}>
      {children}
    </div>
  );
}

// --- Badge -------------------------------------------------------------------
type BadgeTone = "neutral" | "brand" | "green" | "amber" | "red" | "blue" | "gold";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  gold: "bg-amber-100 text-amber-800 ring-amber-300",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset",
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
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100";

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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-sm">{emoji}</span>
      <h3 className="text-base font-bold text-slate-700">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action}
    </div>
  );
}

// --- StatCard ----------------------------------------------------------------
const statTones: Record<string, { value: string; chip: string }> = {
  brand: { value: "text-brand-600", chip: "bg-brand-50 text-brand-600" },
  gold: { value: "text-amber-600", chip: "bg-amber-100 text-amber-700" },
  green: { value: "text-emerald-600", chip: "bg-emerald-50 text-emerald-600" },
  amber: { value: "text-amber-600", chip: "bg-amber-50 text-amber-600" },
  slate: { value: "text-slate-800", chip: "bg-slate-100 text-slate-600" },
};

export function StatCard({
  label,
  value,
  sub,
  tone = "brand",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "brand" | "green" | "amber" | "slate" | "gold";
  icon?: React.ReactNode;
}) {
  const t = statTones[tone] ?? statTones.brand;
  return (
    <Card className="flex items-center gap-3 p-4">
      {icon ? (
        <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg", t.chip)}>
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide leading-tight text-slate-400">{label}</p>
        <p className={cn("text-2xl font-black leading-tight tabular-nums", t.value)}>{value}</p>
        {sub ? <p className="truncate text-[11px] leading-tight text-slate-400">{sub}</p> : null}
      </div>
    </Card>
  );
}

// --- PageHeader (título + acciones) -----------------------------------------
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
