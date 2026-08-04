import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Product insights, buyer's remorse data, and the truth behind long-term product satisfaction.",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="mb-10">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-coral)]">Blog</div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
          Insights &amp; data
        </h1>
        <p className="mt-3 max-w-xl text-lg text-[var(--ink-2)]">
          The truth about product satisfaction — backed by real owner data, not marketing copy.
        </p>
      </div>

      <div className="space-y-6">
        {posts.map((post, i) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-3 rounded-2xl border border-[var(--rule)] bg-white p-6 shadow-[0_1px_0_rgba(12,58,94,0.04),0_8px_30px_-20px_rgba(12,58,94,0.15)] transition hover:border-[var(--brand-coral)] hover:shadow-[0_1px_0_rgba(12,58,94,0.04),0_20px_50px_-20px_rgba(12,58,94,0.25)] sm:flex-row sm:items-center sm:gap-6"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-cream-2)] font-display text-2xl font-semibold text-[var(--brand-navy)]">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold uppercase tracking-[0.12em] text-[var(--brand-coral)]">{post.category}</span>
                <span className="text-[var(--muted)]">·</span>
                <span className="text-[var(--muted)]">{post.readMins} min read</span>
                <span className="text-[var(--muted)]">·</span>
                <time className="text-[var(--muted)]" dateTime={post.publishedDate}>
                  {new Date(post.publishedDate).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </time>
              </div>
              <h2 className="mt-1 text-lg font-semibold text-[var(--ink)] group-hover:text-[var(--brand-navy)]">
                {post.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]">{post.description}</p>
            </div>
            <span className="hidden text-sm font-semibold text-[var(--brand-navy)] opacity-0 transition group-hover:opacity-100 sm:block">
              Read →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
