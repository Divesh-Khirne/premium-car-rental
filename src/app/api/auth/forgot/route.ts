import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { firstError } from "@/lib/validators";

export async function POST(req: Request) {
  const p = z.object({ email: z.email("Enter a valid email") }).safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const s = await createClient();
  await s.auth.resetPasswordForEmail(p.data.email, { redirectTo: `${SITE_URL}/auth/callback?next=/reset-password` });
  return ok(); // same response whether or not the email exists (prevents account enumeration)
}
