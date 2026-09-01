import { NextRequest, NextResponse } from "next/server";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const runtime = "nodejs";
// Fresh per request so typeahead is always live; response is small so this is fine.
export const dynamic = "force-dynamic";

type Row = Pick<Product, "slug" | "name" | "brand" | "category" | "image_url" | "regret_score">;

/**
 * Server-side typeahead. Uses the pg_trgm GIN index on products.name for fast
 * fuzzy matching at scale (works up to hundreds of thousands of rows). Replaces
 * the old /api/search-index endpoint that shipped the full catalog to the
 * browser for Fuse.js — that pattern falls over past ~30k products.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2 || !supabaseConfigured) {
    return NextResponse.json({ items: [] });
  }
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "8", 10) || 8, 20);
  const supabase = publicSupabase();

  // Escape LIKE wildcards in user input
  const safe = q.replace(/[%_\\]/g, "\\$&");
  const { data } = await supabase
    .from("products")
    .select("slug, name, brand, category, image_url, regret_score")
    .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%`)
    .order("regret_score", { ascending: false })
    .limit(limit);

  const items = ((data as Row[]) ?? []).map((p) => ({
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: null,
    image_url: p.image_url,
    regret_score: p.regret_score,
  }));

  // Aggressive edge-cache — same query → same result for 1 hour. Cuts Fluid Active
  // CPU dramatically because typeahead queries repeat (users type same brands/terms).
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
