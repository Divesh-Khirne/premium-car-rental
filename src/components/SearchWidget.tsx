"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Clock, MapPin, Search } from "lucide-react";
import { inputCls } from "./ui";
import { LOCATIONS } from "@/lib/config";
import { addDaysISO, todayISO } from "@/lib/utils";
import { calcRental } from "./../lib/pricing";

/** Booking widget: sends the visitor to /cars with the dates, so the list shows real availability. */
export function SearchWidget() {
  const router = useRouter();
  const today = todayISO();
  const [f, setF] = useState({ location: "", pickupDate: addDaysISO(today, 1), pickupTime: "10:00", returnDate: addDaysISO(today, 4), returnTime: "10:00" });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = calcRental(f, 1);
    if (!r.ok) return setErr(r.error);
    if (f.pickupDate < today) return setErr("Pickup date cannot be in the past.");
    setErr("");
    router.push(`/cars?${new URLSearchParams(f).toString()}`);
  }

  const cell = "relative";
  const icon = "pointer-events-none absolute left-3 top-[2.35rem] text-slate-400";
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-lift sm:p-6" aria-label="Search available cars">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_.8fr_1fr_.8fr_auto] lg:items-end">
        <label className={cell}><span className="mb-1.5 block text-sm font-medium">Pickup location</span><MapPin size={16} className={icon} />
          <input list="locations" value={f.location} onChange={set("location")} placeholder="Airport, city, hotel" className={`${inputCls} pl-9`} />
          <datalist id="locations">{LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist></label>
        <label className={cell}><span className="mb-1.5 block text-sm font-medium">Pickup date</span><CalendarDays size={16} className={icon} />
          <input type="date" min={today} value={f.pickupDate} onChange={set("pickupDate")} required className={`${inputCls} pl-9`} /></label>
        <label className={cell}><span className="mb-1.5 block text-sm font-medium">Pickup time</span><Clock size={16} className={icon} />
          <input type="time" value={f.pickupTime} onChange={set("pickupTime")} required className={`${inputCls} pl-9`} /></label>
        <label className={cell}><span className="mb-1.5 block text-sm font-medium">Return date</span><CalendarDays size={16} className={icon} />
          <input type="date" min={f.pickupDate} value={f.returnDate} onChange={set("returnDate")} required className={`${inputCls} pl-9`} /></label>
        <label className={cell}><span className="mb-1.5 block text-sm font-medium">Return time</span><Clock size={16} className={icon} />
          <input type="time" value={f.returnTime} onChange={set("returnTime")} required className={`${inputCls} pl-9`} /></label>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-700 md:col-span-2 lg:col-span-1"><Search size={16} />Search cars</button>
      </div>
      {err && <p role="alert" className="mt-3 text-sm font-medium text-rose-600">{err}</p>}
    </form>
  );
}
