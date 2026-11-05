import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { firstError } from "@/lib/validators";

const schema = z.object({ email: z.email("Enter a valid email"), password: z.string().min(1, "Enter your password") });

/** Admin sign-in. The role is verified in the database on the server; non-admins are signed straight back out. */
export async function POST(req: Request) {
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(p.data);
  if (error || !data.user) return fail("Incorrect email or password.", 401);
  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", data.user.id).single();
  if (profile?.role !== "admin" || !profile.is_active) {
    await supabase.auth.signOut();
    return fail("This account does not have administrator access.", 403);
  }
  return ok();
}
