import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock, Edit3 } from "lucide-react";
import { BookingRow } from "@/components/BookingRow";
import { LogoutButton } from "@/components/LogoutButton";
import { EmptyState, buttonCls } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { initials, todayISO } from "@/lib/utils";
import type { Booking } from "@/types";

export const metadata: Metadata = { title: "My dashboard" };

export default async function DashboardPage() {
  const { supabase, profile } = await requireUser("/dashboard");
  const { data } = await supabase.from("bookings").select("*, cars(id,name,brand,image_urls,category)").eq("customer_id", profile.id).order("pickup_date", { ascending: false });
  const all = (data ?? []) as Booking[];
  const today = todayISO();
  const upcoming = all.filter((b) => ["pending", "confirmed"].includes(b.booking_status) && b.return_date >= today).sort((a, b) => a.pickup_date.localeCompare(b.pickup_date));
  const previous = all.filter((b) => !upcoming.includes(b));
  const stats = [
    { i: CalendarClock, l: "Upcoming", v: upcoming.length }, { i: Clock, l: "Awaiting confirmation", v: all.filter((b) => b.booking_status === "pending").length },
    { i: CheckCircle2, l: "Completed trips", v: all.filter((b) => b.booking_status === "completed").length },
  ];
  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-gold text-lg font-bold text-navy">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(profile.full_name)}
          </div>
          <div><h1 className="text-3xl">Welcome, {profile.full_name.split(" ")[0] || "driver"}</h1><p className="text-sm text-slate-500">{profile.email}{profile.phone ? ` · ${profile.phone}` : ""}</p></div>
        </div>
        <div className="flex gap-2"><Link href="/dashboard/profile" className={buttonCls("outline", "sm")}><Edit3 size={15} />Edit profile</Link><LogoutButton /></div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map(({ i: I, l, v }) => <div key={l} className="card flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold"><I size={20} /></span><div><p className="font-display text-3xl font-semibold text-navy">{v}</p><p className="text-sm text-slate-500">{l}</p></div></div>)}
      </div>
      <section className="mt-10"><h2 className="mb-4 text-2xl">Upcoming bookings</h2>
        {upcoming.length ? <div className="space-y-3">{upcoming.map((b) => <BookingRow key={b.id} b={b} />)}</div> : <EmptyState title="No upcoming trips" text="When you book a car it will appear here." action={<Link href="/cars" className={buttonCls("gold")}>Find a car</Link>} />}
      </section>
      {previous.length > 0 && <section className="mt-10"><h2 className="mb-4 text-2xl">Previous bookings</h2><div className="space-y-3">{previous.map((b) => <BookingRow key={b.id} b={b} />)}</div></section>}
    </div>
  );
}
