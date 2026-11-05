"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Download, Eye, Flag, X } from "lucide-react";
import type { Booking } from "@/types";
import { Modal } from "../modal";
import { useToast } from "../toast";
import { StatusBadge, buttonCls, inputCls } from "../ui";
import { fmtDate, fmtTime, money } from "@/lib/utils";

export function BookingsAdmin({ bookings }: { bookings: Booking[] }) {
  const router = useRouter(), toast = useToast();
  const [q, setQ] = useState(""), [status, setStatus] = useState(""), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const [view, setView] = useState<Booking | null>(null), [busy, setBusy] = useState<string | null>(null);

  const list = useMemo(() => bookings.filter((b) => {
    const hay = `${b.id} ${b.profiles?.full_name} ${b.profiles?.email} ${b.cars?.name} ${b.cars?.brand} ${b.pickup_location}`.toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (!status || (status === "cancel_req" ? b.cancellation_requested : b.booking_status === status)) && (!from || b.pickup_date >= from) && (!to || b.pickup_date <= to);
  }), [bookings, q, status, from, to]);

  async function act(b: Booking, next: "confirmed" | "cancelled" | "completed", msg: string) {
    setBusy(b.id);
    const r = await fetch(`/api/admin/bookings/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }).then((x) => x.json()).catch(() => ({ ok: false, error: "Network error" }));
    setBusy(null);
    if (r.ok) { toast.success(msg); setView(null); router.refresh(); } else toast.error(r.error ?? "Could not update booking.");
  }
  const exportUrl = `/api/admin/export?${new URLSearchParams({ ...(status && status !== "cancel_req" ? { status } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) })}`;

  const actions = (b: Booking) => (
    <div className="flex flex-wrap justify-end gap-1.5">
      {b.booking_status === "pending" && <button disabled={busy === b.id} onClick={() => act(b, "confirmed", "Booking approved.")} className={buttonCls("primary", "sm")}><Check size={13} />Approve</button>}
      {b.booking_status === "pending" && <button disabled={busy === b.id} onClick={() => act(b, "cancelled", "Booking rejected.")} className={buttonCls("outline", "sm")}><X size={13} />Reject</button>}
      {b.booking_status === "confirmed" && <button disabled={busy === b.id} onClick={() => act(b, "completed", "Booking completed.")} className={buttonCls("gold", "sm")}><Flag size={13} />Complete</button>}
      {b.booking_status === "confirmed" && <button disabled={busy === b.id} onClick={() => act(b, "cancelled", "Booking cancelled.")} className={buttonCls("outline", "sm")}>Cancel</button>}
    </div>
  );
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl">Bookings</h1><p className="mt-1 text-sm text-slate-500">{list.length} of {bookings.length} shown</p></div><a href={exportUrl} className={buttonCls("outline", "sm")}><Download size={15} />Export CSV</a></div>
      <div className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, car, ID" aria-label="Search bookings" className={inputCls} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={inputCls}><option value="">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="cancel_req">Cancellation requested</option></select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Pickup from" className={inputCls} /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Pickup to" className={inputCls} />
      </div>
      <div className="card scroll-x mt-4">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="p-4">Customer</th><th className="p-4">Vehicle</th><th className="p-4">Dates</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((b) => (
              <tr key={b.id}>
                <td className="p-4"><p className="font-medium text-navy">{b.profiles?.full_name || "-"}</p><p className="text-xs text-slate-500">{b.profiles?.email}</p></td>
                <td className="p-4">{b.cars ? `${b.cars.brand} ${b.cars.name}` : "-"}</td>
                <td className="p-4 text-xs">{fmtDate(b.pickup_date)} {fmtTime(b.pickup_time)}<br />{fmtDate(b.return_date)} {fmtTime(b.return_time)}</td>
                <td className="p-4 font-medium">{money(b.total_amount)}</td>
                <td className="p-4"><StatusBadge status={b.booking_status} />{b.cancellation_requested && b.booking_status !== "cancelled" && <p className="mt-1 text-xs font-medium text-amber-700">Cancellation requested</p>}</td>
                <td className="p-4"><div className="flex items-center justify-end gap-2">{actions(b)}<button onClick={() => setView(b)} aria-label="View details" className="rounded-lg p-2 hover:bg-slate-100"><Eye size={16} /></button></div></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No bookings match.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={!!view} onClose={() => setView(null)} title="Booking details">
        {view && (
          <div className="space-y-4 text-sm">
            <dl className="divide-y divide-slate-100">
              {[["Reference", view.id.slice(0, 8).toUpperCase()], ["Customer", view.profiles?.full_name ?? "-"], ["Email", view.profiles?.email ?? "-"], ["Phone", view.profiles?.phone ?? "-"], ["Vehicle", view.cars ? `${view.cars.brand} ${view.cars.name}` : "-"], ["Pickup", `${fmtDate(view.pickup_date)} ${fmtTime(view.pickup_time)}`], ["Return", `${fmtDate(view.return_date)} ${fmtTime(view.return_time)}`], ["Location", view.pickup_location], ["Days x rate", `${view.total_days} x ${money(view.price_per_day)}`], ["Total", money(view.total_amount)]].map(([l, v]) => <div key={l} className="flex justify-between gap-4 py-2"><dt className="text-slate-500">{l}</dt><dd className="text-right font-medium">{v}</dd></div>)}
            </dl>
            {view.customer_notes && <p className="rounded-lg bg-surface p-3"><b>Notes:</b> {view.customer_notes}</p>}
            <div className="flex items-center justify-between"><StatusBadge status={view.booking_status} />{actions(view)}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
