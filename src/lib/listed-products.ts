import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// The products we list in sitemap.xml and link from /browse. Both use this exact order, so every
// product in the sitemap has an internal link (no orphan pages).
//
// Oldest first, on purpose. The catalog was imported in descending review count order, so the
// newest rows are the least reviewed (1 or 2 Amazon reviews, default score). The oldest rows are
// the August 2026 imports with thousands of reviews each. New products append at the end, so this
// set stays stable. Capped at 10,000 to keep crawler load where it is (it was cut from 49,500 after
// a Vercel spike). id breaks ties, since batch inserts share one created_at.
export const LISTED_PRODUCT_CAP = 10000;
export const BROWSE_PAGE_SIZE = 100;
export const BROWSE_PAGES = Math.ceil(LISTED_PRODUCT_CAP / BROWSE_PAGE_SIZE);

export function listedProducts(supabase: SupabaseClient, columns: string, from: number, to: number) {
  return supabase
    .from("products")
    .select(columns)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(from, Math.min(to, LISTED_PRODUCT_CAP - 1));
}

export function browsePath(page: number): string {
  return page <= 1 ? "/browse" : `/browse/${page}`;
}
