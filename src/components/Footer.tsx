import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--rule)] bg-[var(--brand-cream-2)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-[var(--ink-2)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-wordmark text-lg font-semibold text-[var(--brand-navy)]">Pregret</div>
          <div className="text-[var(--muted)]">Know before you regret.</div>
        </div>
        <nav className="flex flex-wrap gap-5">
          <Link href="/blog" className="hover:text-[var(--brand-navy)]">Blog</Link>
          <Link href="/about" className="hover:text-[var(--brand-navy)]">About</Link>
          <Link href="/privacy" className="hover:text-[var(--brand-navy)]">Privacy</Link>
          <Link href="/terms" className="hover:text-[var(--brand-navy)]">Terms</Link>
        </nav>
        <div className="text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} Pregret · Powered by{" "}
          <a href="https://onepointsolution.ca" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--ink-2)] hover:text-[var(--brand-navy)]">
            onepointsolution.ca
          </a>
        </div>
      </div>
    </footer>
  );
}
