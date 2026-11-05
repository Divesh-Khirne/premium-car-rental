import { CustomersAdmin } from "@/components/admin/CustomersAdmin";
import { requireAdmin } from "@/lib/auth";
import type { Booking, Profile } from "@/types";

export const metadata = { title: "Customers" };
export default async function AdminCustomers() {
  const { supabase } = await requireAdmin();
  const [{ data: profiles }, { data: bookings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false }).limit(2000),
    supabase.from("bookings").select("id,customer_id,booking_status,pickup_date,return_date,total_amount,cars(id,name,brand,image_urls,category)").order("pickup_date", { ascending: false }).limit(5000),
  ]);
  const by = new Map<string, Booking[]>();
  ((bookings ?? []) as unknown as Booking[]).forEach((b) => by.set(b.customer_id, [...(by.get(b.customer_id) ?? []), b]));
  const rows = ((profiles ?? []) as Profile[]).map((p) => ({ ...p, bookings: by.get(p.id) ?? [] }));
  return <CustomersAdmin customers={rows} />;
}
