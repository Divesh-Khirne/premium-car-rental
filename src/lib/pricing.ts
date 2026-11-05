import { MAX_RENTAL_DAYS } from "./config";

export interface RentalInput { pickupDate: string; pickupTime: string; returnDate: string; returnTime: string; }

/** Shared by the browser (for the live estimate) and the server (for validation). The database recomputes the final price. */
export function calcRental(i: RentalInput, pricePerDay: number) {
  const start = new Date(`${i.pickupDate}T${i.pickupTime}:00`);
  const end = new Date(`${i.returnDate}T${i.returnTime}:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { ok: false as const, error: "Please choose valid dates and times." };
  if (end <= start) return { ok: false as const, error: "Return must be after pickup." };
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
  if (days > MAX_RENTAL_DAYS) return { ok: false as const, error: `Maximum rental length is ${MAX_RENTAL_DAYS} days.` };
  return { ok: true as const, days, total: Math.round(days * pricePerDay * 100) / 100 };
}
