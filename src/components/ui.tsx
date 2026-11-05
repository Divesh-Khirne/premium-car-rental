import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cn, STATUS_STYLE } from "@/lib/utils";

/** Presentational helpers (no client-side code, usable from server and client components). */
export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 shadow-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:bg-slate-50 disabled:text-slate-400";

export function buttonCls(variant: "primary" | "gold" | "outline" | "ghost" | "danger" = "primary", size: "sm" | "md" | "lg" = "md") {
  const v = {
    primary: "bg-navy text-white hover:bg-navy-700",
    gold: "bg-gold text-navy hover:bg-gold-dark hover:text-white",
    outline: "border border-slate-300 bg-white text-navy hover:border-navy",
    ghost: "text-navy hover:bg-navy/5",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }[variant];
  const s = { sm: "px-3 py-1.5 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" }[size];
  return cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50", v, s);
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span role="alert" className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset", STATUS_STYLE[status] ?? "bg-slate-100 text-slate-700 ring-slate-200", className)}>{status}</span>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(value) ? "fill-gold text-gold" : "text-slate-300"} />)}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeading({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        {text && <p className="mt-2 text-slate-600">{text}</p>}
      </div>
      {action}
    </div>
  );
}
