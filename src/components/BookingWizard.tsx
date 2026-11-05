"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { BookedRange, Car } from "@/types";
import { CarImage } from "./CarImage";
import { useToast } from "./toast";
import { Field, buttonCls, inputCls } from "./ui";
import { LOCATIONS } from "@/lib/config";
import { calcRental } from "@/lib/pricing";
import { addDaysISO, fmtDate, money, todayISO } from "@/lib/utils";

interface Props { car: Car; ranges: BookedRange[]; profile: { fullName: string; email: string; phone: string }; defaults: Record<string, string | undefined> }

export function BookingWizard({ car, ranges, profile, defaults }: Props) {
  const toast = useToast();
  const today = todayISO();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ id: string; total: number; days: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    location: defaults.location ?? "", pickupDate: defaults.pickupDate || addDaysISO(today, 1), pickupTime: defaults.pickupTime || "10:00",
    returnDate: defaults.returnDate || addDaysISO(today, 4), returnTime: defaults.returnTime || "10:00",
    fullName: profile.fullName, phone: profile.phone, notes: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const calc = useMemo(() => calcRental(f, car.price_per_day), [f, car.price_per_day]);

  function validate() {
    const e: Record<string, string> = {};
    if (f.location.trim().length < 2) e.location = "Enter a pickup location";
    if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!/^[+()\d\s-]{7,20}$/.test(f.phone.trim())) e.phone = "Enter a valid phone number";
    if (f.pickupDate < today) e.pickupDate = "Pickup date cannot be in the past";
    if (!calc.ok) e.returnDate = calc.error;
    else if (ranges.some((r) => r.pickup_at < `${f.returnDate}T${f.returnTime}:00` && r.return_at > `${f.pickupDate}T${f.pickupTime}:00`)) e.returnDate = "This car is already booked for part of that period";
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function submit() {
    setBusy(true);
    try {
      if (f.fullName !== profile.fullName || f.phone !== profile.phone)
        await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: f.fullName, phone: f.phone }) });
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        carId: car.id, pickupLocation: f.location, pickupDate: f.pickupDate, pickupTime: f.pickupTime, returnDate: f.returnDate, returnTime: f.returnTime, notes: f.notes || undefined }) });
      const j = await res.json().catch(() => ({ ok: false, error: "Network error. Please try again." }));
      if (!j.ok) { toast.error(j.error ?? "Booking failed."); if (res.status === 409) setStep(1); return; }
      setDone({ id: j.data.id, total: Number(j.data.total_amount), days: j.data.total_days });
      setStep(3); toast.success("Booking request sent!");
    } finally { setBusy(false); }
  }

  if (step === 3 && done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 size={52} className="mx-auto text-emerald-600" />
        <h1 className="mt-4 text-3xl">Request received</h1>
        <p className="mt-2 text-slate-600">Your {car.brand} {car.name} is held while we review your request. You will see the status change to Confirmed in your dashboard.</p>
        <dl className="mt-6 space-y-2 rounded-xl bg-surface p-4 text-left text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Reference</dt><dd className="font-mono font-semibold">{done.id.slice(0, 8).toUpperCase()}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Duration</dt><dd>{done.days} day{done.days > 1 ? "s" : ""}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Total (server calculated)</dt><dd className="font-semibold">{money(done.total)}</dd></div>
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><Link href={`/dashboard/bookings/${done.id}`} className={buttonCls("primary")}>View booking</Link><Link href="/cars" className={buttonCls("outline")}>Browse more cars</Link></div>
      </motion.div>
    );
  }

  const row = (l: string, v: string) => <div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-slate-500">{l}</dt><dd className="text-right font-medium text-navy">{v}</dd></div>;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <ol className="mb-6 flex gap-3 text-sm font-medium" aria-label="Progress">
          {["Details", "Review"].map((s, i) => <li key={s} className={`flex items-center gap-2 ${step === i + 1 ? "text-navy" : "text-slate-400"}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs ${step === i + 1 ? "bg-gold text-navy" : "bg-slate-200"}`}>{i + 1}</span>{s}</li>)}
        </ol>
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form key="a" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} onSubmit={(e) => { e.preventDefault(); if (validate()) setStep(2); }} className="card space-y-5 p-5 sm:p-7" noValidate>
              <h2 className="text-2xl">Trip details</h2>
              <Field label="Pickup location" error={errors.location}>
                <input list="loc" value={f.location} onChange={set("location")} placeholder="Airport, hotel or street address" className={inputCls} /><datalist id="loc">{LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Pickup date" error={errors.pickupDate}><input type="date" min={today} value={f.pickupDate} onChange={set("pickupDate")} className={inputCls} /></Field>
                <Field label="Pickup time"><input type="time" value={f.pickupTime} onChange={set("pickupTime")} className={inputCls} /></Field>
                <Field label="Return date" error={errors.returnDate}><input type="date" min={f.pickupDate} value={f.returnDate} onChange={set("returnDate")} className={inputCls} /></Field>
                <Field label="Return time"><input type="time" value={f.returnTime} onChange={set("returnTime")} className={inputCls} /></Field>
              </div>
              <h2 className="pt-2 text-2xl">Your details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.fullName}><input value={f.fullName} onChange={set("fullName")} autoComplete="name" className={inputCls} /></Field>
                <Field label="Phone number" error={errors.phone}><input value={f.phone} onChange={set("phone")} autoComplete="tel" className={inputCls} /></Field>
                <Field label="Email" className="sm:col-span-2" hint="Your account email. Booking updates are shown in your dashboard."><input value={profile.email} disabled className={inputCls} /></Field>
                <Field label="Notes for us (optional)" className="sm:col-span-2"><textarea rows={3} maxLength={500} value={f.notes} onChange={set("notes")} placeholder="Flight number, child seat, late arrival..." className={inputCls} /></Field>
              </div>
              <button className={`${buttonCls("primary", "lg")} w-full sm:w-auto`}>Review booking</button>
            </motion.form>
          ) : (
            <motion.div key="b" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="card p-5 sm:p-7">
              <h2 className="text-2xl">Review your booking</h2>
              <dl className="mt-4 divide-y divide-slate-100">
                {row("Vehicle", `${car.brand} ${car.name}`)}{row("Pickup", `${fmtDate(f.pickupDate)} at ${f.pickupTime}`)}{row("Return", `${fmtDate(f.returnDate)} at ${f.returnTime}`)}
                {row("Pickup location", f.location)}{row("Driver", f.fullName)}{row("Phone", f.phone)}{f.notes && row("Notes", f.notes)}
              </dl>
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">This is a booking request. It is held for you immediately and confirmed by our team. Payment is collected at pickup.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setStep(1)} className={buttonCls("outline", "lg")} disabled={busy}>Back</button>
                <button onClick={submit} disabled={busy} className={`${buttonCls("gold", "lg")} flex-1`}>{busy && <Loader2 size={18} className="animate-spin" />}{busy ? "Sending..." : `Submit booking${calc.ok ? ` (${money(calc.total)})` : ""}`}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden">
          <CarImage src={car.image_urls[0]} alt={car.name} className="aspect-[16/10] w-full object-cover" />
          <div className="p-5">
            <p className="text-xs text-slate-500">{car.brand} {car.model} &middot; {car.year}</p>
            <h2 className="text-xl">{car.name}</h2>
            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {row("Daily rate", money(car.price_per_day))}{row("Days", calc.ok ? String(calc.days) : "-")}
              <div className="flex justify-between py-3"><dt className="font-semibold text-navy">Estimated total</dt><dd className="font-display text-2xl font-semibold text-navy">{calc.ok ? money(calc.total) : "-"}</dd></div>
            </dl>
          </div>
        </div>
      </aside>
    </div>
  );
}
