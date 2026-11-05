import { apiUser, dbMessage, fail, ok, readJson } from "@/lib/api";
import { firstError, reviewSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const a = await apiUser();
  if (a instanceof Response) return a;
  const p = reviewSchema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  const { error } = await a.supabase.from("reviews").insert({ customer_id: a.user.id, car_id: p.data.carId, rating: p.data.rating, comment: p.data.comment });
  if (error) return fail(error.code === "23505" ? "You have already reviewed this vehicle." : dbMessage(error), error.code === "23505" ? 409 : 400);
  return ok({}, 201);
}
