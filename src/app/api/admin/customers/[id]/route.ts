import { z } from "zod";
import { apiAdmin, dbMessage, fail, ok, readJson } from "@/lib/api";
import { firstError } from "@/lib/validators";

/** Activate / deactivate a customer account. Roles are NOT changeable here (see README: promote admins via SQL). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const { id } = await ctx.params;
  if (id === a.user.id) return fail("You cannot deactivate your own account.", 400);
  const p = z.object({ is_active: z.boolean() }).safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const { error, data } = await a.supabase.from("profiles").update({ is_active: p.data.is_active }).eq("id", id).eq("role", "customer").select("id");
  if (error) return fail(dbMessage(error));
  if (!data?.length) return fail("Customer not found.", 404);
  return ok();
}
