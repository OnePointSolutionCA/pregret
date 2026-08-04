import Link from "next/link";
import NavLogo from "./NavLogo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[color-mix(in_srgb,var(--brand-cream)_88%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center" aria-label="Pregret home">
          <NavLogo />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-[var(--ink-2)]">
          <Link href="/category/electronics" className="hidden hover:text-[var(--brand-navy)] sm:inline">Electronics</Link>
          <Link href="/category/kitchen" className="hidden hover:text-[var(--brand-navy)] md:inline">Kitchen</Link>
          <Link href="/category/fitness" className="hidden hover:text-[var(--brand-navy)] md:inline">Fitness</Link>
          <Link href="/blog" className="hidden hover:text-[var(--brand-navy)] sm:inline">Blog</Link>
          <Link href="/dashboard" className="hidden hover:text-[var(--brand-navy)] sm:inline">My products</Link>
          <Link
            href="/login"
            data-magnetic
            className="rounded-full bg-[var(--brand-navy)] px-4 py-2 text-white transition hover:bg-[var(--brand-navy-2)]"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
