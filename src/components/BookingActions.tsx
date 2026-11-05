"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonCls } from "./ui";
import { Modal } from "./modal";
import { useToast } from "./toast";
import type { BookingStatus } from "@/types";

/** Customer actions: cancel a pending booking, or ask us to cancel a confirmed one. */
export function BookingActions({ id, status, requested }: { id: string; status: BookingStatus; requested: boolean }) {
  const router = useRouter(), toast = useToast();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  if (status === "cancelled" || status === "completed") return null;
  if (requested) return <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">Cancellation requested. We will confirm shortly.</p>;
  const pending = status === "pending";
  async function run() {
    setBusy(true);
    const res = await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: pending ? "cancel" : "request_cancel" }) });
    const j = await res.json().catch(() => ({ ok: false, error: "Network error" }));
    setBusy(false); setOpen(false);
    if (j.ok) { toast.success(pending ? "Booking cancelled." : "Cancellation requested."); router.refresh(); } else toast.error(j.error ?? "Could not update booking.");
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonCls("outline", "sm")}>{pending ? "Cancel booking" : "Request cancellation"}</button>
      <Modal open={open} onClose={() => setOpen(false)} title={pending ? "Cancel this booking?" : "Request cancellation?"}>
        <p className="text-sm text-slate-600">{pending ? "The car will be released for other customers. This cannot be undone." : "Your booking is confirmed, so our team will review the request and confirm the cancellation."}</p>
        <div className="mt-6 flex justify-end gap-3"><button onClick={() => setOpen(false)} className={buttonCls("outline")}>Keep booking</button><button onClick={run} disabled={busy} className={buttonCls("danger")}>{busy ? "Working..." : pending ? "Yes, cancel" : "Send request"}</button></div>
      </Modal>
    </>
  );
}
