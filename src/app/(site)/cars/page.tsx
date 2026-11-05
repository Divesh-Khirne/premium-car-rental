import type { Metadata } from "next";
import { CarsExplorer } from "@/components/CarsExplorer";
import { getCars, getUnavailableIds } from "@/lib/data";
import { calcRental } from "@/lib/pricing";
import { fmtDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Our fleet" };
type SP = Record<string, string | undefined>;

export default async function CarsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const sp: SP = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const cars = await getCars();

  // If dates were chosen (e.g. from the home page widget), flag cars that are booked in that window.
  const dates = { pickupDate: sp.pickupDate ?? "", pickupTime: sp.pickupTime ?? "", returnDate: sp.returnDate ?? "", returnTime: sp.returnTime ?? "" };
  const valid = Object.values(dates).every(Boolean) && calcRental(dates, 1).ok;
  const unavailable = valid ? [...(await getUnavailableIds(`${dates.pickupDate}T${dates.pickupTime}:00`, `${dates.returnDate}T${dates.returnTime}:00`))] : [];
  const query = valid ? new URLSearchParams({ ...dates, ...(sp.location ? { location: sp.location.slice(0, 200) } : {}) }).toString() : "";

  return (
    <div className="container-x py-12">
      <h1 className="text-4xl">Our fleet</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        {valid ? `Availability shown for ${fmtDate(dates.pickupDate)} ${dates.pickupTime} to ${fmtDate(dates.returnDate)} ${dates.returnTime}${sp.location ? `, pickup at ${sp.location.slice(0, 80)}` : ""}.` : "Every vehicle, with filters for price, fuel, seats and more."}
      </p>
      <div className="mt-8"><CarsExplorer cars={cars} unavailableIds={unavailable} query={query} initialCategory={sp.category} /></div>
    </div>
  );
}
