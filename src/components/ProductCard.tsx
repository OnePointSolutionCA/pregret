import Link from "next/link";
import type { Product } from "@/lib/types";
import { tierCopy, tierFor } from "@/lib/regretScore";
import CompareButton from "./CompareButton";

export default function ProductCard({ product }: { product: Product }) {
  const tier = tierFor(product.regret_score);
  const copy = tierCopy[tier];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--rule)] bg-white shadow-[0_1px_0_rgba(12,58,94,0.03),0_10px_30px_-20px_rgba(12,58,94,0.2)] transition hover:border-[var(--brand-coral)] hover:shadow-[0_1px_0_rgba(12,58,94,0.03),0_20px_50px_-20px_rgba(12,58,94,0.25)]"
    >
      <div className="relative aspect-[4/3] w-full bg-[var(--brand-cream-2)]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-6 mix-blend-multiply"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center font-display text-4xl italic text-[var(--brand-navy)] opacity-40">
            {(product.brand ?? "?").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div
          className={`absolute right-2 top-2 flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full ${copy.bg} text-white shadow-md`}
          aria-hidden
        >
          <div className="text-sm font-bold leading-none">{product.regret_score}</div>
          <div className="text-[7px] font-semibold uppercase tracking-wider opacity-90">
            Regret
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-coral)]">
          {product.brand ?? "Unbranded"}
        </div>
        <div
          className="font-display text-lg leading-tight text-[var(--ink)] group-hover:text-[var(--brand-navy)]"
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
        {product.external_ids?.description && (
          <p
            className="mt-1 text-xs leading-snug text-[var(--ink-2)]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.4em",
            }}
          >
            {product.external_ids.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-[var(--muted)]">
          <span className="truncate">{product.would_buy_again_pct}% would buy again</span>
          <CompareButton slug={product.slug} name={product.name} image={product.image_url} />
        </div>
      </div>
    </Link>
  );
}
