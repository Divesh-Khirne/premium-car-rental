import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingActions } from "@/components/BookingActions";
import { CarImage } from "@/components/CarImage";
import { StatusBadge, buttonCls } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtTime, money } from "@/lib/utils";
import type { Booking } from "@/types";

export const metadata: Metadata = { title: "Booking details" };

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser(`/dashboard/bookings/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase.from("bookings").select("*, cars(id,name,brand,image_urls,category)").eq("id", id).eq("customer_id", profile.id).maybeSingle();
  if (!data) notFound();
  const b = data as Booking;
  const { data: pay } = await supabase.from("payments").select("payment_status,payment_method").eq("booking_id", id).maybeSingle();
  const rows: [string, string][] = [
    ["Reference", b.id.slice(0, 8).toUpperCase()], ["Pickup", `${fmtDate(b.pickup_date)} at ${fmtTime(b.pickup_time)}`], ["Return", `${fmtDate(b.return_date)} at ${fmtTime(b.return_time)}`],
    ["Pickup location", b.pickup_location], ["Duration", `${b.total_days} day${b.total_days > 1 ? "s" : ""}`], ["Daily rate", money(b.price_per_day)],
    ["Payment", pay ? `${pay.payment_status} (${pay.payment_method.replace(/_/g, " ")})` : "-"], ["Booked on", fmtDate(b.created_at)],
  ];
  return (
    <div className="container-x max-w-3xl py-10">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-navy">&larr; Back to dashboard</Link>
      <div className="card mt-4 overflow-hidden">
        <CarImage src={b.cars?.image_urls?.[0]} alt="" className="aspect-[21/9] w-full object-cover" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm text-slate-500">{b.cars?.category}</p><h1 className="text-3xl">{b.cars ? `${b.cars.brand} ${b.cars.name}` : "Vehicle"}</h1></div>
            <StatusBadge status={b.booking_status} className="!text-sm" />
          </div>
          <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
            {rows.map(([l, v]) => <div key={l} className="flex justify-between gap-4 border-b border-slate-100 py-3 text-sm"><dt className="text-slate-500">{l}</dt><dd className="text-right font-medium text-navy">{v}</dd></div>)}
          </dl>
          {b.customer_notes && <p className="mt-4 rounded-lg bg-surface p-3 text-sm"><b>Your notes:</b> {b.customer_notes}</p>}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-2xl font-semibold text-navy"><span className="mr-2 text-sm font-normal text-slate-500">Total</span><span className="font-display">{money(b.total_amount)}</span></p>
            <div className="flex flex-wrap items-center gap-3">
              {b.booking_status === "completed" && b.cars && <Link href={`/cars/${b.cars.id}`} className={buttonCls("gold", "sm")}>Leave a review</Link>}
              <BookingActions id={b.id} status={b.booking_status} requested={b.cancellation_requested} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
