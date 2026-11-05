import "server-only";
import { createClient } from "./supabase/server";
import type { BookedRange, Car, PromoBanner, Review, Testimonial } from "@/types";

const num = <T extends { price_per_day: unknown }>(c: T) => ({ ...c, price_per_day: Number(c.price_per_day) });

export async function getCars(): Promise<Car[]> {
  const s = await createClient();
  const { data } = await s.from("cars").select("*").order("created_at", { ascending: false });
  return ((data ?? []) as Car[]).map(num);
}
export async function getCar(id: string): Promise<Car | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const s = await createClient();
  const { data } = await s.from("cars").select("*").eq("id", id).maybeSingle();
  return data ? num(data as Car) : null;
}
export async function getFeaturedCars(): Promise<Car[]> {
  const s = await createClient();
  const { data } = await s.from("cars").select("*").eq("is_featured", true).order("bookings_count", { ascending: false }).limit(6);
  return ((data ?? []) as Car[]).map(num);
}
export async function getTestimonials(): Promise<Testimonial[]> {
  const s = await createClient();
  const { data } = await s.from("testimonials").select("*").eq("is_featured", true).order("created_at", { ascending: false }).limit(6);
  return (data ?? []) as Testimonial[];
}
export async function getActiveBanner(): Promise<PromoBanner | null> {
  const s = await createClient();
  const { data } = await s.from("promo_banners").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data as PromoBanner) ?? null;
}
export async function getReviews(carId: string): Promise<Review[]> {
  const s = await createClient();
  const { data: rows } = await s.from("reviews").select("*").eq("car_id", carId).order("created_at", { ascending: false }).limit(20);
  const reviews = (rows ?? []) as Review[];
  if (!reviews.length) return [];
  // Reviewer names are not readable by other customers (RLS), so only show a generic label.
  return reviews.map((r) => ({ ...r, profiles: { full_name: "Verified customer" } }));
}
export async function getBookedRanges(carId: string): Promise<BookedRange[]> {
  const s = await createClient();
  const { data } = await s.rpc("get_booked_ranges", { p_car_id: carId });
  return (data ?? []) as BookedRange[];
}
export async function getUnavailableIds(start: string, end: string): Promise<Set<string>> {
  const s = await createClient();
  const { data } = await s.rpc("unavailable_car_ids", { p_start: start, p_end: end });
  return new Set((data ?? []) as string[]);
}
