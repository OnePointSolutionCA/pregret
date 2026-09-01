import Link from "next/link";
import { CATEGORY_ORDER } from "@/lib/subcategories";
import { getAllPosts } from "@/data/blog";

export default function Footer() {
  const recentPosts = getAllPosts().slice(0, 4);

  return (
    <footer className="mt-24 border-t border-[var(--rule)] bg-[var(--brand-cream-2)]">
      <div className="mx-auto max-w-6xl px-5 py-12">
        {/* ---------- 4-column grid ---------- */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + mission */}
          <div>
            <div className="font-display text-2xl italic text-[var(--brand-navy)]">Pregret</div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">
              The Regret Score for any product — before you buy. Owner-verified satisfaction at day 30, 60, and 90.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-coral)]">
              Serving US &amp; Canada
            </p>
          </div>

          {/* Categories */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Categories
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {CATEGORY_ORDER.map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-[var(--ink-2)] hover:text-[var(--brand-navy)]">
                    {c.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/categories" className="font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-coral)]">
                  Browse all →
                </Link>
              </li>
            </ul>
          </div>

          {/* Recent posts */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Latest from the blog
            </div>
            <ul className="mt-3 space-y-2.5 text-sm">
              {recentPosts.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="line-clamp-2 text-[var(--ink-2)] hover:text-[var(--brand-navy)]"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/blog" className="font-semibold text-[var(--brand-navy)] hover:text-[var(--brand-coral)]">
                  All posts →
                </Link>
              </li>
            </ul>
          </div>

          {/* Company + legal */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Pregret
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/about" className="text-[var(--ink-2)] hover:text-[var(--brand-navy)]">About</Link></li>
              <li><Link href="/how-it-works" className="text-[var(--ink-2)] hover:text-[var(--brand-navy)]">How it works</Link></li>
              <li><Link href="/blog" className="text-[var(--ink-2)] hover:text-[var(--brand-navy)]">Blog</Link></li>
              <li><a href="mailto:hello@pregret.ca" className="text-[var(--ink-2)] hover:text-[var(--brand-navy)]">Contact</a></li>
              <li className="pt-2"><Link href="/privacy" className="text-[var(--ink-2)] hover:text-[var(--brand-navy)]">Privacy</Link></li>
              <li><Link href="/terms" className="text-[var(--ink-2)] hover:text-[var(--brand-navy)]">Terms</Link></li>
            </ul>
          </div>
        </div>

        {/* ---------- Affiliate disclosure (legally required) ---------- */}
        <div className="mt-12 rounded-2xl border border-[var(--rule)] bg-white p-5 text-xs leading-relaxed text-[var(--ink-2)]">
          <strong className="font-semibold text-[var(--ink)]">Affiliate disclosure.</strong>{" "}
          Pregret participates in a range of affiliate programs — including the Amazon Services LLC
          Associates Program, Amazon.ca Associates, Best Buy Affiliate, Walmart Affiliate Network,
          Target Affiliates, Wayfair, The Home Depot Affiliate, eBay Partner Network, and universal
          networks such as Impact.com, Commission Junction, Rakuten Advertising, and Skimlinks —
          each designed to let sites earn commissions by linking to their retailers. Some outbound
          product links on this site are affiliate links; if you click one and complete a purchase
          we may earn a small commission at no extra cost to you. Commissions{" "}
          <strong className="text-[var(--ink)]">never</strong> influence Regret Scores — every score
          is calculated from publicly available review data using a deterministic formula.
        </div>

        {/* ---------- Bottom bar ---------- */}
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-[var(--rule)] pt-6 text-xs text-[var(--muted)] sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Pregret. All rights reserved.</div>
          <div>
            Powered by{" "}
            <a
              href="https://onepointsolution.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--ink-2)] hover:text-[var(--brand-navy)]"
            >
              onepointsolution.ca
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
