import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import RegretScore from "@/components/RegretScore";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product } from "@/lib/types";

async function fetchFeatured(): Promise<Product[]> {
  if (!supabaseConfigured) return [];
  const supabase = await serverSupabase();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("regret_score", { ascending: false })
    .limit(6);
  return (data as Product[]) ?? [];
}

const DEMO: Product[] = [
  {
    id: "demo-1", slug: "peloton-bike-plus", name: "Peloton Bike+", brand: "Peloton",
    category: "Fitness", image_url: null, amazon_url: null, regret_score: 78,
    would_buy_again_pct: 24, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: null, avg_satisfaction_day60: null, avg_satisfaction_day90: null,
    top_regret_reasons: null, external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-2", slug: "instant-pot-duo", name: "Instant Pot Duo 7-in-1", brand: "Instant Pot",
    category: "Kitchen", image_url: null, amazon_url: null, regret_score: 14,
    would_buy_again_pct: 92, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: null, avg_satisfaction_day60: null, avg_satisfaction_day90: null,
    top_regret_reasons: null, external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-3", slug: "dyson-airwrap", name: "Dyson Airwrap Complete", brand: "Dyson",
    category: "Personal Care", image_url: null, amazon_url: null, regret_score: 52,
    would_buy_again_pct: 61, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: null, avg_satisfaction_day60: null, avg_satisfaction_day90: null,
    top_regret_reasons: null, external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-4", slug: "theragun-elite", name: "Theragun Elite", brand: "Therabody",
    category: "Fitness", image_url: null, amazon_url: null, regret_score: 63,
    would_buy_again_pct: 41, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: null, avg_satisfaction_day60: null, avg_satisfaction_day90: null,
    top_regret_reasons: null, external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-5", slug: "sodastream-art", name: "SodaStream Art", brand: "SodaStream",
    category: "Kitchen", image_url: null, amazon_url: null, regret_score: 44,
    would_buy_again_pct: 58, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: null, avg_satisfaction_day60: null, avg_satisfaction_day90: null,
    top_regret_reasons: null, external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-6", slug: "vitamix-a3500", name: "Vitamix A3500", brand: "Vitamix",
    category: "Kitchen", image_url: null, amazon_url: null, regret_score: 9,
    would_buy_again_pct: 96, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: null, avg_satisfaction_day60: null, avg_satisfaction_day90: null,
    top_regret_reasons: null, external_ids: null, created_at: "", updated_at: "",
  },
];

export default async function Home() {
  const products = await fetchFeatured();
  const featured = products.length ? products : DEMO;

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section className="rd-hero relative overflow-hidden">
        <div className="rd-aurora" aria-hidden>
          <span /><span /><span />
        </div>
        <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-16 sm:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-navy)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-coral)]" />
            Free — no account needed to browse
          </div>

          <h1 className="rd-hero__title font-display text-[13vw] font-semibold leading-[0.95] tracking-tight text-[var(--ink)] sm:text-[92px]">
            <span className="rd-line"><span className="rd-line__in">Know before</span></span>
            <span className="rd-line"><span className="rd-line__in delay-1">you <em className="not-italic text-[var(--brand-coral)]" style={{ fontStyle: "italic" }}>regret</em>.</span></span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-2)] sm:text-xl">
            Every product carries a <span className="font-semibold text-[var(--brand-navy)]">Regret Score</span>.
            Built from real owners at day 30, 60, and 90 — not the honeymoon reviews from launch week.
          </p>

          <div className="mt-8 max-w-2xl">
            <SearchBar size="lg" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="uppercase tracking-wider">Try:</span>
            {["Dyson V15", "Peloton Bike+", "Instant Pot", "Vitamix"].map((q) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="rounded-full border border-[var(--rule)] bg-white/70 px-3 py-1 text-[var(--ink-2)] backdrop-blur transition hover:border-[var(--brand-coral)] hover:text-[var(--brand-navy)]"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- THREE TIERS ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 max-w-2xl" data-rr>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">Three scores, one truth</div>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
            Green means <em style={{ fontStyle: "italic" }}>go</em>. Red means <em style={{ fontStyle: "italic" }}>think</em>.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { score: 12, title: "Low regret", text: "Owners are still happy three months in. Safe buy — sleep easy." },
            { score: 47, title: "Some regret", text: "Mixed long-term reviews. Read what buyers actually said before you commit." },
            { score: 82, title: "High regret", text: "Most owners regret it within 90 days. We'll show you what to buy instead." },
          ].map((c, i) => (
            <div
              key={c.title}
              data-rr={i === 1 ? undefined : undefined}
              data-rr-l={i === 0 ? "" : undefined}
              data-rr-r={i === 2 ? "" : undefined}
              className="flex flex-col items-center rounded-3xl border border-[var(--rule)] bg-white p-8 text-center shadow-[0_1px_0_rgba(12,58,94,0.04),0_20px_50px_-30px_rgba(12,58,94,0.35)]"
            >
              <RegretScore score={c.score} size="md" />
              <div className="mt-5 font-display text-2xl font-semibold text-[var(--ink)]">{c.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="border-y border-[var(--rule)] bg-[var(--brand-cream-2)] py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 sm:grid-cols-3">
          {[
            { n: 74, s: "%", label: "of online shoppers report buyer's remorse" },
            { n: 743, s: "B", label: "returned in the US last year" },
            { n: 90, s: "d", label: "of real owner data behind every score" },
          ].map((s, i) => (
            <div key={i} className="text-center" data-rr>
              <div className="font-display text-6xl font-semibold tracking-tight text-[var(--brand-navy)] sm:text-7xl">
                <span data-count={s.n} data-suffix={s.s}>0</span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink-2)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FEATURED PRODUCTS ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-8 flex items-baseline justify-between" data-rr>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">Trending</div>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
              Most regretted right now
            </h2>
          </div>
          <Link href="/category/electronics" className="hidden text-sm font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-navy-2)] sm:inline">
            Browse categories →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <div key={p.id} data-rr={i % 3 === 1 ? "" : undefined} data-rr-l={i % 3 === 0 ? "" : undefined} data-rr-r={i % 3 === 2 ? "" : undefined}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        {!supabaseConfigured && (
          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            Demo data. Fill <code className="rounded bg-white px-1.5 py-0.5 text-[var(--ink-2)]">.env.local</code> to load real products.
          </p>
        )}
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl border border-[var(--rule)] bg-white p-10 shadow-[0_1px_0_rgba(12,58,94,0.04),0_20px_50px_-30px_rgba(12,58,94,0.35)] sm:p-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div data-rr-l>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">How it works</div>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--ink)]">
                One tap. <span className="rd-outline" data-outline>Three</span> months. Real data.
              </h2>
              <ol className="mt-6 space-y-4 text-[var(--ink-2)]">
                {[
                  "Add a product you own from your dashboard.",
                  "We ping you once at day 30, 60, and 90.",
                  "You tap 😍 / 😐 / 😞. That's it.",
                  "Your answer folds into the public Regret Score.",
                ].map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy)] font-wordmark text-xs font-semibold text-white">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
              <Link
                href="/login"
                data-magnetic
                className="mt-8 inline-block rounded-full bg-[var(--brand-coral)] px-6 py-3 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,107,87,0.6)] transition hover:bg-[var(--brand-coral-2)]"
              >
                Start tracking your purchases →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4" data-rr-r>
              <RegretPreview day="Day 30" score={22} />
              <RegretPreview day="Day 60" score={41} />
              <RegretPreview day="Day 90" score={68} />
              <div className="rounded-2xl border border-dashed border-[var(--brand-coral)] bg-[color-mix(in_srgb,var(--brand-coral)_10%,transparent)] p-4 text-center">
                <div className="font-display text-3xl font-semibold text-[var(--brand-coral)]">↑</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand-coral)]">Regret climbs</div>
                <p className="mt-1 text-xs text-[var(--ink-2)]">That&apos;s the curve every review site hides.</p>
              </div>
            </div>
          </div>
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
