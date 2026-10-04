import "server-only";

// Everything ProductCard / AlternativeCard / ProductRail render. Keep list queries on this
// instead of "*" — the satisfaction + regret-reason columns are only needed on product pages.
export const CARD_COLUMNS =
  "id, slug, name, brand, category, image_url, amazon_url, regret_score, would_buy_again_pct, total_ratings, external_ids";

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

// Search must not ORDER BY in SQL: for common terms ("black", "lego") Postgres walks the
// regret_score index across all 283k rows and hits the anon timeout. Let the trigram
// indexes find matches, then rank here: brand hits first, then most regretted.
export function rankSearch<T extends { brand: string | null; regret_score: number }>(rows: T[], query: string): T[] {
  const q = query.toLowerCase();
  const brandHit = (r: T) => ((r.brand ?? "").toLowerCase().includes(q) ? 0 : 1);
  return [...rows].sort((a, b) => brandHit(a) - brandHit(b) || b.regret_score - a.regret_score);
}

export function searchFilter(query: string): string | null {
  // Strip LIKE wildcards and PostgREST filter syntax so input can't alter the .or() filter.
  const safe = query.replace(/[%_\\(),"]/g, " ").trim();
  return safe ? `name.ilike.%${safe}%,brand.ilike.%${safe}%` : null;
}

type Result<T> = { data: T | null; error: { message?: string } | null };

// Throw on DB failure instead of rendering an empty page: Next then keeps serving the last
// good cached copy. Soft during `next build` so a deploy can't fail while the DB is down.
export function unwrap<T>(res: Result<T>, label: string): T | null {
  if (res.error) {
    if (isBuild) return null;
    throw new Error(`Supabase ${label} failed: ${res.error.message || "unknown error"}`);
  }
  return res.data;
}
