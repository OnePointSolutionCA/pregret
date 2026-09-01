export const dynamic = "force-static";

import type { Metadata } from "next";
import Link from "next/link";
import RegretScore from "@/components/RegretScore";

export const metadata: Metadata = {
  title: "How Pregret Works — The Regret Score Explained",
  description:
    "How Pregret's Regret Score is calculated, why day-90 satisfaction matters more than launch-week reviews, and how our formula works — for shoppers across the US and Canada.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <article className="mx-auto max-w-4xl px-5 py-12">
      <div className="mb-10 max-w-2xl" data-rr>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
          How it works
        </div>
        <h1 className="mt-3 font-display text-4xl font-normal leading-tight text-[var(--ink)] sm:text-6xl">
          The Regret Score, <em style={{ fontStyle: "italic" }} className="text-[var(--brand-coral)]">explained</em>.
        </h1>
        <p className="mt-4 text-lg text-[var(--ink-2)]">
          A single number, 0–100, that tells you how many owners regret their purchase.
          It's calibrated on day-30, day-60, and day-90 satisfaction — long after the honeymoon.
        </p>
      </div>

      {/* ---------- Score tiers ---------- */}
      <section className="mb-14 grid gap-6 sm:grid-cols-3">
        {[
          { score: 12, label: "Low regret", copy: "Owners are still happy three months in. Safe buy — sleep easy." },
          { score: 47, label: "Some regret", copy: "Mixed long-term reviews. Read the specific complaints before you commit." },
          { score: 82, label: "High regret", copy: "Most owners wish they hadn't bought it. We'll show you what to buy instead." },
        ].map((t) => (
          <div key={t.label} className="flex flex-col items-center rounded-3xl border border-[var(--rule)] bg-white p-6 text-center">
            <RegretScore score={t.score} size="md" />
            <div className="mt-4 font-display text-xl text-[var(--ink)]">{t.label}</div>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{t.copy}</p>
          </div>
        ))}
      </section>

      {/* ---------- Sections ---------- */}
      <section className="prose prose-slate mx-auto max-w-none space-y-8 text-[var(--ink-2)]">
        <div>
          <h2 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">Why day 90 matters most</h2>
          <p className="mt-3 leading-relaxed">
            Most product reviews on Amazon.com, Amazon.ca, Best Buy, and Walmart are written in the first
            48 hours — when owners are still riding the dopamine hit of unboxing. That's not the moment
            you want to hear from them. The truth about a product surfaces later: after the return
            window closes, after the subscription cost stacks up, after the battery starts to degrade.
            Pregret's Regret Score weights <strong className="text-[var(--ink)]">day-90 satisfaction three
            times as heavily</strong> as day-30 because that's where reality lives.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">The formula (no black boxes)</h2>
          <p className="mt-3 leading-relaxed">
            For every product, we take verified owner check-ins at day 30, 60, and 90 and compute:
          </p>
          <div className="my-4 overflow-x-auto rounded-xl border border-[var(--rule)] bg-white p-5 font-mono text-sm text-[var(--ink)]">
            regret_score = (weighted_low_ratings ÷ weighted_total_ratings) × 100<br />
            <span className="text-[var(--muted)]">where day-30 weight = 1×, day-60 = 2×, day-90 = 3×</span>
          </div>
          <p className="leading-relaxed">
            A "low rating" is 1 or 2 out of 5. A product with mostly 5-star day-30 ratings but mostly
            1-star day-90 ratings will score high on regret. A product that stays 4+ across all three
            checkpoints will score low. The math is public and reproducible.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">Our methodology</h2>
          <p className="mt-3 leading-relaxed">
            Every Regret Score is calculated from publicly available review data: Amazon star ratings,
            review volume, and complaint themes across the review corpus. We weight recent long-form
            reviews more heavily than short "just got it" posts because those better predict day-90
            satisfaction. The formula is deterministic — the same inputs always produce the same score —
            and we recalculate weekly as new reviews come in.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">Why some products recommend alternatives</h2>
          <p className="mt-3 leading-relaxed">
            When a product has a high Regret Score, we surface 2–3 lower-regret alternatives in the same
            category. These are curated based on owner data — the products people who returned the
            regretted item actually switched to.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--brand-coral)] bg-[color-mix(in_srgb,var(--brand-coral)_8%,transparent)] p-6">
          <h2 className="font-display text-xl text-[var(--ink)]">A word on affiliate links</h2>
          <p className="mt-2 leading-relaxed">
            When you click through to an alternative and buy it on Amazon, we may earn a small
            commission at no cost to you. That's how Pregret stays free. Commissions{" "}
            <strong className="text-[var(--ink)]">never</strong> influence Regret Scores — we don't
            get paid more for surfacing higher-priced products, and there's no path to bump a
            product's ranking through payment.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-[var(--ink)] sm:text-3xl">Serving US and Canadian shoppers</h2>
          <p className="mt-3 leading-relaxed">
            Regret data is aggregated across shoppers in both the United States and Canada. Amazon.com
            and Amazon.ca often ship the same product with slightly different pricing, warranty, and
            return terms — Regret Scores are consistent because owner satisfaction is what changes
            slowly, not the retailer.
          </p>
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/categories"
            data-magnetic
            className="inline-block rounded-full bg-[var(--brand-navy)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--brand-navy-2)]"
          >
            Start browsing categories →
          </Link>
        </div>
      </section>
    </article>
  );
}
