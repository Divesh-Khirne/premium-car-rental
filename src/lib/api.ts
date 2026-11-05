import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "./supabase/server";
import type { Profile } from "@/types";

export const ok = (data: unknown = {}, status = 200) => NextResponse.json({ ok: true, data }, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/** Authenticated API caller. Returns a Response on failure so handlers can `if (a instanceof Response) return a`. */
export async function apiUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in first.", 401);
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || !(profile as Profile).is_active) return fail("Your account is not active.", 403);
  return { supabase, user, profile: profile as Profile };
}
export async function apiAdmin() {
  const a = await apiUser();
  if (a instanceof Response) return a;
  if (a.profile.role !== "admin") return fail("Admin access required.", 403);
  return a;
}
export async function readJson(req: Request) { try { return await req.json(); } catch { return null; } }

/** Translate Postgres / RLS errors into friendly messages. */
export function dbMessage(e: { code?: string; message?: string }) {
  if (e.code === "23P01") return "Sorry, this vehicle was just booked for part of those dates. Please choose different dates.";
  if (e.code === "23503") return "This record is still in use (for example a vehicle with bookings). Set it to unavailable instead of deleting.";
  if (e.code === "23505") return "That already exists.";
  if (e.code === "42501") return "You do not have permission to do that.";
  if (e.code === "P0001") return e.message ?? "Request rejected.";
  return "Something went wrong. Please try again.";
}
