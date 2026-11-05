import { ok } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
export async function POST() { const s = await createClient(); await s.auth.signOut(); return ok(); }
