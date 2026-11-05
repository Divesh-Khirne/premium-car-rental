"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BookedRange } from "@/types";
import { todayISO } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** Read-only calendar: days that overlap an existing booking are struck through. */
export function AvailabilityCalendar({ ranges }: { ranges: BookedRange[] }) {
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const today = todayISO();
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const y = view.getFullYear(), m = view.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  const next = (d: string) => { const t = new Date(d + "T00:00:00"); t.setDate(t.getDate() + 1); return iso(t.getFullYear(), t.getMonth(), t.getDate()); };
  const busy = (d: string) => ranges.some((r) => r.pickup_at < `${next(d)}T00:00:00` && r.return_at > `${d}T00:00:00`);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} aria-label="Previous month" className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
        <p className="font-semibold text-navy">{view.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
        <button onClick={() => setOffset((o) => Math.min(11, o + 1))} aria-label="Next month" className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => <span key={d} className="py-1 font-medium text-slate-400">{d}</span>)}
        {Array.from({ length: first }).map((_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = iso(y, m, i + 1), past = d < today, b = !past && busy(d);
          return <span key={d} title={b ? "Booked" : past ? "" : "Available"} className={`grid aspect-square place-items-center rounded-lg text-sm ${past ? "text-slate-300" : b ? "bg-rose-50 text-rose-400 line-through" : "bg-emerald-50 text-emerald-800"} ${d === today ? "ring-1 ring-gold" : ""}`}>{i + 1}</span>;
        })}
      </div>
      <p className="mt-3 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-emerald-100" />Available</span><span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded bg-rose-100" />Booked</span></p>
    </div>
  );
}
