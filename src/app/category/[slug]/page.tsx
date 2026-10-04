import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import ProductCard from "@/components/ProductCard";
import SortSelect, { type SortKey } from "@/components/SortSelect";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { CARD_COLUMNS, unwrap } from "@/lib/db";
import type { Product } from "@/lib/types";
import {
  type Category,
  categoryFromSlug,
  SUBCATEGORIES,
  subcategoryLabel,
} from "@/lib/subcategories";

export const revalidate = 3600;

const DAY = 86400;

type SortConf = { column: keyof Product; ascending: boolean };
const SORT_MAP: Record<SortKey, SortConf> = {
  "most-regret":  { column: "regret_score",         ascending: false },
  "least-regret": { column: "regret_score",         ascending: true  },
  "most-loved":   { column: "would_buy_again_pct",  ascending: false },
  "a-z":          { column: "name",                 ascending: true  },
};

function normalizeSort(v: string | undefined): SortKey {
  if (v === "least-regret" || v === "most-loved" || v === "a-z") return v;
  return "most-regret";
}

type ScoreFilter = "safe" | "mixed" | "regret";
type StarFilter = "4plus" | "3plus";

const SCORE_LABELS: Record<ScoreFilter, string> = {
  safe:   "Safe buy (0–30)",
  mixed:  "Mixed (31–60)",
  regret: "High regret (61+)",
};
const STAR_LABELS: Record<StarFilter, string> = {
  "4plus": "4★ and up",
  "3plus": "3★ and up",
};

const PAGE_SIZE = 60;

// searchParams make this page render per request, so the DB results themselves are cached
// (keyed by the args) for a day. A failed refresh throws and the stale entry keeps serving.
const getCategoryProducts = unstable_cache(
  async (
    cat: Category,
    sub: string | null,
    brand: string | null,
    score: ScoreFilter | null,
    stars: StarFilter | null,
    sort: SortKey,
  ): Promise<Product[]> => {
    const { column, ascending } = SORT_MAP[sort];
    let q = publicSupabase().from("products").select(CARD_COLUMNS).eq("category", cat);
    if (sub) q = q.eq("external_ids->>sub", sub);
    if (brand) q = q.eq("brand", brand);
    if (score === "safe")   q = q.lte("regret_score", 30);
    if (score === "mixed")  q = q.gt("regret_score", 30).lte("regret_score", 60);
    if (score === "regret") q = q.gt("regret_score", 60);
    if (stars === "4plus") q = q.gte("external_ids->>amazon_stars", "4");
    if (stars === "3plus") q = q.gte("external_ids->>amazon_stars", "3");
    const data = unwrap(await q.order(column, { ascending }).limit(PAGE_SIZE), "category products");
    return (data as unknown as Product[]) ?? [];
  },
  ["category-products-v2"],
  { revalidate: DAY },
);

const getTopBrands = unstable_cache(
  async (cat: Category, sub: string | null): Promise<string[]> => {
    let q = publicSupabase().from("products").select("brand").eq("category", cat);
    if (sub) q = q.eq("external_ids->>sub", sub);
    const rows = unwrap(await q.limit(1500), "category brands") ?? [];
    const counts: Record<string, number> = {};
    for (const r of rows as { brand: string | null }[]) {
      const b = (r.brand ?? "").trim();
      if (!b || b.length < 2 || b === "Unbranded") continue;
      counts[b] = (counts[b] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => b);
  },
  ["category-brands-v2"],
  { revalidate: DAY },
);

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { slug } = await params;
  const { sub } = await searchParams;
  const cat = categoryFromSlug(slug);
  if (!cat) return { title: "Category" };
  const subLabel = sub ? subcategoryLabel(cat, sub) : null;
  const title = subLabel
    ? `Most regretted ${subLabel.toLowerCase()} — ${cat}`
    : `Most regretted ${cat.toLowerCase()} products`;
  return {
    title,
    description: `Owner-verified regret data for ${subLabel ? subLabel.toLowerCase() : cat.toLowerCase()} across the US and Canada. Day 30, 60, and 90 satisfaction scores.`,
    alternates: {
      canonical: sub ? `/category/${slug}?sub=${sub}` : `/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string; sort?: string; score?: string; brand?: string; stars?: string }>;
}) {
  const { slug } = await params;
  const {
    sub,
    sort: sortParam,
    score: scoreParam,
    brand: brandParam,
    stars: starsParam,
  } = await searchParams;
  const cat = categoryFromSlug(slug);
  if (!cat) notFound();
  const sort = normalizeSort(sortParam);

  const score: ScoreFilter | null =
    scoreParam === "safe" || scoreParam === "mixed" || scoreParam === "regret" ? scoreParam : null;
  const starsFilter: StarFilter | null =
    starsParam === "4plus" || starsParam === "3plus" ? starsParam : null;
  const brandFilter = brandParam?.trim() || null;

  let products: Product[] = [];
  let topBrands: string[] = [];

  if (supabaseConfigured) {
    [products, topBrands] = await Promise.all([
      getCategoryProducts(cat, sub ?? null, brandFilter, score, starsFilter, sort),
      getTopBrands(cat, sub ?? null),
    ]);
  }

  // Subcategory pills — surface every sub the taxonomy defines for this category
  const pills = SUBCATEGORIES[cat] ?? [];
  const currentSubLabel = sub ? subcategoryLabel(cat, sub) : null;

  const buildHref = (overrides: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    const base: Record<string, string | null> = {
      sub: sub ?? null,
      sort: sortParam ?? null,
      score: score ?? null,
      brand: brandFilter ?? null,
      stars: starsFilter ?? null,
      ...overrides,
    };
    for (const [k, v] of Object.entries(base)) if (v) qs.set(k, v);
    const q = qs.toString();
    return `/category/${slug}${q ? `?${q}` : ""}`;
  };

  const activeFilterCount = [score, brandFilter, starsFilter].filter(Boolean).length;

  // Reusable filter panel body — used inside <details> on mobile, <aside> on desktop
  const FilterPanel = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--ink)]">Filters</h2>
        {activeFilterCount > 0 && (
          <Link href={buildHref({ score: null, brand: null, stars: null })} className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-coral)] hover:underline">
            Clear
          </Link>
        )}
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Regret score
        </div>
        <div className="space-y-1">
          {(Object.keys(SCORE_LABELS) as ScoreFilter[]).map((k) => {
            const active = score === k;
            return (
              <Link
                key={k}
                href={buildHref({ score: active ? null : k })}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-[var(--brand-navy)] text-white" : "text-[var(--ink-2)] hover:bg-[var(--brand-cream-2)]"
                }`}
              >
                <span>{SCORE_LABELS[k]}</span>
                {active && <span aria-hidden>✓</span>}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Star rating
        </div>
        <div className="space-y-1">
          {(Object.keys(STAR_LABELS) as StarFilter[]).map((k) => {
            const active = starsFilter === k;
            return (
              <Link
                key={k}
                href={buildHref({ stars: active ? null : k })}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-[var(--brand-navy)] text-white" : "text-[var(--ink-2)] hover:bg-[var(--brand-cream-2)]"
                }`}
              >
                <span>{STAR_LABELS[k]}</span>
                {active && <span aria-hidden>✓</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {topBrands.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Brand
          </div>
          <div className="space-y-1">
            {topBrands.map((b) => {
              const active = brandFilter?.toLowerCase() === b.toLowerCase();
              return (
                <Link
                  key={b}
                  href={buildHref({ brand: active ? null : b })}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-[var(--brand-navy)] text-white" : "text-[var(--ink-2)] hover:bg-[var(--brand-cream-2)]"
                  }`}
                >
                  <span className="truncate">{b}</span>
                  {active && <span aria-hidden>✓</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="mb-6 max-w-2xl sm:mb-8" data-rr>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
          {cat}
          {currentSubLabel && <span className="ml-2 text-[var(--muted)]">/ {currentSubLabel}</span>}
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          {currentSubLabel ? currentSubLabel : `Most regretted ${cat.toLowerCase()}`}
        </h1>
        <p className="mt-2 text-base text-[var(--ink-2)] sm:mt-3 sm:text-lg">
          Owner-verified regret scores at day 30, 60, and 90.
        </p>
      </div>

      {/* Subcategory pills row — horizontal scroll on mobile so pills don't wrap awkwardly */}
      {pills.length > 0 && (
        <div className="mb-5 -mx-4 overflow-x-auto px-4 sm:mb-6 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex flex-nowrap gap-2 sm:flex-wrap">
            <Link
              href={buildHref({ sub: null })}
              className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                !sub ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white" : "border-[var(--rule)] bg-white text-[var(--ink-2)] hover:border-[var(--brand-coral)]"
              }`}
            >
              All
            </Link>
            {pills.map((p) => {
              const active = sub === p.slug;
              return (
                <Link
                  key={p.slug}
                  href={buildHref({ sub: p.slug, brand: null })}
                  className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                    active ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white" : "border-[var(--rule)] bg-white text-[var(--ink-2)] hover:border-[var(--brand-coral)]"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort row + mobile filter toggle */}
      <div className="mb-6 flex items-center justify-between gap-3 border-t border-[var(--rule)] pt-4 sm:mb-8">
        {/* Mobile filter link — jumps to the collapsible panel below */}
        <a href="#filters" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--rule)] bg-white px-3 py-2 text-sm text-[var(--ink-2)] lg:hidden">
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[var(--brand-coral)] px-1.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </a>
        <span className="hidden lg:block" />
        <SortSelect current={sort} />
      </div>

      {/* Grid + right-hand filter panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_240px] lg:gap-8">
        <div>
          {products.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--rule)] bg-white p-8 text-center text-sm text-[var(--muted)]">
              No products match these filters.{" "}
              {activeFilterCount > 0 && (
                <Link href={buildHref({ score: null, brand: null, stars: null })} className="font-semibold text-[var(--brand-navy)] underline">
                  Clear filters
                </Link>
              )}
            </p>
          )}
        </div>

        {/* Desktop filter panel */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-[var(--rule)] bg-white p-5">
            {FilterPanel}
          </div>
        </aside>

        {/* Mobile filter panel — <details> is native, no JS, keyboard-accessible */}
        <details id="filters" className="rounded-2xl border border-[var(--rule)] bg-white lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 font-display text-lg font-semibold text-[var(--ink)]">
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-[var(--brand-coral)] px-2 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </summary>
          <div className="px-5 pb-5 pt-1">{FilterPanel}</div>
        </details>
      </div>
    </div>
  );
}
