import { z } from "zod";
import { apiUser, dbMessage, fail, ok, readJson } from "@/lib/api";
import { firstError } from "@/lib/validators";

const schema = z.object({ action: z.enum(["cancel", "request_cancel"]) });

/** Customers: cancel a pending booking, or request cancellation of a confirmed one. RLS + trigger enforce ownership. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiUser();
  if (a instanceof Response) return a;
  const { id } = await ctx.params;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));

  const { data: current } = await a.supabase.from("bookings").select("booking_status,customer_id").eq("id", id).maybeSingle();
  if (!current || current.customer_id !== a.user.id) return fail("Booking not found.", 404);

  const patch = p.data.action === "cancel" && current.booking_status === "pending"
    ? { booking_status: "cancelled" }
    : current.booking_status === "confirmed" || current.booking_status === "pending"
      ? { cancellation_requested: true }
      : null;
  if (!patch) return fail("This booking can no longer be cancelled.", 409);
  const { error } = await a.supabase.from("bookings").update(patch).eq("id", id);
  if (error) return fail(dbMessage(error));
  return ok({ cancelled: "booking_status" in patch });
}
