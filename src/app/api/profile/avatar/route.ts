import { apiUser, fail, ok } from "@/lib/api";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: Request) {
  const a = await apiUser();
  if (a instanceof Response) return a;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("No file uploaded.");
  if (!TYPES[file.type]) return fail("Use a JPG, PNG or WebP image.");
  if (file.size > 2 * 1024 * 1024) return fail("Image must be 2 MB or smaller.");
  const path = `${a.user.id}/avatar-${Date.now()}.${TYPES[file.type]}`;
  const { error } = await a.supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
  if (error) return fail("Upload failed. Check that the 'avatars' bucket and its policies exist (see README).", 500);
  const url = a.supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  const { error: e2 } = await a.supabase.from("profiles").update({ avatar_url: url }).eq("id", a.user.id);
  if (e2) return fail("Could not save the new picture.", 500);
  return ok({ url });
}
