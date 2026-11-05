import { apiAdmin, fail } from "@/lib/api";

const csvCell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

/** GET /api/admin/export?status=confirmed&from=2026-01-01&to=2026-12-31 -> CSV download */
export async function GET(req: Request) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const u = new URL(req.url);
  const status = u.searchParams.get("status"), from = u.searchParams.get("from"), to = u.searchParams.get("to");
  let q = a.supabase.from("bookings").select("*, cars(name,brand), profiles(full_name,email,phone)").order("created_at", { ascending: false }).limit(10000);
  if (status && ["pending", "confirmed", "cancelled", "completed"].includes(status)) q = q.eq("booking_status", status);
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) q = q.gte("pickup_date", from);
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) q = q.lte("pickup_date", to);
  const { data, error } = await q;
  if (error) return fail("Could not export bookings.", 500);
  const head = ["Booking ID", "Created", "Customer", "Email", "Phone", "Vehicle", "Pickup location", "Pickup date", "Pickup time", "Return date", "Return time", "Days", "Price/day", "Total", "Status"];
  type Row = { id: string; created_at: string; pickup_location: string; pickup_date: string; pickup_time: string; return_date: string; return_time: string; total_days: number; price_per_day: number; total_amount: number; booking_status: string; cars: { name: string; brand: string } | null; profiles: { full_name: string; email: string; phone: string | null } | null };
  const lines = [head.map(csvCell).join(",")];
  for (const r of (data ?? []) as unknown as Row[]) {
    lines.push([r.id, r.created_at, r.profiles?.full_name, r.profiles?.email, r.profiles?.phone, r.cars ? `${r.cars.brand} ${r.cars.name}` : "", r.pickup_location, r.pickup_date, r.pickup_time, r.return_date, r.return_time, r.total_days, r.price_per_day, r.total_amount, r.booking_status].map(csvCell).join(","));
  }
  return new Response("\uFEFF" + lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
