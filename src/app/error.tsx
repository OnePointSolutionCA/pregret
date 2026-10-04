"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">
        Refreshing scores
      </span>
      <h1 className="mt-3 font-display text-3xl font-normal leading-tight text-[var(--ink)] sm:text-4xl">
        This page is taking a moment to load
      </h1>
      <p className="mt-3 text-[var(--ink-2)]">
        We are updating our regret data right now. Give it a few seconds and try again, or browse the
        guides on our blog in the meantime.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-[var(--brand-coral)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--brand-coral-2)]"
        >
          Try again
        </button>
        <Link
          href="/blog"
          className="rounded-full border border-[var(--rule)] bg-white px-6 py-3 font-semibold text-[var(--brand-navy)] transition hover:border-[var(--brand-coral)]"
        >
          Read the blog
        </Link>
      </div>
    </div>
  );
}
