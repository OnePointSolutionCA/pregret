"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLogo from "./NavLogo";

/**
 * Home-link wrapper for the Pregret logo. If the user is already on `/`, we
 * scroll to top instead of relying on Next.js Link (which is a no-op for
 * same-route navigation). Feels like a proper "refresh" without a full reload.
 */
export default function NavLogoLink() {
  const pathname = usePathname();

  const onClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      // Instant then smooth = works in every browser incl. sandboxed iframes
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" }));
    }
  };

  return (
    <Link href="/" onClick={onClick} className="shrink-0" aria-label="Pregret home">
      <span className="block sm:hidden"><NavLogo height={32} /></span>
      <span className="hidden sm:block"><NavLogo /></span>
    </Link>
  );
}
