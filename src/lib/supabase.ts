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
