import "server-only";

// Everything ProductCard / AlternativeCard / ProductRail render. Keep list queries on this
// instead of "*" — the satisfaction + regret-reason columns are only needed on product pages.
export const CARD_COLUMNS =
  "id, slug, name, brand, category, image_url, amazon_url, regret_score, would_buy_again_pct, total_ratings, external_ids";

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

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
