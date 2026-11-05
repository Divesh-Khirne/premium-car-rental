import { BarChart3, CalendarCheck, CheckCircle2, Clock, Car, KeyRound, Users, Wallet, ListChecks, CircleCheck } from "lucide-react";
import { BarList, ColumnChart } from "@/components/admin/Charts";
import { requireAdmin } from "@/lib/auth";
import { lastMonths, monthKey } from "@/lib/stats";
import { money } from "@/lib/utils";

export const metadata = { title: "Overview" };
type B = { booking_status: string; total_amount: number; pickup_date: string; car_id: string; cars: { name: string; category: string } | null };

export default async function AdminOverview() {
  const { supabase } = await requireAdmin();
  const [customers, cars, available, rented, bookingsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("cars").select("id", { count: "exact", head: true }),
    supabase.from("cars").select("id", { count: "exact", head: true }).eq("availability_status", "available"),
    supabase.rpc("currently_rented_count"),
    supabase.from("bookings").select("booking_status,total_amount,pickup_date,car_id,cars(name,category)").limit(5000),
  ]);
  const bookings = (bookingsRes.data ?? []) as unknown as B[];
  const by = (s: string) => bookings.filter((b) => b.booking_status === s);
  const earned = bookings.filter((b) => b.booking_status === "completed");
  const revenue = earned.reduce((s, b) => s + Number(b.total_amount), 0);
  const months = lastMonths(6);
  const monthly = months.map((m) => ({ label: m.label, value: earned.filter((b) => monthKey(b.pickup_date) === m.key).reduce((s, b) => s + Number(b.total_amount), 0) }));
  const trend = months.map((m) => ({ label: m.label, value: bookings.filter((b) => monthKey(b.pickup_date) === m.key && b.booking_status !== "cancelled").length }));
  const tally = (key: (b: B) => string | undefined, val: (b: B) => number) => {
    const m = new Map<string, number>(); bookings.filter((b) => b.booking_status !== "cancelled").forEach((b) => { const k = key(b); if (k) m.set(k, (m.get(k) ?? 0) + val(b)); });
    return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };
  const top = tally((b) => b.cars?.name, () => 1).slice(0, 5);
  const cat = tally((b) => b.cars?.category, (b) => Number(b.total_amount)).slice(0, 6);

  const kpis = [
    { i: Users, l: "Registered customers", v: customers.count ?? 0 }, { i: Car, l: "Total vehicles", v: cars.count ?? 0 },
    { i: CircleCheck, l: "Available vehicles", v: available.count ?? 0 }, { i: KeyRound, l: "Currently rented", v: Number(rented.data ?? 0) },
    { i: CalendarCheck, l: "Total bookings", v: bookings.length }, { i: Clock, l: "Pending bookings", v: by("pending").length },
    { i: ListChecks, l: "Confirmed bookings", v: by("confirmed").length }, { i: CheckCircle2, l: "Completed bookings", v: by("completed").length },
  ];
  return (
    <div>
      <h1 className="text-3xl">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">A live summary of your business.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ i: I, l, v }) => <div key={l} className="card p-5"><I size={18} className="text-gold-dark" /><p className="mt-3 font-display text-3xl font-semibold text-navy">{v}</p><p className="text-sm text-slate-500">{l}</p></div>)}
      </div>
      <div className="card mt-4 flex flex-wrap items-center justify-between gap-4 bg-navy p-6 text-white">
        <div className="flex items-center gap-4"><Wallet className="text-gold" /><div><p className="text-sm text-white/70">Revenue from completed bookings</p><p className="font-display text-4xl font-semibold text-white">{money(revenue)}</p></div></div>
        <p className="text-sm text-white/70">Confirmed, not yet completed: <b className="text-white">{money(by("confirmed").reduce((s, b) => s + Number(b.total_amount), 0))}</b></p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6"><h2 className="mb-5 flex items-center gap-2 text-xl"><BarChart3 size={18} />Monthly revenue</h2><ColumnChart data={monthly} currency /></section>
        <section className="card p-6"><h2 className="mb-5 text-xl">Booking trends</h2><ColumnChart data={trend} /></section>
        <section className="card p-6"><h2 className="mb-5 text-xl">Most rented vehicles</h2><BarList data={top} /></section>
        <section className="card p-6"><h2 className="mb-5 text-xl">Category performance (revenue)</h2><BarList data={cat} currency /></section>
      </div>
    </div>
  );
}
