import { apiAdmin, dbMessage, fail, ok, readJson } from "@/lib/api";
import { carSchema, firstError } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH accepts a partial car (used for full edits, quick availability toggles, price changes, featured flag). */
export async function PATCH(req: Request, ctx: Ctx) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const { id } = await ctx.params;
  const p = carSchema.partial().safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const { error, data } = await a.supabase.from("cars").update(p.data).eq("id", id).select("id");
  if (error) return fail(dbMessage(error));
  if (!data?.length) return fail("Vehicle not found.", 404);
  return ok();
}

export async function DELETE(_: Request, ctx: Ctx) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const { id } = await ctx.params;
  const { error, data } = await a.supabase.from("cars").delete().eq("id", id).select("id");
  if (error) return fail(dbMessage(error), 409);
  if (!data?.length) return fail("Vehicle not found.", 404);
  return ok();
}
