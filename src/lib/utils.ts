import { CURRENCY } from "./config";

export function cn(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

export function money(n: number | string, fractions = 0) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY, maximumFractionDigits: fractions, minimumFractionDigits: fractions }).format(Number(n));
}
export function fmtDate(d: string) {
  return new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
export function fmtTime(t: string) { return t.slice(0, 5); }
export function initials(name: string) { return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("") || "U"; }
export function todayISO() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
export function addDaysISO(iso: string, n: number) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

export const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-300",
};
