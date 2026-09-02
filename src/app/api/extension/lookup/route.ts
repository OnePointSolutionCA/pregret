import { NextResponse, type NextRequest } from "next/server";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { buildGoUrl } from "@/lib/affiliates";
import type { Product } from "@/lib/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title")?.trim();
  const brand = url.searchParams.get("brand")?.trim();
  const asin = url.searchParams.get("asin")?.trim();

  if (!supabaseConfigured || (!title && !asin)) {
    return NextResponse.json({ matched: false }, { headers: CORS });
  }

  const supabase = publicSupabase();
  let match: Product | null = null;

  if (asin) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .contains("external_ids", { asin })
      .maybeSingle();
    match = (data as Product | null) ?? null;
  }

  if (!match && title) {
    let q = supabase.from("products").select("*").ilike("name", `%${title}%`);
    if (brand) q = q.ilike("brand", `%${brand}%`);
    const { data } = await q.limit(1).maybeSingle();
    match = (data as Product | null) ?? null;
  }

  if (!match) return NextResponse.json({ matched: false }, { headers: CORS });

  const { data: altRows } = await supabase
    .from("product_alternatives")
    .select("alternative:alternative_product_id(*)")
    .eq("product_id", match.id)
    .order("switch_count", { ascending: false })
    .limit(1);
  const best = ((altRows as { alternative: Product }[] | null) ?? [])[0]?.alternative;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregret.ca";
  const reasons = match.top_regret_reasons ?? [];

  return NextResponse.json(
    {
      matched: true,
      product_id: match.id,
      product_slug: match.slug,
      regret_score: match.regret_score,
      would_buy_again_pct: match.would_buy_again_pct,
      top_regret_reason: reasons[0]?.reason ?? null,
      total_ratings: match.total_ratings,
      best_alternative: best
        ? {
            name: best.name,
            regret_score: best.regret_score,
            would_buy_again_pct: best.would_buy_again_pct,
            affiliate_url: buildGoUrl(best.id, "ext"),
          }
        : null,
      full_report_url: `${site}/product/${match.slug}`,
    },
    { headers: CORS }
  );
}
