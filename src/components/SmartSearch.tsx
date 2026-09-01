"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  image_url: string | null;
  regret_score: number;
};

const SCORE_BG = (s: number) =>
  s <= 30 ? "var(--keep-green)" : s <= 60 ? "var(--regret-amber)" : "var(--regret-red)";

/**
 * Nav-embedded server-backed typeahead.
 *
 * Hits /api/search?q= with a 200ms debounce so it works at 50k+ products
 * without shipping the full index to the browser. The Postgres query uses
 * the pg_trgm GIN index on products.name so it stays fast at scale.
 */
export default function SmartSearch({
  compact = false,
  size = "sm",
  onDark = false,
}: {
  compact?: boolean;
  size?: "sm" | "lg";
  onDark?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced fetch
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const id = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(term)}&limit=8`, { signal: ctrl.signal });
        const j = await r.json();
        setResults(j.items ?? []);
      } catch (e) {
        if ((e as { name?: string }).name !== "AbortError") setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) {
        router.push(`/product/${results[active].slug}`);
        setOpen(false);
        setQ("");
      } else if (q.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const width = compact ? "w-40 focus-within:w-56" : "w-full";
  const isLg = size === "lg";
  const iconSize = isLg ? "h-5 w-5 left-5" : "h-4 w-4 left-3";
  const inputCls = isLg
    ? "w-full rounded-full border border-[var(--rule)] bg-white py-4 pl-14 pr-4 text-base sm:text-lg text-[var(--ink)] placeholder:text-[var(--muted)] shadow-md transition focus:border-[var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-navy)_25%,transparent)]"
    : `w-full rounded-full border py-2 pl-9 pr-3 text-sm shadow-sm backdrop-blur transition focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-navy)_25%,transparent)] ${
        onDark
          ? "border-white/30 bg-white/15 text-white placeholder:text-white/70 focus:border-white focus:bg-white/25"
          : "border-[var(--rule)] bg-white/80 text-[var(--ink)] placeholder:text-[var(--muted)] focus:border-[var(--brand-navy)]"
      }`;
  const dropdownAlign = isLg ? "left-0 right-0 w-full" : "right-0 w-[min(96vw,26rem)]";

  return (
    <div ref={rootRef} className={`relative ${width} transition-[width] duration-200`}>
      <div className="relative">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${iconSize} ${onDark && !isLg ? "text-white/70" : "text-[var(--muted)]"}`}
        >
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={isLg ? "Check regret on any product…" : "Search products…"}
          aria-label="Search products"
          className={inputCls}
          role="combobox"
          aria-expanded={open}
          aria-controls="pregret-search-listbox"
          aria-autocomplete="list"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div
          id="pregret-search-listbox"
          role="listbox"
          className={`absolute top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[var(--rule)] bg-white shadow-2xl ${dropdownAlign}`}
        >
          {loading && results.length === 0 ? (
            <div className="p-4 text-sm text-[var(--muted)]">Searching…</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-[var(--muted)]">
              No matches. Press <kbd className="rounded border border-[var(--rule)] bg-[var(--brand-cream-2)] px-1.5 py-0.5 text-[10px] font-semibold">Enter</kbd>{" "}
              to search anyway.
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {results.map((p, i) => {
                const isActive = i === active;
                return (
                  <li key={p.slug} role="option" aria-selected={isActive}>
                    <a
                      href={`/product/${p.slug}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/product/${p.slug}`);
                        setOpen(false);
                        setQ("");
                      }}
                      className={`flex items-center gap-3 border-b border-[var(--rule)] px-4 py-3 last:border-b-0 ${
                        isActive ? "bg-[var(--brand-cream-2)]" : "bg-white"
                      }`}
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--brand-cream-2)]">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--brand-coral)]">
                          {p.brand ?? p.category}
                        </div>
                        <div className="truncate text-sm font-semibold text-[var(--ink)]">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {p.category}
                          {p.subcategory ? ` · ${p.subcategory}` : ""}
                        </div>
                      </div>
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ background: SCORE_BG(p.regret_score) }}
                        aria-label={`Regret ${p.regret_score}`}
                      >
                        {p.regret_score}
                      </div>
                    </a>
                  </li>
                );
              })}
              <li className="border-t border-[var(--rule)]">
                <a
                  href={`/search?q=${encodeURIComponent(q.trim())}`}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
                    setOpen(false);
                  }}
                  className="block px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-navy)] hover:bg-[var(--brand-cream-2)]"
                >
                  Show all results for &ldquo;{q.trim()}&rdquo; →
                </a>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
