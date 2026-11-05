import { BookingsAdmin } from "@/components/admin/BookingsAdmin";
import { requireAdmin } from "@/lib/auth";
import type { Booking } from "@/types";

export const metadata = { title: "Bookings" };
export default async function AdminBookings() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("bookings").select("*, cars(id,name,brand,image_urls,category), profiles(id,full_name,email,phone)").order("created_at", { ascending: false }).limit(2000);
  return <BookingsAdmin bookings={(data ?? []) as unknown as Booking[]} />;
}
