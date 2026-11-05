import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "@/types";

/** Current user + profile (or nulls). Cached per request. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { supabase, user, profile: (data as Profile | null) };
});

export async function requireUser(next = "/dashboard") {
  const s = await getSession();
  if (!s.user || !s.profile) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!s.profile.is_active) redirect("/login?error=inactive");
  return { ...s, user: s.user, profile: s.profile };
}

/** Server-side admin check: the role comes from the database, never from the browser. */
export async function requireAdmin() {
  const s = await getSession();
  if (!s.user || !s.profile) redirect("/admin/login");
  if (s.profile.role !== "admin" || !s.profile.is_active) redirect("/dashboard");
  return { ...s, user: s.user, profile: s.profile };
}
