import { z } from "zod";
import { apiAdmin, dbMessage, fail, ok, readJson } from "@/lib/api";
import { firstError } from "@/lib/validators";

const schema = z.object({ status: z.enum(["confirmed", "cancelled", "completed"]), clearRequest: z.boolean().optional() });

/** Approve (confirmed), reject/cancel (cancelled) or complete a booking. Transition rules live in a DB trigger. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const { id } = await ctx.params;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const { error, data } = await a.supabase.from("bookings").update({ booking_status: p.data.status, cancellation_requested: false }).eq("id", id).select("id");
  if (error) return fail(dbMessage(error), error.code === "23P01" ? 409 : 400);
  if (!data?.length) return fail("Booking not found.", 404);
  return ok();
}
