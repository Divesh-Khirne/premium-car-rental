import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingWizard } from "@/components/BookingWizard";
import { requireUser } from "@/lib/auth";
import { getBookedRanges, getCar } from "@/lib/data";

export const metadata: Metadata = { title: "Book your car" };

export default async function BookingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const sp = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) as Record<string, string | undefined>;
  const carId = sp.carId ?? "";
  const { profile } = await requireUser(`/booking?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString()}`);
  const car = await getCar(carId);
  if (!car) notFound();
  const ranges = await getBookedRanges(car.id);
  return (
    <div className="container-x py-10">
      <h1 className="mb-6 text-4xl">Book the {car.name}</h1>
      <BookingWizard car={car} ranges={ranges} defaults={sp} profile={{ fullName: profile.full_name, email: profile.email, phone: profile.phone ?? "" }} />
    </div>
  );
}
