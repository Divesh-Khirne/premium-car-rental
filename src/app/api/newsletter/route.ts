import { dbMessage, fail, ok, readJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { firstError, newsletterSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const p = newsletterSchema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const s = await createClient();
  const { error } = await s.from("newsletter_subscribers").insert({ email: p.data.email.toLowerCase() });
  if (error && error.code !== "23505") return fail(dbMessage(error)); // duplicates count as success
  return ok();
}
