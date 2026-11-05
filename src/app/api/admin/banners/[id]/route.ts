import { apiAdmin, dbMessage, fail, ok, readJson } from "@/lib/api";
import { bannerSchema, firstError } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const { id } = await ctx.params;
  const p = bannerSchema.partial().safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const { error, data } = await a.supabase.from("promo_banners").update(p.data).eq("id", id).select("id");
  if (error) return fail(dbMessage(error));
  if (!data?.length) return fail("Not found.", 404);
  return ok();
}

export async function DELETE(_: Request, ctx: Ctx) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const { id } = await ctx.params;
  const { error } = await a.supabase.from("promo_banners").delete().eq("id", id);
  if (error) return fail(dbMessage(error));
  return ok();
}
