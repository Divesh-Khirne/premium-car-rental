export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const isSupabaseConfigured =
  /^https?:\/\//.test(SUPABASE_URL) && !SUPABASE_URL.includes("YOUR-PROJECT") && SUPABASE_ANON_KEY.length > 10 && !SUPABASE_ANON_KEY.startsWith("YOUR-");
