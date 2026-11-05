"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { History, UserCheck, UserX } from "lucide-react";
import type { Booking, Profile } from "@/types";
import { Modal } from "../modal";
import { useToast } from "../toast";
import { StatusBadge, buttonCls, inputCls } from "../ui";
import { fmtDate, initials, money } from "@/lib/utils";

type Row = Profile & { bookings: Pick<Booking, "id" | "booking_status" | "pickup_date" | "return_date" | "total_amount" | "cars">[] };

export function CustomersAdmin({ customers }: { customers: Row[] }) {
  const router = useRouter(), toast = useToast();
  const [q, setQ] = useState(""), [view, setView] = useState<Row | null>(null), [busy, setBusy] = useState<string | null>(null);
  const list = customers.filter((c) => `${c.full_name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()));

  async function toggle(c: Row) {
    setBusy(c.id);
    const r = await fetch(`/api/admin/customers/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: !c.is_active }) }).then((x) => x.json()).catch(() => ({ ok: false, error: "Network error" }));
    setBusy(null);
    if (r.ok) { toast.success(c.is_active ? "Account deactivated." : "Account reactivated."); router.refresh(); } else toast.error(r.error ?? "Could not update account.");
  }
  const spent = (c: Row) => c.bookings.filter((b) => b.booking_status === "completed").reduce((s, b) => s + Number(b.total_amount), 0);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl">Customers</h1><p className="mt-1 text-sm text-slate-500">{customers.length} registered</p></div><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" aria-label="Search customers" className={`${inputCls} !w-64`} /></div>
      <div className="card scroll-x mt-6">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="p-4">Customer</th><th className="p-4">Phone</th><th className="p-4">Joined</th><th className="p-4">Bookings</th><th className="p-4">Spent</th><th className="p-4 text-right">Account</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((c) => (
              <tr key={c.id}>
                <td className="p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-gold">{initials(c.full_name || c.email)}</span><div><p className="font-medium text-navy">{c.full_name || "(no name)"}</p><p className="text-xs text-slate-500">{c.email}</p></div></div></td>
                <td className="p-4">{c.phone || "-"}</td><td className="p-4">{fmtDate(c.created_at)}</td><td className="p-4">{c.bookings.length}</td><td className="p-4 font-medium">{money(spent(c))}</td>
                <td className="p-4"><div className="flex items-center justify-end gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{c.is_active ? "Active" : "Deactivated"}</span>
                  <button onClick={() => setView(c)} aria-label="Booking history" className="rounded-lg p-2 hover:bg-slate-100"><History size={16} /></button>
                  <button disabled={busy === c.id} onClick={() => toggle(c)} aria-label={c.is_active ? "Deactivate account" : "Reactivate account"} className="rounded-lg p-2 hover:bg-slate-100">{c.is_active ? <UserX size={16} className="text-rose-600" /> : <UserCheck size={16} className="text-emerald-600" />}</button></div></td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="p-10 text-center text-slate-500">No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
      <Modal open={!!view} onClose={() => setView(null)} title={view?.full_name || "Customer"}>
        {view && (
          <div className="text-sm"><p className="text-slate-500">{view.email} &middot; {view.phone || "no phone"}</p>
            <h3 className="mb-3 mt-5 font-sans text-base font-semibold">Booking history</h3>
            {view.bookings.length ? <ul className="divide-y divide-slate-100">{view.bookings.map((b) => <li key={b.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium text-navy">{b.cars ? `${b.cars.brand} ${b.cars.name}` : "Vehicle"}</p><p className="text-xs text-slate-500">{fmtDate(b.pickup_date)} to {fmtDate(b.return_date)}</p></div><div className="text-right"><p className="font-medium">{money(b.total_amount)}</p><StatusBadge status={b.booking_status} /></div></li>)}</ul> : <p className="text-slate-500">No bookings yet.</p>}
            <div className="mt-5 flex justify-end"><button onClick={() => setView(null)} className={buttonCls("outline")}>Close</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
