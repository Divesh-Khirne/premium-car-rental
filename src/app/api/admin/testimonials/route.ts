import { apiAdmin, dbMessage, fail, ok, readJson } from "@/lib/api";
import { testimonialSchema, firstError } from "@/lib/validators";

export async function POST(req: Request) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const p = testimonialSchema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const { error } = await a.supabase.from("testimonials").insert(p.data);
  if (error) return fail(dbMessage(error));
  return ok({}, 201);
}
