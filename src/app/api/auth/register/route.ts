import { fail, ok, readJson } from "@/lib/api";
import { SITE_URL } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { firstError, registerSchema } from "@/lib/validators";

/** Public registration always creates a CUSTOMER (the database trigger forces role = 'customer'). */
export async function POST(req: Request) {
  const p = registerSchema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.fullName, phone: p.data.phone }, emailRedirectTo: `${SITE_URL}/auth/callback?next=/dashboard` },
  });
  if (error) return fail(error.message.toLowerCase().includes("already") ? "An account with this email already exists." : error.message, 400);
  return ok({ needsConfirmation: !data.session });
}
