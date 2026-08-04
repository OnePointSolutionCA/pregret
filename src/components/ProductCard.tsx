import Link from "next/link";
import type { Product } from "@/lib/types";
import { tierCopy, tierFor } from "@/lib/regretScore";

export default function ProductCard({ product }: { product: Product }) {
  const tier = tierFor(product.regret_score);
  const copy = tierCopy[tier];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[var(--brand-coral)] hover:shadow-md"
    >
      <div
        className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full ${copy.bg} text-white`}
        aria-hidden
      >
        <div className="text-xl font-bold leading-none">{product.regret_score}</div>
        <div className="text-[9px] uppercase tracking-wider opacity-90">Regret</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs uppercase tracking-wider text-slate-500">{product.brand ?? "Unbranded"}</div>
        <div className="truncate font-semibold text-slate-900 group-hover:text-[var(--brand-navy)]">{product.name}</div>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>{product.would_buy_again_pct}% would buy again</span>
          {product.is_ai_estimated && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">AI estimated</span>
          )}
        </div>
      </div>
    </Link>
  );
}
