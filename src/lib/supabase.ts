import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function serverSupabase() {
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          try {
            store.set(name, value, options);
          } catch {
            // Called from a server component render; safe to ignore.
          }
        }
      },
    },
  });
}

export function serviceSupabase() {
  return createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const supabaseConfigured = Boolean(url && anon);

/**
 * Cookie-less read-only Supabase client for public pages (home, category,
 * product, blog, etc.). Using `cookies()` via serverSupabase() opts a page
 * out of static rendering and forces every request to be dynamic — which
 * ate our Vercel Fluid Active CPU quota. This client has no cookie access,
 * so pages using it can be fully cached via ISR (revalidate = N).
 */
export function publicSupabase() {
  return createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
