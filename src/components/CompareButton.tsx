"use client";

import { useEffect, useState } from "react";
import { toggleCompare, isInCompare } from "./CompareBar";

/**
 * "Add to compare" toggle button. Uses localStorage via CompareBar's
 * helpers so the sticky bottom bar updates instantly on click. Two variants:
 *   - `chip` (default) — small pill for product cards
 *   - `full` — larger button for the product detail page
 */
export default function CompareButton({
  slug,
  name,
  image,
  variant = "chip",
}: {
  slug: string;
  name: string;
  image: string | null;
  variant?: "chip" | "full";
}) {
  const [inList, setInList] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setInList(isInCompare(slug));
    sync();
    window.addEventListener("pregret:compare-changed", sync);
    return () => window.removeEventListener("pregret:compare-changed", sync);
  }, [slug]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare({ slug, name, image });
    if (result.full) {
      setMsg("Compare full (3 max)");
      setTimeout(() => setMsg(null), 1600);
    }
  };

  const label = inList ? "Added ✓" : "Compare";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={inList}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          inList
            ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white"
            : "border-[var(--rule)] bg-white text-[var(--ink-2)] hover:border-[var(--brand-navy)]"
        }`}
      >
        {msg ?? label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={inList}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
        inList
          ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white"
          : "border-[var(--rule)] bg-white/90 text-[var(--ink-2)] hover:border-[var(--brand-navy)]"
      }`}
    >
      {msg ?? label}
    </button>
  );
}
