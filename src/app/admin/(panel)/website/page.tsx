import { WebsiteAdmin } from "@/components/admin/WebsiteAdmin";
import { requireAdmin } from "@/lib/auth";
import { getCars } from "@/lib/data";
import type { PromoBanner, Testimonial } from "@/types";

export const metadata = { title: "Website" };
export default async function AdminWebsite() {
  const { supabase } = await requireAdmin();
  const [cars, { data: banners }, { data: testimonials }] = await Promise.all([
    getCars(),
    supabase.from("promo_banners").select("*").order("created_at", { ascending: false }),
    supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
  ]);
  return <WebsiteAdmin cars={cars} banners={(banners ?? []) as PromoBanner[]} testimonials={(testimonials ?? []) as Testimonial[]} />;
}
