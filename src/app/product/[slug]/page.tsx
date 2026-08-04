import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RegretScore from "@/components/RegretScore";
import DecayCurve from "@/components/DecayCurve";
import AlternativeCard from "@/components/AlternativeCard";
import { serverSupabase, supabaseConfigured } from "@/lib/supabase";
import type { Product, RegretReason } from "@/lib/types";

export const revalidate = 3600;

async function loadProduct(slug: string): Promise<{ product: Product; alts: Product[] } | null> {
  if (!supabaseConfigured) return null;
  const supabase = await serverSupabase();
  const { data: product } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (!product) return null;
  const { data: altRows } = await supabase
    .from("product_alternatives")
    .select("alternative:alternative_product_id(*)")
    .eq("product_id", (product as Product).id)
    .order("switch_count", { ascending: false })
    .limit(3);
  const alts: Product[] = ((altRows as { alternative: Product }[] | null) ?? [])
    .map((r) => r.alternative)
    .filter(Boolean);
  return { product: product as Product, alts };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadProduct(slug);
  if (!loaded) return { title: "Product not found" };
  const { product } = loaded;
  return {
    title: `Should You Buy the ${product.name}? ${product.regret_score}% Regret It`,
    description: `${product.regret_score}% of owners regret buying the ${product.name}. See the long-term satisfaction data before you buy.`,
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadProduct(slug);
  if (!loaded) notFound();
  const { product, alts } = loaded;
  const reasons: RegretReason[] = product.top_regret_reasons ?? [];

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            brand: product.brand ?? undefined,
            aggregateRating: product.total_ratings
              ? {
                  "@type": "AggregateRating",
                  ratingValue: (5 - product.regret_score / 25).toFixed(1),
                  reviewCount: product.total_ratings,
                }
              : undefined,
          }),
        }}
      />

      <div className="grid gap-8 md:grid-cols-[auto,1fr] md:items-start">
        <div className="flex justify-center">
          <RegretScore score={product.regret_score} totalRatings={product.total_ratings} size="lg" showAdvice />
        </div>
        <div>
          <div className="text-sm uppercase tracking-wider text-slate-500">{product.brand ?? "Unbranded"}</div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {product.would_buy_again_pct}% would buy again
            </span>
            {product.category && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{product.category}</span>
            )}
            {product.is_ai_estimated && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">AI estimated — needs real ratings</span>
            )}
          </div>

          {reasons.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Top regret reasons</h2>
              <ul className="mt-2 space-y-2">
                {reasons.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-800">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <span>{r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Satisfaction over time</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <DecayCurve
            day30={product.avg_satisfaction_day30}
            day60={product.avg_satisfaction_day60}
            day90={product.avg_satisfaction_day90}
          />
        </div>
      </section>

      {alts.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold text-slate-900">People switched to</h2>
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
