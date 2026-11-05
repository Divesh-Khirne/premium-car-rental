export type Role = "customer" | "admin";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Profile {
  id: string; full_name: string; email: string; phone: string | null;
  avatar_url: string | null; role: Role; is_active: boolean; created_at: string;
}
export interface Car {
  id: string; name: string; brand: string; model: string; year: number; category: string;
  description: string; price_per_day: number; transmission: string; fuel_type: string;
  seating_capacity: number; mileage: string; features: string[]; image_urls: string[];
  availability_status: "available" | "maintenance" | "unavailable";
  is_featured: boolean; bookings_count: number; created_at: string;
}
export interface Booking {
  id: string; customer_id: string; car_id: string; pickup_location: string;
  pickup_date: string; return_date: string; pickup_time: string; return_time: string;
  total_days: number; price_per_day: number; total_amount: number;
  booking_status: BookingStatus; cancellation_requested: boolean; customer_notes: string | null;
  created_at: string;
  cars?: Pick<Car, "id" | "name" | "brand" | "image_urls" | "category"> | null;
  profiles?: Pick<Profile, "id" | "full_name" | "email" | "phone"> | null;
}
export interface Review {
  id: string; customer_id: string; car_id: string; rating: number; comment: string; created_at: string;
  profiles?: { full_name: string } | null;
}
export interface Testimonial { id: string; customer_name: string; review: string; rating: number; is_featured: boolean; created_at: string; }
export interface PromoBanner { id: string; title: string; subtitle: string; cta_label: string; cta_href: string; is_active: boolean; }
export interface BookedRange { pickup_at: string; return_at: string; }
