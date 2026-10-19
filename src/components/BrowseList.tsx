import "server-only";
import Link from "next/link";
import { cache } from "react";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { unwrap } from "@/lib/db";
import { BROWSE_PAGES, BROWSE_PAGE_SIZE, browsePath, listedProducts } from "@/lib/listed-products";
import { tierFor } from "@/lib/regretScore";
import { DESC_MAX, pageMeta, shortName, withSuffix } from "@/lib/seo";

type Row = { slug: string; name: string; brand: string | null; category: string | null; regret_score: number };

// One indexed range query per page (created_at index, 100 small rows). Shared by metadata and
// the page through cache(), and the page itself is cached for a week.
export const loadBrowsePage = cache(async (page: number): Promise<Row[]> => {
  if (!supabaseConfigured) return [];
  const from = (page - 1) * BROWSE_PAGE_SIZE;
  const data = unwrap(
    await listedProducts(publicSupabase(), "slug, name, brand, category, regret_score", from, from + BROWSE_PAGE_SIZE - 1),
    "browse products",
  );
  return (data as unknown as Row[] | null) ?? [];
});

export async function browseMetadata(page: number) {
  const rows = await loadBrowsePage(page);
  if (page === 1) {
    return pageMeta({
      path: browsePath(1),
      title: withSuffix("Browse Rated Products"),
      description:
        "A plain list of the products Pregret scores, 100 per page. Open any product to see its Regret Score and how satisfaction holds up at day 30, 60, and 90.",
    });
  }
  // Unique per page: names the first and last product listed on it.
  const lead = `Page ${page} of ${BROWSE_PAGES} of rated products on Pregret`;
  const tail = ". Open any one to see its Regret Score.";
  let description = `${lead}. Open any product to see its Regret Score and how satisfaction holds up over 90 days.`;
  if (rows.length > 1) {
    const budget = Math.floor((DESC_MAX - lead.length - tail.length - ", from  to ".length) / 2);
    const first = shortName(rows[0].name, budget);
    const last = shortName(rows[rows.length - 1].name, budget);
    if (budget >= 12) description = `${lead}, from ${first} to ${last}${tail}`;
  }
  return pageMeta({
    path: browsePath(page),
    title: withSuffix(`Browse Rated Products, Page ${page} of ${BROWSE_PAGES}`),
    description,
  });
}

const TIER_STYLE = {
  low: "bg-[color-mix(in_srgb,var(--keep-green)_14%,white)] text-[var(--keep-green)]",
  medium: "bg-[color-mix(in_srgb,var(--regret-amber)_18%,white)] text-[#9a6412]",
  high: "bg-[color-mix(in_srgb,var(--regret-red)_14%,white)] text-[var(--regret-red)]",
} as const;

export default async function BrowseList({ page }: { page: number }) {
  const rows = await loadBrowsePage(page);
  const first = (page - 1) * BROWSE_PAGE_SIZE + 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-5 sm:py-12">
      <div className="mb-8 max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
          Browse{page > 1 ? ` · Page ${page} of ${BROWSE_PAGES}` : ""}
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          Browse rated products
        </h1>
        <p className="mt-3 text-base text-[var(--ink-2)] sm:text-lg">
          A plain list of the products we score, {BROWSE_PAGE_SIZE} per page. Open any product to see its
          Regret Score, from 0 (owners stay happy) to 100 (most owners regret it).
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Prefer to shop by type?{" "}
          <Link href="/categories" className="font-semibold text-[var(--brand-navy)] underline decoration-[color:var(--brand-coral)] underline-offset-2">
            See every category
          </Link>
          .
        </p>
      </div>

      {rows.length > 0 ? (
        <ol start={first} className="divide-y divide-[var(--rule)] overflow-hidden rounded-2xl border border-[var(--rule)] bg-white">
          {rows.map((p) => {
            const tier = tierFor(p.regret_score);
            return (
              <li key={p.slug} className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${p.slug}`}
                    className="line-clamp-2 break-words text-sm font-medium text-[var(--ink)] hover:text-[var(--brand-coral)] sm:text-base"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-0.5 truncate text-xs text-[var(--muted)]">
                    {[p.brand, p.category].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${TIER_STYLE[tier]}`}
                  title="Regret Score out of 100"
                >
                  {p.regret_score}
                  <span className="sr-only"> out of 100 Regret Score</span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--rule)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          This list is not available right now. Please try again soon.
        </p>
      )}

      <nav aria-label="Browse pages" className="mt-10">
        <div className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={browsePath(page - 1)} rel="prev" className="rounded-full border border-[var(--rule)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-navy)] hover:border-[var(--brand-coral)]">
              ← Previous
            </Link>
          ) : <span />}
          {page < BROWSE_PAGES ? (
            <Link href={browsePath(page + 1)} rel="next" className="rounded-full border border-[var(--rule)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-navy)] hover:border-[var(--brand-coral)]">
              Next →
            </Link>
          ) : <span />}
        </div>
        <ul className="mt-6 flex flex-wrap gap-1.5">
          {Array.from({ length: BROWSE_PAGES }, (_, i) => i + 1).map((n) => (
            <li key={n}>
              <Link
                href={browsePath(n)}
                aria-current={n === page ? "page" : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-xs tabular-nums ${
                  n === page
                    ? "bg-[var(--brand-navy)] font-semibold text-white"
                    : "border border-[var(--rule)] bg-white text-[var(--ink-2)] hover:border-[var(--brand-coral)]"
                }`}
              >
                {n}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
