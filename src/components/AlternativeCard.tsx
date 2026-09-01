import Link from "next/link";
import type { Product } from "@/lib/types";
import { tierCopy, tierFor } from "@/lib/regretScore";
import { retailerLabel } from "@/lib/affiliates";

export default function AlternativeCard({ product, sourceProductSlug }: { product: Product; sourceProductSlug?: string }) {
  const tier = tierFor(product.regret_score);
  const copy = tierCopy[tier];
  const ref = sourceProductSlug ? `alt-of-${sourceProductSlug}` : "alt";
  const cta = product.amazon_url ? retailerLabel(product.amazon_url) : "View product";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--rule)] bg-white shadow-sm transition hover:border-[var(--brand-coral)]">
      {/* Whole-card link — covers everything except the affiliate button (positioned above via z-index) */}
      <Link
        href={`/product/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="absolute inset-0 z-10"
      />
      <div className="relative aspect-[4/3] w-full bg-[var(--brand-cream-2)]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-6"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl italic text-[var(--brand-navy)] opacity-40">
            {(product.brand ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}
        {/* Score chip — inset so it doesn't crop, small text so nothing wraps */}
        <div
          className={`absolute right-2 top-2 flex h-10 w-10 flex-col items-center justify-center rounded-full ${copy.bg} text-white shadow-md`}
        >
          <div className="text-xs font-bold leading-none">{product.regret_score}</div>
          <div className="text-[7px] font-semibold uppercase tracking-wider opacity-90">Regret</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-coral)]">
          {product.brand ?? "Alternative"}
        </div>
        <div
          className="font-display text-base font-semibold text-[var(--ink)] group-hover:text-[var(--brand-navy)]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.4em",
          }}
        >
          {product.name}
        </div>
        <div className="text-xs text-[var(--muted)]">{product.would_buy_again_pct}% would buy again</div>
        {/* Amazon CTA is above the whole-card link (z-20) so clicking it doesn't trigger the product page nav */}
        <a
          href={`/go/${product.id}?ref=${encodeURIComponent(ref)}`}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="relative z-20 mt-auto rounded-full bg-[var(--brand-navy)] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[var(--brand-navy-2)]"
        >
          {cta} →
        </a>
      </div>
    </div>
  );
}
