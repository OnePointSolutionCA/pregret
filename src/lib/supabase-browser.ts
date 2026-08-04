import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function browserSupabase() {
  return createBrowserClient(url, anon);
}

export const supabaseConfigured = Boolean(url && anon);
