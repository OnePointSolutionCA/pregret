"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type CompareItem = { slug: string; name: string; image: string | null };

const KEY = "pregret_compare";
const MAX = 3;

// Public helper other components use to toggle/read compare state
export function toggleCompare(item: CompareItem): { added: boolean; count: number; full: boolean } {
  if (typeof window === "undefined") return { added: false, count: 0, full: false };
  const list = readList();
  const idx = list.findIndex((x) => x.slug === item.slug);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(list);
    return { added: false, count: list.length, full: false };
  }
  if (list.length >= MAX) return { added: false, count: list.length, full: true };
  list.push(item);
  write(list);
  return { added: true, count: list.length, full: false };
}
export function isInCompare(slug: string): boolean {
  if (typeof window === "undefined") return false;
  return readList().some((x) => x.slug === slug);
}
function readList(): CompareItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function write(list: CompareItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("pregret:compare-changed"));
}

/**
 * Sticky bottom bar that lists items currently in the compare list. Renders
 * nothing when empty or when the user is already on /compare. Uses the
 * "pregret:compare-changed" custom event so button clicks in ProductCard /
 * product page refresh the bar without a re-render round-trip.
 */
export default function CompareBar() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setItems(readList());
    sync();
    window.addEventListener("pregret:compare-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pregret:compare-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (items.length === 0 || pathname === "/compare") return null;
  const href = `/compare?ids=${items.map((i) => encodeURIComponent(i.slug)).join(",")}`;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border border-[var(--rule)] bg-white/95 p-3 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)] sm:block">
          Compare
        </div>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((it) => (
            <div key={it.slug} className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--brand-cream)] py-1 pl-1 pr-3">
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt="" className="h-full w-full object-contain" />
                ) : null}
              </div>
              <span className="max-w-[110px] truncate text-xs font-medium text-[var(--ink)]">{it.name}</span>
              <button
                type="button"
                onClick={() => toggleCompare(it)}
                aria-label={`Remove ${it.name}`}
                className="text-[var(--muted)] hover:text-[var(--brand-coral)]"
              >
                ×
              </button>
            </div>
          ))}
          {items.length < MAX && (
            <span className="shrink-0 text-xs text-[var(--muted)]">
              Add {MAX - items.length} more to compare
            </span>
          )}
        </div>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-navy-2)]"
        >
          Compare {items.length}
        </Link>
      </div>
    </div>
  );
}
