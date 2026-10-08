import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CARD_COLUMNS, unwrap } from "@/lib/db";
import RegretScore from "@/components/RegretScore";
import DecayCurve from "@/components/DecayCurve";
import AlternativeCard from "@/components/AlternativeCard";
import CompareButton from "@/components/CompareButton";
import AmazonCountryCTA from "@/components/AmazonCountryCTA";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { demoBySlug, DEMO_ALTS, DEMO_PRODUCTS } from "@/lib/demo";
import { retailerLabel } from "@/lib/affiliates";
import { retailersForCategory } from "@/lib/retailer-searches";
import type { Product, RegretReason } from "@/lib/types";

// Weekly: scores barely move, and every refresh of 283k crawlable pages costs DB egress.
export const revalidate = 604800;

// JSON.stringify does not escape "<", so a product name containing "</script>" could end the tag.
// "\u003c" parses back to "<", so search engines read exactly the same data.
const jsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

// Distinctive product-type words used to rank alternatives by "vibe".
// A padel racket suggesting a padel ball is technically same-subcategory but
// wrong-vibe — matching on these type words filters that out.
const TYPE_WORDS = [
  // sports gear
  "racket", "racquet", "paddle", "ball", "bag", "backpack", "shoes", "sneakers",
  "glove", "helmet", "goggles", "bat", "club", "putter", "driver", "iron",
  "board", "skateboard", "longboard", "bike", "bicycle", "kayak",
  // fitness
  "dumbbell", "kettlebell", "barbell", "mat", "roller", "band", "rope",
  "treadmill", "elliptical", "bench", "rack",
  // kitchen / small appliances
  "blender", "mixer", "processor", "grinder", "toaster", "kettle", "cooker",
  "fryer", "oven", "microwave", "coffee", "espresso", "kettle",
  "knife", "pan", "pot", "skillet", "board", "bowl", "mug", "tumbler", "bottle",
  // electronics
  "headphone", "headphones", "earbud", "earbuds", "speaker", "soundbar", "tv",
  "monitor", "camera", "drone", "laptop", "tablet", "phone", "watch", "ring",
  "console", "controller", "keyboard", "mouse", "charger", "cable", "adapter",
  "vacuum", "roomba",
  // home
  "bulb", "lamp", "light", "fan", "thermostat", "purifier", "humidifier",
  "mop", "mattress", "pillow", "sheet", "curtain", "rug", "mirror", "frame",
  // baby
  "stroller", "seat", "monitor", "crib", "bassinet", "carrier", "bottle", "pump",
  // beauty / personal care
  "brush", "dryer", "iron", "trimmer", "razor", "shaver", "toothbrush",
  "cream", "serum", "cleanser", "lipstick", "mascara", "foundation", "palette",
  // school
  "notebook", "pen", "pencil", "marker", "calculator", "planner", "binder",
];

function productTypeWords(name: string): Set<string> {
  const words = name.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (const w of words) if (TYPE_WORDS.includes(w)) out.add(w);
  return out;
}

// cache(): generateMetadata and the page share one fetch per render.
const loadProduct = cache(async (slug: string): Promise<{ product: Product; alts: Product[]; altsSource: "curated" | "dynamic" } | null> => {
  if (supabaseConfigured) {
    const supabase = publicSupabase();
    const product = unwrap(
      await supabase.from("products").select("*").eq("slug", slug).maybeSingle(),
      "product",
    );
    if (product) {
      const p = product as Product;
      // 1. Curated alternatives from product_alternatives table
      const altRows = unwrap(
        await supabase
          .from("product_alternatives")
          .select(`alternative:alternative_product_id(${CARD_COLUMNS})`)
          .eq("product_id", p.id)
          .order("switch_count", { ascending: false })
          .limit(3),
        "curated alternatives",
      );
      const curated = ((altRows as unknown as { alternative: Product }[] | null) ?? [])
        .map((r) => r.alternative)
        .filter(Boolean);
      if (curated.length > 0) return { product: p, alts: curated, altsSource: "curated" };

      // 2. Dynamic fallback — same subcategory + product-type keyword match.
      //    Same-sub alone isn't enough: a padel racket and padel ball both
      //    live in Fitness/padel but aren't real alternatives to each other.
      //    We extract distinctive product-type words from the source name
      //    ("racket", "ball", "bag", "shoes", "blender", "mixer" etc.) and
      //    require the alternative to share at least one — same "vibe".
      const sub = (p.external_ids as { sub?: string } | null)?.sub ?? null;
      const sourceType = productTypeWords(p.name);

      const fetchPeers = async (useSub: boolean) => {
        let q = supabase.from("products").select(CARD_COLUMNS).eq("category", p.category).neq("id", p.id);
        if (useSub && sub) q = q.eq("external_ids->>sub", sub);
        q = q.not("image_url", "is", null).not("amazon_url", "is", null);
        const data = unwrap(await q.order("regret_score", { ascending: true }).limit(24), "peer products");
        return ((data as unknown as Product[]) ?? []).filter((x) => x.slug !== p.slug);
      };

      // Score each peer by how many product-type words it shares with the source
      const rankByVibe = (peers: Product[]) => {
        if (sourceType.size === 0) return peers;
        const scored = peers.map((peer) => {
          const peerType = productTypeWords(peer.name);
          let shared = 0;
          for (const w of peerType) if (sourceType.has(w)) shared++;
          return { peer, shared };
        });
        // Keep peers with at least 1 shared type word if any exist
        const withMatch = scored.filter((s) => s.shared > 0);
        const pool = withMatch.length > 0 ? withMatch : scored;
        pool.sort((a, b) => b.shared - a.shared || a.peer.regret_score - b.peer.regret_score);
        return pool.map((s) => s.peer);
      };

      let pool = sub ? rankByVibe(await fetchPeers(true)) : [];
      if (pool.length === 0) pool = rankByVibe(await fetchPeers(false));

      const better = pool.filter((x) => x.regret_score < p.regret_score - 5).slice(0, 3);
      const chosen = better.length >= 3 ? better : [...better, ...pool.filter((x) => !better.includes(x))].slice(0, 3);
      return { product: p, alts: chosen, altsSource: "dynamic" };
    }
  }

  // Fallback to demo catalog (also used in prod for any known demo slug)
  const demo = demoBySlug(slug);
  if (!demo) return null;
  const altSlugs = DEMO_ALTS[slug] ?? [];
  const alts = altSlugs.map(demoBySlug).filter((p): p is Product => Boolean(p));
  return { product: demo, alts, altsSource: "curated" };
});

export async function generateStaticParams() {
  return DEMO_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadProduct(slug);
  if (!loaded) return { title: "Product not found" };
  const { product } = loaded;
  return {
    title: `Should You Buy the ${product.name}? ${product.regret_score}% Regret It`,
    description: `${product.regret_score}% of owners regret buying the ${product.name}. See the day 30, 60, and 90 satisfaction data before you buy.`,
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadProduct(slug);
  if (!loaded) notFound();
  const { product, alts, altsSource } = loaded;
  const altsHeading =
    altsSource === "curated" && product.regret_score >= 40
      ? "People switched to"
      : product.regret_score >= 40
        ? "Consider these instead"
        : "You might also like";
  const reasons: RegretReason[] = product.top_regret_reasons ?? [];

  // Structured data — Product schema with Amazon rating aggregate + FAQPage from owner_voice.
  // Both help Google surface rich snippets, which is legitimate SEO (no cloaking, no keyword stuffing).
  const ext = product.external_ids as {
    amazon_stars?: string;
    amazon_reviews?: string;
    owner_voice?: { loves?: string[]; regrets?: string[] };
    description?: string;
  } | null;
  const amazonStars = parseFloat(ext?.amazon_stars ?? "0") || 0;
  const amazonReviews = parseInt(ext?.amazon_reviews ?? "0", 10) || 0;
  const voice = ext?.owner_voice;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.image_url ? { image: product.image_url } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(ext?.description ? { description: ext.description } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(amazonStars > 0 && amazonReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: amazonStars.toFixed(1),
            reviewCount: amazonReviews,
            bestRating: "5",
          },
        }
      : {}),
  };

  const faqSchema = voice && ((voice.loves?.length ?? 0) > 0 || (voice.regrets?.length ?? 0) > 0)
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          ...(voice.loves && voice.loves.length > 0
            ? [{
                "@type": "Question",
                name: `What do owners love about the ${product.name}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: voice.loves.join(". ") + ".",
                },
              }]
            : []),
          ...(voice.regrets && voice.regrets.length > 0
            ? [{
                "@type": "Question",
                name: `What do owners regret about the ${product.name}?`,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: voice.regrets.join(". ") + ".",
                },
              }]
            : []),
          {
            "@type": "Question",
            name: `Is the ${product.name} worth buying?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Pregret's Regret Score for the ${product.name} is ${product.regret_score}/100 with ${product.would_buy_again_pct}% of owners saying they'd buy again. ${product.regret_score >= 60 ? "Most owners regret this purchase — read the full breakdown below." : product.regret_score <= 30 ? "Most owners stay happy at day 90 — a solid buy." : "Mixed reviews — depends on your use case."}`,
            },
          },
        ],
      }
    : null;

  return (
    <article className="mx-auto max-w-5xl px-5 py-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
        />
      )}

      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="overflow-hidden rounded-3xl border border-[var(--rule)] bg-[var(--brand-cream-2)]">
          <div className="relative aspect-square w-full">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain p-8 mix-blend-multiply sm:p-12"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-8xl italic text-[var(--brand-navy)] opacity-40">
                {(product.brand ?? "?").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute right-4 top-4">
              <RegretScore score={product.regret_score} totalRatings={product.total_ratings} size="sm" />
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
            {product.brand ?? "Unbranded"}
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--ink)] sm:text-5xl">
            {product.name}
          </h1>
          {product.external_ids?.description && (
            <p className="mt-4 text-lg leading-relaxed text-[var(--ink-2)]">
              {product.external_ids.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-white px-3 py-1 text-[var(--ink-2)] shadow-sm">
              {product.would_buy_again_pct}% would buy again
            </span>
            {product.category && (
              <span className="rounded-full bg-white px-3 py-1 text-[var(--ink-2)] shadow-sm">{product.category}</span>
            )}
          </div>

          {product.amazon_url && (
            <div className="mt-6">
              <div className="flex flex-wrap items-start gap-3">
                <AmazonCountryCTA productId={product.id} />
                <CompareButton slug={product.slug} name={product.name} image={product.image_url} variant="full" />
              </div>

              {/* Secondary retailers — Impact.com + Skimlinks transform these outbound links into affiliate links client-side */}
              <div className="mt-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Also compare at
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {retailersForCategory(product.category, product.brand, product.name).map((r) => (
                    <a
                      key={r.key}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--rule)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-2)] transition hover:border-[var(--brand-coral)] hover:text-[var(--brand-navy)]"
                    >
                      {r.label} →
                    </a>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-xs text-[var(--muted)]">
                Affiliate links — commissions never influence scores. We auto-detect your country on Amazon; other retailers use Impact.com and Skimlinks.
              </p>
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Top regret reasons
              </h2>
              <ul className="mt-3 space-y-2">
                {reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[var(--ink)]">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-coral)]" />
                    <span>{r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Owner voice — AI-inferred pros/cons from review patterns */}
      {(() => {
        const voice = (product.external_ids as { owner_voice?: { loves?: string[]; regrets?: string[] } } | null)?.owner_voice;
        if (!voice || (!voice.loves?.length && !voice.regrets?.length)) return null;
        return (
          <section className="mt-14 grid gap-6 md:grid-cols-2">
            {voice.loves && voice.loves.length > 0 && (
              <div className="rounded-3xl border border-[color-mix(in_srgb,var(--keep-green)_30%,var(--rule))] bg-[color-mix(in_srgb,var(--keep-green)_5%,white)] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--keep-green)]">
                  What owners love
                </div>
                <ul className="mt-3 space-y-2">
                  {voice.loves.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-[var(--ink)]">
                      <span className="mt-1.5 shrink-0 text-[var(--keep-green)]">✓</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {voice.regrets && voice.regrets.length > 0 && (
              <div className="rounded-3xl border border-[color-mix(in_srgb,var(--regret-red)_30%,var(--rule))] bg-[color-mix(in_srgb,var(--regret-red)_5%,white)] p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--regret-red)]">
                  What owners regret
                </div>
                <ul className="mt-3 space-y-2">
                  {voice.regrets.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-[var(--ink)]">
                      <span className="mt-1.5 shrink-0 text-[var(--regret-red)]">✕</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })()}

      <section className="mt-14">
        <h2 className="mb-4 font-display text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
          Satisfaction over time
        </h2>
        <div className="rounded-3xl border border-[var(--rule)] bg-white p-6">
          <DecayCurve
            day30={product.avg_satisfaction_day30}
            day60={product.avg_satisfaction_day60}
            day90={product.avg_satisfaction_day90}
          />
        </div>
      </section>

      {alts.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-display text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
            {altsHeading}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {alts.map((a) => (
              <AlternativeCard key={a.id} product={a} sourceProductSlug={product.slug} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
