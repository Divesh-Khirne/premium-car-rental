import { apiAdmin, fail, ok } from "@/lib/api";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Upload a vehicle photo to the public 'car-images' bucket (admin only; the bucket policy also enforces this). */
export async function POST(req: Request) {
  const a = await apiAdmin();
  if (a instanceof Response) return a;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("No file uploaded.");
  if (!TYPES[file.type]) return fail("Use a JPG, PNG, WebP or AVIF image.");
  if (file.size > 5 * 1024 * 1024) return fail("Image must be 5 MB or smaller.");
  const path = `cars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${TYPES[file.type]}`;
  const { error } = await a.supabase.storage.from("car-images").upload(path, file, { contentType: file.type });
  if (error) return fail("Upload failed. Make sure the 'car-images' bucket exists and the storage policies are installed (README, Step 4).", 500);
  return ok({ url: a.supabase.storage.from("car-images").getPublicUrl(path).data.publicUrl }, 201);
}
