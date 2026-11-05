"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { BookedRange } from "@/types";
import { Field, buttonCls, inputCls } from "./ui";
import { calcRental } from "@/lib/pricing";
import { addDaysISO, money, todayISO } from "@/lib/utils";

/** Sidebar on the car page: pick dates, see the estimate, continue to the booking page. */
export function QuickBook({ carId, price, available, ranges, defaults }: { carId: string; price: number; available: boolean; ranges: BookedRange[]; defaults: Record<string, string | undefined> }) {
  const router = useRouter();
  const today = todayISO();
  const [f, setF] = useState({
    pickupDate: defaults.pickupDate || addDaysISO(today, 1), pickupTime: defaults.pickupTime || "10:00",
    returnDate: defaults.returnDate || addDaysISO(today, 4), returnTime: defaults.returnTime || "10:00", location: defaults.location || "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const calc = useMemo(() => calcRental(f, price), [f, price]);
  const clash = useMemo(() => {
    const s = `${f.pickupDate}T${f.pickupTime}:00`, e = `${f.returnDate}T${f.returnTime}:00`;
    return ranges.some((r) => r.pickup_at < e && r.return_at > s);
  }, [f, ranges]);
  const pastErr = f.pickupDate < today ? "Pickup date cannot be in the past." : "";
  const error = !calc.ok ? calc.error : pastErr || (clash ? "This car is already booked for part of that period." : "");

  function go(e: React.FormEvent) { e.preventDefault(); if (!error && available) router.push(`/booking?carId=${carId}&${new URLSearchParams(f).toString()}`); }

  return (
    <form onSubmit={go} className="card space-y-4 p-5 sm:p-6">
      <h2 className="text-2xl">Reserve this car</h2>
      <Field label="Pickup location"><input value={f.location} onChange={set("location")} placeholder="Airport, city, hotel" className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Pickup date"><input type="date" min={today} value={f.pickupDate} onChange={set("pickupDate")} required className={inputCls} /></Field>
        <Field label="Pickup time"><input type="time" value={f.pickupTime} onChange={set("pickupTime")} required className={inputCls} /></Field>
        <Field label="Return date"><input type="date" min={f.pickupDate} value={f.returnDate} onChange={set("returnDate")} required className={inputCls} /></Field>
        <Field label="Return time"><input type="time" value={f.returnTime} onChange={set("returnTime")} required className={inputCls} /></Field>
      </div>
      <div className="rounded-xl bg-surface p-4 text-sm">
        <div className="flex justify-between"><span className="text-slate-600">{money(price)} &times; {calc.ok ? calc.days : 0} day{calc.ok && calc.days === 1 ? "" : "s"}</span><span className="font-medium">{calc.ok ? money(calc.total) : "-"}</span></div>
        <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-semibold text-navy">Estimated total</span><span className="font-display text-xl font-semibold text-navy">{calc.ok ? money(calc.total) : "-"}</span></div>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-rose-600">{error}</p>}
      <button disabled={!!error || !available} className={`${buttonCls("gold", "lg")} w-full`}>{available ? "Continue to booking" : "Currently unavailable"}</button>
      <p className="flex gap-2 text-xs text-slate-500"><Info size={14} className="mt-0.5 shrink-0" />The final price is confirmed by our server. Payment is taken at pickup.</p>
    </form>
  );
}
