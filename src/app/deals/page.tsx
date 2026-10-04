import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { CARD_COLUMNS, unwrap } from "@/lib/db";
import type { Product } from "@/lib/types";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Deals — Safest buys with 4★+ ratings",
  description:
    "Top-rated products with low regret scores across the US and Canada. Curated from owner-verified satisfaction data at day 30, 60, and 90.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage() {
  let products: Product[] = [];
  if (supabaseConfigured) {
    const supabase = publicSupabase();
    const data = unwrap(
      await supabase
        .from("products")
        .select(CARD_COLUMNS)
        .lte("regret_score", 30)
        .gte("external_ids->>amazon_stars", "4.4")
        .not("image_url", "is", null)
        .order("regret_score", { ascending: true })
        .limit(60),
      "deals",
    );
    products = (data as unknown as Product[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="mb-6 max-w-2xl sm:mb-8" data-rr>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
          Deals
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          Safest buys, top-rated
        </h1>
        <p className="mt-2 text-base text-[var(--ink-2)] sm:mt-3 sm:text-lg">
          Products with the lowest regret scores and 4.4★+ ratings from real owners. Updated daily.
        </p>
      </div>

      {products.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--rule)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          No deals available right now — check back soon.
        </p>
      )}
    </div>
  );
}
