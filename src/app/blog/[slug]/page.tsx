import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getAllPosts } from "@/data/blog";

// Blog posts are static markdown — pre-render all 141 at build time, serve from cache forever.
export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
      languages: { "en-US": `/blog/${post.slug}`, "en-CA": `/blog/${post.slug}`, "en": `/blog/${post.slug}` },
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.publishedDate,
      section: post.category,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const idx = allPosts.findIndex((p) => p.slug === slug);
  const next = allPosts[idx - 1] ?? null;
  const prev = allPosts[idx + 1] ?? null;

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.publishedDate,
            inLanguage: ["en-US", "en-CA"],
            author: { "@type": "Organization", name: "Pregret" },
            publisher: { "@type": "Organization", name: "Pregret", url: "https://pregret.vercel.app" },
            audience: {
              "@type": "PeopleAudience",
              geographicArea: [
                { "@type": "Country", name: "United States" },
                { "@type": "Country", name: "Canada" },
              ],
            },
          }),
        }}
      />

      <Link href="/blog" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-navy)] hover:text-[var(--brand-coral)]">
        ← All posts
      </Link>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-[0.12em] text-[var(--brand-coral)]">{post.category}</span>
          <span className="text-[var(--muted)]">·</span>
          <span className="text-[var(--muted)]">{post.readMins} min read</span>
          <span className="text-[var(--muted)]">·</span>
          <time className="text-[var(--muted)]" dateTime={post.publishedDate}>
            {new Date(post.publishedDate).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })}
          </time>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-[var(--ink-2)]">{post.description}</p>
      </header>

      <div className="prose-pregret">
        {post.body.split("\n\n").map((block, i) => {
          if (block.startsWith("## ")) {
            return <h2 key={i} className="mb-3 mt-8 font-display text-2xl font-semibold text-[var(--ink)]">{block.replace("## ", "")}</h2>;
          }
          if (block.startsWith("| ")) {
            const rows = block.split("\n").filter((r) => r.trim() && !r.startsWith("|-"));
            const headers = rows[0]?.split("|").filter(Boolean).map((c) => c.trim()) ?? [];
            const body = rows.slice(1).map((r) => r.split("|").filter(Boolean).map((c) => c.trim()));
            return (
              <div key={i} className="my-4 overflow-x-auto rounded-lg border border-[var(--rule)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--rule)] bg-[var(--brand-cream-2)]">
                      {headers.map((h, j) => <th key={j} className="px-4 py-2 text-left font-semibold text-[var(--ink)]">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((row, ri) => (
                      <tr key={ri} className="border-b border-[var(--rule)] last:border-0">
                        {row.map((cell, ci) => <td key={ci} className="px-4 py-2 text-[var(--ink-2)]">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          if (block.startsWith("- **") || block.startsWith("1. **")) {
            const items = block.split("\n").filter(Boolean);
            const ordered = block.startsWith("1.");
            const Tag = ordered ? "ol" : "ul";
            return (
              <Tag key={i} className={`my-4 space-y-2 ${ordered ? "list-decimal" : "list-disc"} pl-6 text-[var(--ink-2)]`}>
                {items.map((item, j) => {
                  const text = item.replace(/^[-\d]+\.\s*/, "");
                  return <li key={j} dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--ink)]">$1</strong>') }} />;
                })}
              </Tag>
            );
          }
          return (
            <p
              key={i}
              className="mb-4 leading-relaxed text-[var(--ink-2)]"
              dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--ink)]">$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }}
            />
          );
        })}
      </div>

      {(prev || next) && (
        <nav className="mt-12 flex flex-col gap-4 border-t border-[var(--rule)] pt-8 sm:flex-row sm:justify-between">
          {prev ? (
            <Link href={`/blog/${prev.slug}`} className="group flex-1 rounded-xl border border-[var(--rule)] bg-white p-4 transition hover:border-[var(--brand-coral)]">
              <div className="text-xs text-[var(--muted)]">← Previous</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--brand-navy)]">{prev.title}</div>
            </Link>
          ) : <div className="flex-1" />}
          {next ? (
            <Link href={`/blog/${next.slug}`} className="group flex-1 rounded-xl border border-[var(--rule)] bg-white p-4 text-right transition hover:border-[var(--brand-coral)]">
              <div className="text-xs text-[var(--muted)]">Next →</div>
              <div className="mt-1 text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--brand-navy)]">{next.title}</div>
            </Link>
          ) : <div className="flex-1" />}
        </nav>
      )}
    </article>
  );
}
