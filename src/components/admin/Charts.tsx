import { money } from "@/lib/utils";

/** Lightweight, dependency-free charts (pure HTML/CSS) so there is nothing extra to install. */
export function ColumnChart({ data, currency = false }: { data: { label: string; value: number }[]; currency?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-48 items-end gap-2 sm:gap-3" role="img" aria-label="Column chart">
      {data.map((d) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[11px] font-medium text-slate-600">{currency ? money(d.value) : d.value}</span>
          <div className="w-full rounded-t-lg bg-gold" style={{ height: `${Math.max(4, (d.value / max) * 100)}%`, opacity: d.value ? 1 : 0.25 }} />
          <span className="text-xs text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
export function BarList({ data, currency = false, empty = "No data yet" }: { data: { label: string; value: number }[]; currency?: boolean; empty?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm"><span className="truncate pr-3 text-navy">{d.label}</span><span className="font-medium text-slate-600">{currency ? money(d.value) : d.value}</span></div>
          <div className="h-2.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-navy" style={{ width: `${(d.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
