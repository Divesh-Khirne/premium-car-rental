"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Browser Supabase client (uses only the public anon key; Row Level Security protects data). */
export function createClient() { return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY); }
