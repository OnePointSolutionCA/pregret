import type { Metadata } from "next";
import Link from "next/link";
import RegretScore from "@/components/RegretScore";
import AmazonCountryCTA from "@/components/AmazonCountryCTA";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare products",
  description: "Side-by-side regret scores, ratings and prices for up to 3 products.",
  robots: { index: false, follow: true },
};

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await searchParams;
  const slugs = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);

  let products: Product[] = [];
  if (slugs.length && supabaseConfigured) {
    const supabase = publicSupabase();
    const { data } = await supabase.from("products").select("*").in("slug", slugs);
    // Preserve URL order
    products = slugs
      .map((s) => (data as Product[] | null)?.find((p) => p.slug === s))
      .filter((p): p is Product => Boolean(p));
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold text-[var(--ink)]">Nothing to compare yet</h1>
        <p className="mt-4 text-[var(--ink-2)]">
          Tap <strong>Compare</strong> on any product card to add it here. You can compare up to 3 side by side.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-[var(--brand-navy)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-navy-2)]"
        >
          Browse products
        </Link>
      </div>
    );
  }

  // Explicit grid-template-columns for both product headers and comparison rows so
  // cells align perfectly regardless of item count. Inline style bypasses Tailwind JIT.
  // Wider min column on mobile prevents label wrap; horizontal scroll takes over when needed.
  const cols = products.length;
  const rowStyle = { gridTemplateColumns: `130px repeat(${cols}, minmax(180px, 1fr))` };

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: "Regret score",
      render: (p) => (
        <div className="flex justify-center">
          <RegretScore score={p.regret_score} totalRatings={p.total_ratings} size="sm" />
        </div>
      ),
    },
    {
      label: "Would buy again",
      render: (p) => <span className="font-semibold text-[var(--ink)]">{p.would_buy_again_pct}%</span>,
    },
    {
      label: "Amazon rating",
      render: (p) => {
        const s = parseFloat((p.external_ids as { amazon_stars?: string } | null)?.amazon_stars ?? "0") || 0;
        const r = parseInt((p.external_ids as { amazon_reviews?: string } | null)?.amazon_reviews ?? "0", 10) || 0;
        return s > 0 ? (
          <span>
            <span className="font-semibold text-[var(--ink)]">{s.toFixed(1)}★</span>
            {r > 0 && <span className="ml-1 text-xs text-[var(--muted)]">({r.toLocaleString()})</span>}
          </span>
        ) : (
          <span className="text-xs text-[var(--muted)]">—</span>
        );
      },
    },
    {
      label: "Category",
      render: (p) => <span className="text-sm text-[var(--ink-2)]">{p.category ?? "—"}</span>,
    },
    {
      label: "Brand",
      render: (p) => <span className="text-sm text-[var(--ink-2)]">{p.brand ?? "—"}</span>,
    },
    {
      label: "Day 30 satisfaction",
      render: (p) => <span>{p.avg_satisfaction_day30 ?? "—"}</span>,
    },
    {
      label: "Day 60 satisfaction",
      render: (p) => <span>{p.avg_satisfaction_day60 ?? "—"}</span>,
    },
    {
      label: "Day 90 satisfaction",
      render: (p) => <span>{p.avg_satisfaction_day90 ?? "—"}</span>,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="mb-6 max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">Compare</div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
          Side-by-side regret scores
        </h1>
      </div>

      {/* Unified grid: same column template drives both the product header row and every comparison row.
          On desktop: label column + N product columns. On mobile: horizontal scroll so wide comparisons stay usable. */}
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <div className="min-w-[640px] px-4 sm:min-w-0 sm:px-0">
          {/* Product header row */}
          <div className="grid gap-4 lg:gap-6" style={rowStyle}>
            <div /> {/* empty cell above row labels */}
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[var(--rule)] bg-white p-4">
                <Link href={`/product/${p.slug}`} className="block">
                  <div className="mx-auto flex h-32 items-center justify-center overflow-hidden rounded-xl bg-[var(--brand-cream-2)] sm:h-40">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt="" loading="eager" className="max-h-full max-w-full object-contain p-3" />
                    ) : null}
                  </div>
                  <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
                    {p.brand ?? p.category}
                  </div>
                  <div className="line-clamp-2 mt-1 text-sm font-semibold text-[var(--ink)]">{p.name}</div>
                </Link>
                <div className="mt-3">
                  <AmazonCountryCTA productId={p.id} source="compare" variant="compact" />
                </div>
              </div>
            ))}
          </div>

          {/* Comparison rows — same grid template, so cells align perfectly with the product headers above */}
          <div className="mt-6 divide-y divide-[var(--rule)] rounded-2xl border border-[var(--rule)] bg-white">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid items-center gap-4 px-4 py-4 lg:gap-6"
                style={rowStyle}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {row.label}
                </div>
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-center text-center text-sm text-[var(--ink-2)]"
                  >
                    {row.render(p)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
