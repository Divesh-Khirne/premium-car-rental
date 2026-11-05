/**
 * EDIT HERE — central branding & business settings.
 */
export const SITE = {
  name: "Aurum Drive",
  tagline: "Drive Your Journey. Discover the Freedom.",
  description: "Premium car rental with transparent pricing, instant availability and a hand-picked fleet.",
  email: "hello@aurumdrive.example",   // EDIT HERE
  phone: "+1 (555) 010-2030",          // EDIT HERE
  address: "100 Harbour Street, Your City", // EDIT HERE
};
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "USD";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Pickup locations offered in the search box (users can still type any address). EDIT HERE. */
export const LOCATIONS = ["City Centre Showroom", "International Airport", "Central Railway Station", "Harbour Terminal", "Hotel delivery"];
export const CATEGORIES = ["Luxury", "SUV", "Sports", "Sedan", "Electric", "Van", "Convertible"] as const;
export const FUELS = ["Petrol", "Diesel", "Electric", "Hybrid"] as const;
export const TRANSMISSIONS = ["Automatic", "Manual"] as const;
export const MAX_RENTAL_DAYS = 90;
