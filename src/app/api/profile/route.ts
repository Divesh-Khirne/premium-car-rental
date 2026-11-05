import { apiUser, dbMessage, fail, ok, readJson } from "@/lib/api";
import { firstError, profileSchema } from "@/lib/validators";

export async function PATCH(req: Request) {
  const a = await apiUser();
  if (a instanceof Response) return a;
  const p = profileSchema.safeParse(await readJson(req));
  if (!p.success) return fail(firstError(p.error));
  // role / email / is_active are NOT updatable here (and a DB trigger blocks them anyway)
  const { error } = await a.supabase.from("profiles").update({
    full_name: p.data.fullName, phone: p.data.phone, ...(p.data.avatarUrl !== undefined ? { avatar_url: p.data.avatarUrl } : {}),
  }).eq("id", a.user.id);
  if (error) return fail(dbMessage(error));
  return ok();
}
