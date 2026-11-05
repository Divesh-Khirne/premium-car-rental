import Link from "next/link";
import { Fuel, Settings2, Users, CalendarDays } from "lucide-react";
import type { Car } from "@/types";
import { CarImage } from "./CarImage";
import { buttonCls } from "./ui";
import { money } from "@/lib/utils";

export function CarCard({ car, query = "", unavailable = false }: { car: Car; query?: string; unavailable?: boolean }) {
  const blocked = unavailable || car.availability_status !== "available";
  const label = car.availability_status === "maintenance" ? "In maintenance" : unavailable || car.availability_status === "unavailable" ? "Unavailable" : "Available";
  const q = query ? `&${query}` : "";
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition hover:shadow-lift">
      <Link href={`/cars/${car.id}${query ? `?${query}` : ""}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-100">
        <CarImage src={car.image_urls[0]} alt={`${car.brand} ${car.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${blocked ? "bg-white/90 text-rose-700" : "bg-white/90 text-emerald-700"}`}>{label}</span>
        <span className="absolute right-3 top-3 rounded-full bg-navy/85 px-2.5 py-1 text-xs font-medium text-white">{car.category}</span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-slate-500">{car.brand} {car.model} &middot; {car.year}</p>
        <h3 className="mt-0.5 text-xl">{car.name}</h3>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <li className="flex items-center gap-1.5"><Settings2 size={14} className="text-gold-dark" />{car.transmission}</li>
          <li className="flex items-center gap-1.5"><Fuel size={14} className="text-gold-dark" />{car.fuel_type}</li>
          <li className="flex items-center gap-1.5"><Users size={14} className="text-gold-dark" />{car.seating_capacity} seats</li>
          <li className="flex items-center gap-1.5"><CalendarDays size={14} className="text-gold-dark" />{car.year}</li>
        </ul>
        <div className="mt-auto flex items-end justify-between pt-5">
          <p><span className="font-display text-2xl font-semibold text-navy">{money(car.price_per_day)}</span><span className="text-sm text-slate-500"> / day</span></p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/cars/${car.id}${query ? `?${query}` : ""}`} className={buttonCls("outline", "sm")}>View details</Link>
          {blocked ? <span className={`${buttonCls("outline", "sm")} pointer-events-none opacity-50`}>Book now</span> : <Link href={`/booking?carId=${car.id}${q}`} className={buttonCls("gold", "sm")}>Book now</Link>}
        </div>
      </div>
    </article>
  );
}
