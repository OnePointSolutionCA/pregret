import Link from "next/link";
import ProductCard from "./ProductCard";
import type { Product } from "@/lib/types";

export default function ProductRail({
  title,
  subtitle,
  products,
  seeAllHref,
  badge,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  seeAllHref?: string;
  badge?: string;
}) {
  if (!products.length) return null;
  return (
    <section className="py-10" data-rr>
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-5">
        <div>
          {badge && (
            <span className="mb-2 inline-block rounded-full bg-[var(--brand-coral)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              {badge}
            </span>
          )}
          <h2 className="font-display text-3xl font-normal leading-tight text-[var(--ink)] sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-[var(--ink-2)] sm:text-base">{subtitle}</p>
          )}
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="shrink-0 whitespace-nowrap text-sm font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-coral)]"
          >
            See all →
          </Link>
        )}
      </div>

      <div className="mx-auto max-w-6xl mt-6">
        <div className="rd-rail">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
