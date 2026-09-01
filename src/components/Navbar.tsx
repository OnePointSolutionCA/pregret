import Link from "next/link";
import NavLogoLink from "./NavLogoLink";
import ProductsMenu from "./ProductsMenu";
import SmartSearch from "./SmartSearch";
import CountryToggle from "./CountryToggle";

export default function Navbar() {
  return (
    <div className="sticky top-0 z-40">
      <header className="border-b border-[var(--rule)] bg-[color-mix(in_srgb,var(--brand-cream)_92%,transparent)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-5">
          <NavLogoLink />

          {/* Centered search — takes the full middle column on desktop */}
          <div className="hidden flex-1 justify-center md:flex">
            <div className="w-full max-w-lg">
              <SmartSearch />
            </div>
          </div>

          {/* Right-side nav */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
            <ProductsMenu />
            <Link
              href="/deals"
              className="hidden text-sm font-semibold text-[var(--brand-coral)] hover:text-[var(--brand-coral-2)] sm:inline"
            >
              Deals
            </Link>
            <Link
              href="/#trending"
              className="hidden text-sm font-medium text-[var(--ink-2)] hover:text-[var(--brand-navy)] lg:inline"
            >
              Trending
            </Link>
            <Link
              href="/how-it-works"
              className="hidden text-sm font-medium text-[var(--ink-2)] hover:text-[var(--brand-navy)] lg:inline"
            >
              How it works
            </Link>
            <Link
              href="/blog"
              className="hidden text-sm font-medium text-[var(--ink-2)] hover:text-[var(--brand-navy)] lg:inline"
            >
              Blog
            </Link>
            <CountryToggle />
          </div>
        </div>

        {/* Mobile search row */}
        <div className="border-t border-[var(--rule)] bg-[var(--brand-cream)] px-4 py-2 md:hidden">
          <SmartSearch />
        </div>
      </header>
    </div>
  );
}
