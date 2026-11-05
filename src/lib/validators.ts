import { z } from "zod";
import { CATEGORIES, FUELS, TRANSMISSIONS } from "./config";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const time = z.string().regex(/^\d{2}:\d{2}$/, "Invalid time");
const phone = z.string().trim().regex(/^[+()\d\s-]{7,20}$/, "Enter a valid phone number");

export const bookingSchema = z.object({
  carId: z.uuid("Invalid vehicle"),
  pickupLocation: z.string().trim().min(2, "Enter a pickup location").max(200),
  pickupDate: date, pickupTime: time, returnDate: date, returnTime: time,
  notes: z.string().trim().max(500).optional(),
  // NOTE: no price / total / status / customer fields are accepted from the client.
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.email("Enter a valid email"),
  phone,
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone,
  avatarUrl: z.string().max(500).nullable().optional(),
});

export const carSchema = z.object({
  name: z.string().trim().min(2).max(100), brand: z.string().trim().min(1).max(60), model: z.string().trim().min(1).max(60),
  year: z.coerce.number().int().min(1990).max(2100),
  category: z.enum(CATEGORIES), description: z.string().trim().max(2000).default(""),
  price_per_day: z.coerce.number().positive("Price must be greater than 0").max(100000),
  transmission: z.enum(TRANSMISSIONS), fuel_type: z.enum(FUELS),
  seating_capacity: z.coerce.number().int().min(1).max(20),
  mileage: z.string().trim().max(60).default(""),
  features: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  image_urls: z.array(z.string().min(1).max(500)).max(10).default([]),
  availability_status: z.enum(["available", "maintenance", "unavailable"]),
  is_featured: z.boolean().default(false),
});

export const reviewSchema = z.object({ carId: z.uuid(), rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(1000).default("") });
export const newsletterSchema = z.object({ email: z.email("Enter a valid email") });
export const testimonialSchema = z.object({ customer_name: z.string().trim().min(2).max(80), review: z.string().trim().min(5).max(600), rating: z.coerce.number().int().min(1).max(5), is_featured: z.boolean().default(true) });
export const bannerSchema = z.object({ title: z.string().trim().min(2).max(120), subtitle: z.string().trim().max(300).default(""), cta_label: z.string().trim().min(1).max(40), cta_href: z.string().trim().max(200).regex(/^(\/|https?:\/\/)/, "Link must start with / or https://"), is_active: z.boolean().default(true) });

export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid input";
