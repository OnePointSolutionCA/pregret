"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ initial = "", size = "md" }: { initial?: string; size?: "md" | "lg" }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const big = size === "lg";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full items-stretch gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search any product…"
        aria-label="Search products"
        className={`min-w-0 flex-1 rounded-full border border-slate-300 bg-white ${
          big ? "px-5 py-4 text-base sm:text-lg" : "px-4 py-2 text-sm"
        } shadow-sm placeholder:text-slate-400 focus:border-[var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-navy)_25%,transparent)]`}
      />
      <button
        type="submit"
        className={`shrink-0 whitespace-nowrap rounded-full bg-[var(--brand-navy)] text-white font-semibold transition hover:bg-[var(--brand-navy-2)] ${
          big ? "px-5 py-4 text-sm sm:px-8 sm:text-lg" : "px-4 py-2 text-sm"
        }`}
      >
        <span className="sm:hidden" aria-hidden>Check →</span>
        <span className="hidden sm:inline">Check regret →</span>
      </button>
    </form>
  );
}
