import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Fuel, Gauge, MapPin, Settings2, Users } from "lucide-react";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { CarCard } from "@/components/CarCard";
import { Gallery } from "@/components/Gallery";
import { QuickBook } from "@/components/QuickBook";
import { ReviewForm } from "@/components/ReviewForm";
import { Stars } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { getBookedRanges, getCar, getCars, getReviews } from "@/lib/data";
import { fmtDate, money } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const car = await getCar((await params).id);
  return { title: car ? `${car.brand} ${car.name}` : "Vehicle not found" };
}

export default async function CarPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const raw = await searchParams;
  const defaults = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const car = await getCar(id);
  if (!car) notFound();

  const { supabase, user } = await getSession();
  const [ranges, reviews, all] = await Promise.all([getBookedRanges(car.id), getReviews(car.id), getCars()]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const similar = all.filter((c) => c.id !== car.id && c.category === car.category).slice(0, 3);

  let canReview = false;
  if (user) {
    const [{ data: done }, { data: mine }] = await Promise.all([
      supabase.from("bookings").select("id").eq("customer_id", user.id).eq("car_id", car.id).eq("booking_status", "completed").limit(1),
      supabase.from("reviews").select("id").eq("customer_id", user.id).eq("car_id", car.id).limit(1),
    ]);
    canReview = !!done?.length && !mine?.length;
  }
  const specs = [
    { i: Settings2, l: "Transmission", v: car.transmission }, { i: Fuel, l: "Fuel", v: car.fuel_type },
    { i: Users, l: "Seats", v: `${car.seating_capacity}` }, { i: Gauge, l: "Efficiency", v: car.mileage || "n/a" },
  ];

  return (
    <div className="container-x py-10">
      <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb"><Link href="/cars" className="hover:text-navy">Fleet</Link> / <span className="text-navy">{car.name}</span></nav>
      <div className="grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-10">
          <Gallery images={car.image_urls} alt={`${car.brand} ${car.name}`} />
          <section>
            <p className="text-sm text-slate-500">{car.brand} {car.model} &middot; {car.year} &middot; {car.category}</p>
            <h1 className="mt-1 text-4xl">{car.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <p><span className="font-display text-3xl font-semibold text-navy">{money(car.price_per_day)}</span><span className="text-slate-500"> / day</span></p>
              {reviews.length > 0 && <span className="flex items-center gap-2 text-sm text-slate-600"><Stars value={avg} />{avg.toFixed(1)} ({reviews.length})</span>}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${car.availability_status === "available" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{car.availability_status === "available" ? "Available" : car.availability_status === "maintenance" ? "In maintenance" : "Unavailable"}</span>
            </div>
            <p className="mt-5 max-w-3xl leading-relaxed text-slate-700">{car.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {specs.map(({ i: I, l, v }) => (
                <div key={l} className="card p-4"><I size={18} className="text-gold-dark" /><dt className="mt-2 text-xs text-slate-500">{l}</dt><dd className="font-semibold text-navy">{v}</dd></div>
              ))}
            </dl>
          </section>
          {car.features.length > 0 && (
            <section><h2 className="text-2xl">Features and amenities</h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">{car.features.map((f) => <li key={f} className="flex items-center gap-2.5 text-sm"><Check size={16} className="text-gold-dark" />{f}</li>)}</ul></section>
          )}
          <section><h2 className="text-2xl">Pickup and return</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3"><MapPin size={18} className="shrink-0 text-gold-dark" />Collect from our showroom, the airport, or arrange hotel delivery. Enter any address when booking.</li>
              <li className="flex gap-3"><Clock size={18} className="shrink-0 text-gold-dark" />Rentals are charged per 24-hour period from your pickup time. Bring a valid driving licence and photo ID.</li>
            </ul></section>
          <section><h2 className="mb-4 text-2xl">Availability</h2><div className="max-w-md"><AvailabilityCalendar ranges={ranges} /></div>
            {ranges.length > 0 && <p className="mt-3 text-xs text-slate-500">Next booked period: {fmtDate(ranges[0].pickup_at)} to {fmtDate(ranges[0].return_at)}.</p>}</section>
          <section><h2 className="mb-4 text-2xl">Customer reviews</h2>
            {canReview && <div className="mb-5"><ReviewForm carId={car.id} /></div>}
            {reviews.length ? (
              <ul className="space-y-4">{reviews.map((r) => (
                <li key={r.id} className="card p-5"><div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span></div>
                  {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}<p className="mt-2 text-xs font-medium text-slate-500">{r.profiles?.full_name}</p></li>))}</ul>
            ) : <p className="text-sm text-slate-500">No reviews yet. Customers can review a vehicle after completing a rental.</p>}
          </section>
        </div>
        <aside><div className="lg:sticky lg:top-24"><QuickBook carId={car.id} price={car.price_per_day} available={car.availability_status === "available"} ranges={ranges} defaults={defaults} /></div></aside>
      </div>
      {similar.length > 0 && (
        <section className="mt-20"><h2 className="mb-6 text-3xl">Similar vehicles</h2><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similar.map((c) => <CarCard key={c.id} car={c} />)}</div></section>
      )}
    </div>
  );
}
