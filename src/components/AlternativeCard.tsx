import type { Product } from "@/lib/types";
import { tierCopy, tierFor } from "@/lib/regretScore";

export default function AlternativeCard({ product, sourceProductSlug }: { product: Product; sourceProductSlug?: string }) {
  const tier = tierFor(product.regret_score);
  const copy = tierCopy[tier];
  const ref = sourceProductSlug ? `alt-of-${sourceProductSlug}` : "alt";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-14 w-14 flex-col items-center justify-center rounded-full ${copy.bg} text-white`}>
          <div className="text-lg font-bold leading-none">{product.regret_score}</div>
          <div className="text-[8px] uppercase tracking-wider opacity-90">Regret</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-slate-500">{product.brand ?? "Alternative"}</div>
          <div className="truncate font-semibold text-slate-900">{product.name}</div>
          <div className="text-xs text-slate-500">{product.would_buy_again_pct}% would buy again</div>
        </div>
      </div>
      <a
        href={`/go/${product.id}?ref=${encodeURIComponent(ref)}`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="rounded-lg bg-[var(--brand-navy)] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[var(--brand-navy-2)]"
      >
        See on Amazon →
      </a>
    </div>
  );
}
