import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import HeroMosaicClient from "./HeroMosaicClient";

/**
 * Hero backdrop: 12 floating tiles that cycle through ~150 popular product
 * photos on ~10s crossfades. One full pass ≈ 2 min, then loops forever so
 * the hero always feels alive with new products.
 */
export default async function HeroMosaic() {
  let products: Product[] = [];
  if (supabaseConfigured) {
    const supabase = publicSupabase();
    // Pull a large well-known pool — most-reviewed real products beat "highest regret"
    // for hero visuals (fewer weird niche items).
    const { data } = await supabase
      .from("products")
      .select("slug, name, brand, image_url, regret_score, category, external_ids")
      .not("image_url", "is", null)
      .limit(600);
    const all = ((data as (Product & { external_ids: { amazon_reviews?: string } | null })[]) ?? [])
      .filter((p) => p.image_url);
    // Sort by review count (curated fallback = 500) so the pool skews recognizable
    all.sort((a, b) => {
      const ar = parseInt(a.external_ids?.amazon_reviews ?? "0", 10) || 500;
      const br = parseInt(b.external_ids?.amazon_reviews ?? "0", 10) || 500;
      return br - ar;
    });
    // Round-robin by category so the pool has variety, not just Electronics
    const byCat: Record<string, Product[]> = {};
    for (const p of all) {
      const k = p.category ?? "x";
      (byCat[k] ??= []).push(p);
    }
    const keys = Object.keys(byCat);
    const pool: Product[] = [];
    while (pool.length < 72 && keys.some((k) => byCat[k].length > 0)) {
      for (const k of keys) {
        const n = byCat[k].shift();
        if (n) pool.push(n);
        if (pool.length >= 72) break;
      }
    }
    products = pool;
  }

  const images = products.map((p) => p.image_url!).filter(Boolean);

  return <HeroMosaicClient images={images} />;
}
