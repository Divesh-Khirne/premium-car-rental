import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";

/**
 * Runs on every request (see src/proxy.ts): refreshes the Supabase session and gates routes.
 * This is a first line of defence; pages and API routes ALSO verify the role on the server.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const redirect = (to: string, next?: boolean) => {
    const url = request.nextUrl.clone();
    url.pathname = to; url.search = "";
    if (next) url.searchParams.set("next", path + request.nextUrl.search);
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  const isAdminArea = path.startsWith("/admin") && path !== "/admin/login";
  const isAdminApi = path.startsWith("/api/admin");
  const needsLogin = path.startsWith("/dashboard") || path.startsWith("/booking");

  if (isAdminApi && !user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (isAdminArea && !user) return redirect("/admin/login", true);
  if (needsLogin && !user) return redirect("/login", true);
  if ((path === "/login" || path === "/register") && user) return redirect("/dashboard");

  if (user && (isAdminArea || isAdminApi)) {
    const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", user.id).single();
    if (profile?.role !== "admin" || !profile.is_active) {
      if (isAdminApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      return redirect("/dashboard");
    }
  }
  return response;
}
