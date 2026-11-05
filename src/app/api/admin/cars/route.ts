import { apiAdmin, dbMessage, fail, ok, readJson } from "@/lib/api";
import { carSchema, firstError } from "@/lib/validators";

export async function POST(req: Request) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const p = carSchema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const { data, error } = await a.supabase.from("cars").insert(p.data).select("id").single();
  if (error) return fail(dbMessage(error));
  return ok(data, 201);
}
