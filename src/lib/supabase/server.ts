import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Server Supabase client bound to the visitor's session cookies. Every query runs as that user, so RLS applies. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component: ignored, the proxy refreshes sessions */ } },
    },
  });
}
