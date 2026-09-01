"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CATEGORY_ORDER, SUBCATEGORIES } from "@/lib/subcategories";

/**
 * Nav "Products" trigger + mega menu.
 *
 * Click to open (touch-friendly), Escape or outside click to close.
 * Auto-closes on any route change so the menu doesn't linger after nav.
 */
export default function ProductsMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  // Hover to open (with a small delay on close so cursor can move to the panel)
  const handleEnter = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setOpen(true);
  };
  const handleLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  return (
    <div ref={rootRef} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Browse products"
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-medium transition sm:px-3 ${
          open
            ? "bg-[var(--brand-navy)] text-white"
            : "text-[var(--ink-2)] hover:text-[var(--brand-navy)]"
        }`}
      >
        <span className="hidden sm:inline">Products</span>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="sm:hidden">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
        <svg width="10" height="6" viewBox="0 0 12 8" aria-hidden className={`hidden transition sm:inline ${open ? "rotate-180" : ""}`}>
          <path d="M1 1.5L6 6.5L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop on mobile */}
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden" aria-hidden onClick={() => setOpen(false)} />
          <div
            className="fixed inset-x-3 top-[64px] z-50 max-h-[calc(100vh-88px)] overflow-y-auto rounded-3xl border border-[var(--rule)] bg-white p-6 shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[min(92vw,720px)] sm:p-6"
            role="dialog"
            aria-label="Browse products by category"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
                Browse the catalog
              </div>
              <Link
                href="/categories"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-navy-2)]"
              >
                See all →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORY_ORDER.map((cat) => {
                const subs = SUBCATEGORIES[cat.label] ?? [];
                return (
                  <div key={cat.slug}>
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="block font-display text-base font-semibold text-[var(--ink)] hover:text-[var(--brand-navy)]"
                    >
                      {cat.label}
                    </Link>
                    <ul className="mt-1.5 space-y-1">
                      {subs.slice(0, 6).map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/category/${cat.slug}?sub=${s.slug}`}
                            onClick={() => setOpen(false)}
                            className="block truncate text-sm text-[var(--ink-2)] hover:text-[var(--brand-coral)]"
                          >
                            {s.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
