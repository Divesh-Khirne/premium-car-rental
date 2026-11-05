import Link from "next/link";
import type { Booking } from "@/types";
import { CarImage } from "./CarImage";
import { StatusBadge } from "./ui";
import { fmtDate, money } from "@/lib/utils";

export function BookingRow({ b }: { b: Booking }) {
  return (
    <Link href={`/dashboard/bookings/${b.id}`} className="card flex items-center gap-4 p-3 transition hover:shadow-lift sm:p-4">
      <CarImage src={b.cars?.image_urls?.[0]} alt="" className="hidden h-16 w-24 shrink-0 rounded-lg object-cover sm:block" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-navy">{b.cars ? `${b.cars.brand} ${b.cars.name}` : "Vehicle"}</p>
        <p className="text-sm text-slate-500">{fmtDate(b.pickup_date)} to {fmtDate(b.return_date)} &middot; {b.total_days} day{b.total_days > 1 ? "s" : ""}</p>
      </div>
      <div className="text-right"><p className="font-semibold text-navy">{money(b.total_amount)}</p><StatusBadge status={b.booking_status} className="mt-1" /></div>
    </Link>
  );
}
