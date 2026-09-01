import Link from "next/link";
import SmartSearch from "@/components/SmartSearch";
import RegretScore from "@/components/RegretScore";
import HeroMosaic from "@/components/HeroMosaic";
import CategoryTile from "@/components/CategoryTile";
import ProductRail from "@/components/ProductRail";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { CATEGORY_ORDER } from "@/lib/subcategories";
import { DEMO_PRODUCTS } from "@/lib/demo";
import type { Product } from "@/lib/types";

// ISR: revalidate the whole homepage every hour. The Supabase queries below
// (regret/loved/newest/trending/all-for-category-hero) were previously running
// on every visit and were a major Fluid Active CPU sink on Vercel.
export const revalidate = 3600;

async function loadHomeData() {
  if (!supabaseConfigured) {
    return {
      mostRegret: DEMO_PRODUCTS,
      mostLoved: DEMO_PRODUCTS,
      newest: DEMO_PRODUCTS,
      trending: DEMO_PRODUCTS,
      categoryHero: {} as Record<string, { image: string | null; count: number }>,
    };
  }
  const supabase = publicSupabase();
  const [regret, loved, latest, trending, all] = await Promise.all([
    supabase.from("products").select("*").order("regret_score", { ascending: false }).limit(8),
    supabase.from("products").select("*").order("would_buy_again_pct", { ascending: false }).limit(8),
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8),
    // Trending = most-reviewed on Amazon (proxy for real popularity). Not-null image + moderate regret to avoid junk-tier surfacing.
    supabase
      .from("products")
      .select("*")
      .not("image_url", "is", null)
      .gte("external_ids->>amazon_reviews", "5000")
      .order("external_ids->>amazon_reviews", { ascending: false })
      .limit(8),
    (async () => {
      type Row = Pick<Product, "category" | "image_url" | "regret_score" | "external_ids">;
      const rows: Row[] = [];
      for (let p = 0; p < 15; p++) {
        const { data } = await supabase
          .from("products")
          .select("category, image_url, regret_score, external_ids")
          .range(p * 1000, (p + 1) * 1000 - 1);
        if (!data || data.length === 0) break;
        rows.push(...(data as Row[]));
        if (data.length < 1000) break;
      }
      return { data: rows };
    })(),
  ]);

  // Pick a hero image per category — prefer an iconic, popular product (high Amazon review count)
  // with a moderate-to-high regret score (not extreme junk, not obscure). Falls back to any image.
  type Row = Pick<Product, "category" | "image_url" | "regret_score" | "external_ids">;
  const rows = (all.data as Row[]) ?? [];
  const byCat: Record<string, { image: string | null; count: number; bestScore: number }> = {};
  for (const r of rows) {
    if (!r.category) continue;
    const b = (byCat[r.category] ??= { image: null, count: 0, bestScore: -1 });
    b.count += 1;
    if (!r.image_url) continue;
    // Score = review count × relevance-window (regret 30-70 preferred). Junk (regret 90+) and boring (regret <20) rank low.
    // Curated products with no review data get a baseline of 500 so their image still gets picked when no Kaggle product exists in that category.
    const reviews = parseInt((r.external_ids as { amazon_reviews?: string } | null)?.amazon_reviews ?? "0", 10) || 500;
    const rs = r.regret_score;
    const relevance = rs >= 30 && rs <= 70 ? 1 : rs > 70 ? 0.4 : 0.7;
    const score = reviews * relevance;
    if (score > b.bestScore) {
      b.image = r.image_url;
      b.bestScore = score;
    }
  }

  return {
    mostRegret: (regret.data as Product[]) ?? [],
    mostLoved: (loved.data as Product[]) ?? [],
    newest: (latest.data as Product[]) ?? [],
    trending: (trending.data as Product[]) ?? [],
    categoryHero: byCat,
  };
}

export default async function Home() {
  const { mostRegret, mostLoved, newest, trending, categoryHero } = await loadHomeData();

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="rd-hero relative min-h-[92vh] bg-[var(--brand-navy)] text-white">
        <HeroMosaic />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-5xl flex-col justify-center px-5 pb-16 pt-20 sm:pt-28">
          <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-coral)]" />
            Owner-verified regret data
          </span>

          <h1 className="rd-hero__title font-display font-normal tracking-tight" style={{ fontSize: "clamp(3rem, 12vw, 108px)", lineHeight: 0.98 }}>
            <span className="rd-line"><span className="rd-line__in">The Regret Score</span></span>
            <span className="rd-line"><span className="rd-line__in delay-1">for anything <em className="text-[var(--brand-coral)]" style={{ fontStyle: "italic" }}>before</em></span></span>
            <span className="rd-line"><span className="rd-line__in delay-2">you buy it.</span></span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-white/85 sm:text-xl">
            Owner-verified satisfaction at day 30, 60, and 90 — not the honeymoon reviews from launch week.
            Search millions of consumer products across the US and Canada.
          </p>

          <div className="mt-8 max-w-2xl">
            <SmartSearch size="lg" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/70">
            <span className="uppercase tracking-wider">Try:</span>
            {["Dyson V15", "Peloton Bike+", "Instant Pot", "SNOO", "Vitamix"].map((q) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-white backdrop-blur transition hover:border-[var(--brand-coral)] hover:text-white"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SHOP BY CATEGORY ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex items-end justify-between" data-rr>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
              Browse
            </span>
            <h2 className="mt-2 font-display text-3xl font-normal leading-tight text-[var(--ink)] sm:text-4xl">
              Every category we track
            </h2>
          </div>
          <Link href="/categories" className="hidden text-sm font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-coral)] sm:inline">
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_ORDER.map((c, i) => {
            const bucket = categoryHero[c.label] ?? { image: null, count: 0 };
            return (
              <CategoryTile
                key={c.slug}
                categorySlug={c.slug}
                categoryLabel={c.label}
                heroImage={bucket.image}
                badge={i < 3 && bucket.count >= 15 ? "Popular" : undefined}
              />
            );
          })}
        </div>
      </section>

      {/* ---------- CAROUSEL: Trending ---------- */}
      <div id="trending">
        <ProductRail
          title="Trending now"
          subtitle="The most-reviewed products across the catalog — what everyone's buying."
          badge="🔥 Trending"
          products={trending}
          seeAllHref="/categories"
        />
      </div>

      {/* ---------- CAROUSEL: Most Regretted ---------- */}
      <ProductRail
        title="Most regretted right now"
        subtitle="High scores mean owners wish they hadn't bought it."
        badge="Watch out"
        products={mostRegret}
        seeAllHref="/categories"
      />

      {/* ---------- STATS ---------- */}
      <section className="border-y border-[var(--rule)] bg-[var(--brand-cream-2)] py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:grid-cols-3">
          {[
            { n: 74, s: "%", label: "of online shoppers report buyer's remorse" },
            { n: 743, s: "B", label: "returned in the US last year" },
            { n: 90, s: "d", label: "of real owner data behind every score" },
          ].map((s, i) => (
            <div key={i} className="text-center" data-rr>
              <div className="font-display text-6xl font-normal tracking-tight text-[var(--brand-navy)] sm:text-7xl">
                <span data-count={s.n} data-suffix={s.s}>0</span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-2)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CAROUSEL: Highest Satisfaction ---------- */}
      <ProductRail
        title="Highest satisfaction"
        subtitle="Still loved by owners at day 90. Sleep-easy buys."
        badge="Staff picks"
        products={mostLoved}
        seeAllHref="/categories"
      />

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-3xl border border-[var(--rule)] bg-white p-8 shadow-[0_1px_0_rgba(12,58,94,0.04),0_20px_50px_-30px_rgba(12,58,94,0.35)] sm:p-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div data-rr-l>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
                Why regret scores matter
              </div>
              <h2 className="mt-3 font-display text-3xl font-normal leading-tight text-[var(--ink)] sm:text-4xl">
                Reviews peak on <span className="rd-outline" data-outline>day one</span>. Regret arrives later.
              </h2>
              <ol className="mt-6 space-y-3 text-[var(--ink-2)]">
                {[
                  "Most product reviews are written in the first 48 hours — while owners still feel the honeymoon glow.",
                  "By day 30, buyer's remorse starts to surface. Batteries degrade, novelty wears off, subscriptions add up.",
                  "By day 90, the truth is out. That's the Regret Score you see here.",
                  "Owner-verified across the US and Canada — free to browse forever.",
                ].map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)] font-wordmark text-xs font-semibold text-white">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
              <Link
                href="/categories"
                data-magnetic
                className="mt-8 inline-block rounded-full bg-[var(--brand-coral)] px-6 py-3 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,107,87,0.6)] transition hover:bg-[var(--brand-coral-2)]"
              >
                Browse every category →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4" data-rr-r>
              <RegretPreview day="Day 30" score={22} />
              <RegretPreview day="Day 60" score={41} />
              <RegretPreview day="Day 90" score={68} />
              <div className="rounded-2xl border border-dashed border-[var(--brand-coral)] bg-[color-mix(in_srgb,var(--brand-coral)_10%,transparent)] p-4 text-center">
                <div className="font-display text-3xl italic text-[var(--brand-coral)]">↑</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand-coral)]">Regret climbs</div>
                <p className="mt-1 text-xs text-[var(--ink-2)]">The curve every review site hides.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CAROUSEL: Newest ---------- */}
      <ProductRail
        title="Newest additions"
        subtitle="Fresh additions. Scores start AI-estimated and firm up as owners chime in."
        badge="New"
        products={newest}
        seeAllHref="/categories"
      />

      {/* ---------- FINAL CTA ---------- */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="font-display text-4xl font-normal leading-tight text-[var(--ink)] sm:text-5xl">
          Search anything.<br />
          <em className="text-[var(--brand-coral)]" style={{ fontStyle: "italic" }}>Know before you spend.</em>
        </h2>
        <div className="mx-auto mt-8 max-w-xl">
          <SmartSearch size="lg" />
        </div>
      </section>
    </div>
  );
}

function RegretPreview({ day, score }: { day: string; score: number }) {
  const bg = score < 30 ? "var(--keep-green)" : score < 60 ? "var(--regret-amber)" : "var(--regret-red)";
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--rule)] bg-[var(--brand-cream)] p-4 text-center">
      <div className="font-wordmark text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{day}</div>
      <div className="mt-2 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ background: bg }}>
        {score}
      </div>
    </div>
  );
}
