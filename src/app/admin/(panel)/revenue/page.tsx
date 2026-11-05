import { Download } from "lucide-react";
import { BarList, ColumnChart } from "@/components/admin/Charts";
import { buttonCls, inputCls, Field } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { lastMonths, monthKey } from "@/lib/stats";
import { money } from "@/lib/utils";

export const metadata = { title: "Revenue" };
type B = { booking_status: string; total_amount: number; pickup_date: string; total_days: number };

export default async function AdminRevenue() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("bookings").select("booking_status,total_amount,pickup_date,total_days").limit(10000);
  const rows = (data ?? []) as unknown as B[];
  const sum = (l: B[]) => l.reduce((s, b) => s + Number(b.total_amount), 0);
  const done = rows.filter((b) => b.booking_status === "completed"), conf = rows.filter((b) => b.booking_status === "confirmed");
  const months = lastMonths(12);
  const monthly = months.map((m) => ({ label: m.label, value: sum(done.filter((b) => monthKey(b.pickup_date) === m.key)) }));
  const statuses = ["pending", "confirmed", "completed", "cancelled"].map((s) => ({ label: s[0].toUpperCase() + s.slice(1), value: rows.filter((b) => b.booking_status === s).length }));
  const avg = done.length ? sum(done) / done.length : 0;
  const cards = [["Total revenue (completed)", money(sum(done))], ["Expected (confirmed)", money(sum(conf))], ["Average booking value", money(avg)], ["Rental days delivered", String(done.reduce((s, b) => s + b.total_days, 0))]];
  return (
    <div>
      <h1 className="text-3xl">Revenue</h1><p className="mt-1 text-sm text-slate-500">Revenue counts bookings marked Completed. Payment is collected at pickup.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map(([l, v]) => <div key={l} className="card p-5"><p className="font-display text-2xl font-semibold text-navy sm:text-3xl">{v}</p><p className="mt-1 text-sm text-slate-500">{l}</p></div>)}</div>
      <section className="card mt-6 p-6"><h2 className="mb-5 text-xl">Monthly revenue (last 12 months)</h2><ColumnChart data={monthly} currency /></section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6"><h2 className="mb-5 text-xl">Booking statistics</h2><BarList data={statuses} /></section>
        <section className="card p-6">
          <h2 className="mb-1 text-xl">Export bookings (CSV)</h2><p className="mb-4 text-sm text-slate-500">Opens in Excel or Google Sheets.</p>
          <form action="/api/admin/export" method="get" className="grid gap-3 sm:grid-cols-2">
            <Field label="Status" className="sm:col-span-2"><select name="status" className={inputCls}><option value="">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></Field>
            <Field label="Pickup from"><input type="date" name="from" className={inputCls} /></Field><Field label="Pickup to"><input type="date" name="to" className={inputCls} /></Field>
            <button className={`${buttonCls("primary")} sm:col-span-2`}><Download size={16} />Download CSV</button>
          </form>
        </section>
      </div>
    </div>
  );
}
