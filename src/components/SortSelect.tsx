"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export type SortKey = "most-regret" | "least-regret" | "most-loved" | "a-z";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "most-regret", label: "Most regretted" },
  { value: "least-regret", label: "Least regretted" },
  { value: "most-loved", label: "Highest satisfaction" },
  { value: "a-z", label: "Name: A → Z" },
];

export default function SortSelect({ current }: { current: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  function change(value: string) {
    const params = new URLSearchParams(search.toString());
    if (value === "most-regret") params.delete("sort");
    else params.set("sort", value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--ink-2)]">
      <span className="uppercase tracking-wider text-[var(--muted)]">Sort</span>
      <select
        value={current}
        onChange={(e) => change(e.target.value)}
        className="cursor-pointer rounded-full border border-[var(--rule)] bg-white px-4 py-2 pr-9 text-sm font-medium text-[var(--ink)] shadow-sm transition hover:border-[var(--brand-coral)] focus:border-[var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-navy)_25%,transparent)]"
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='none' stroke='%230C3A5E' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5L6 6.5L11 1.5'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
          backgroundSize: "10px 6px",
        }}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
