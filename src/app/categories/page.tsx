import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORY_ORDER, SUBCATEGORIES } from "@/lib/subcategories";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse all categories",
  description:
    "Every product Pregret tracks — Electronics, Kitchen, Fitness, Personal Care, Home & Garden, Baby, and Beauty. Owner-verified regret scores at day 30, 60, and 90 for US and Canadian shoppers.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-12">
      <div className="mb-10 max-w-2xl" data-rr>
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
          Browse
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          Every category we track
        </h1>
        <p className="mt-3 text-base text-[var(--ink-2)] sm:text-lg">
          Owner-verified regret scores across every corner of the catalog.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORY_ORDER.map((cat, i) => {
          const subs = SUBCATEGORIES[cat.label] ?? [];
          const rrDir = i % 3 === 0 ? "l" : i % 3 === 2 ? "r" : "";
          const attrs: Record<string, string> = {};
          if (rrDir === "l") attrs["data-rr-l"] = "";
          else if (rrDir === "r") attrs["data-rr-r"] = "";
          else attrs["data-rr"] = "";

          return (
            <div
              key={cat.slug}
              {...attrs}
              className="flex flex-col rounded-3xl border border-[var(--rule)] bg-white p-5 shadow-[0_1px_0_rgba(12,58,94,0.03),0_10px_30px_-20px_rgba(12,58,94,0.2)] transition hover:border-[var(--brand-coral)] sm:p-6"
            >
              <Link
                href={`/category/${cat.slug}`}
                className="font-display text-xl font-semibold text-[var(--ink)] hover:text-[var(--brand-navy)] sm:text-2xl"
              >
                {cat.label}
              </Link>
              {subs.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {subs.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/category/${cat.slug}?sub=${s.slug}`}
                        className="inline-flex items-center rounded-full border border-[var(--rule)] bg-[var(--brand-cream)] px-3 py-1 text-xs text-[var(--ink-2)] hover:border-[var(--brand-coral)] hover:text-[var(--brand-navy)]"
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href={`/category/${cat.slug}`}
                className="mt-6 text-sm font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-navy-2)]"
              >
                Browse all {cat.label.toLowerCase()} →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
