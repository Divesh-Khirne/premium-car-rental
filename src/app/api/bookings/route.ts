import { apiUser, dbMessage, fail, ok, readJson } from "@/lib/api";
import { calcRental } from "@/lib/pricing";
import { addDaysISO, todayISO } from "@/lib/utils";
import { bookingSchema, firstError } from "@/lib/validators";

/**
 * Create a booking. Everything money- or availability-related is decided HERE and in the database:
 * the client only sends the car id, dates, times, location and notes.
 */
export async function POST(req: Request) {
  const a = await apiUser();
  if (a instanceof Response) return a;
  const p = bookingSchema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const b = p.data;

  const { data: car } = await a.supabase.from("cars").select("id,price_per_day,availability_status").eq("id", b.carId).maybeSingle();
  if (!car) return fail("Vehicle not found.", 404);
  if (car.availability_status !== "available") return fail("This vehicle is not available for booking right now.", 409);

  const calc = calcRental({ pickupDate: b.pickupDate, pickupTime: b.pickupTime, returnDate: b.returnDate, returnTime: b.returnTime }, Number(car.price_per_day));
  if (!calc.ok) return fail(calc.error);
  if (b.pickupDate < addDaysISO(todayISO(), -1)) return fail("Pickup date cannot be in the past.");

  const start = `${b.pickupDate}T${b.pickupTime}:00`, end = `${b.returnDate}T${b.returnTime}:00`;
  const { data: busy } = await a.supabase.rpc("unavailable_car_ids", { p_start: start, p_end: end });
  if ((busy as string[] | null)?.includes(b.carId)) return fail("Sorry, this vehicle is already booked for those dates. Please choose different dates.", 409);

  const { data, error } = await a.supabase.from("bookings").insert({
    customer_id: a.user.id, car_id: b.carId, pickup_location: b.pickupLocation,
    pickup_date: b.pickupDate, pickup_time: b.pickupTime, return_date: b.returnDate, return_time: b.returnTime,
    customer_notes: b.notes || null,
  }).select("id,total_days,total_amount").single();
  if (error) return fail(dbMessage(error), error.code === "23P01" ? 409 : 400);
  return ok(data, 201);
}
