"use client";

import { useEffect, useState } from "react";

/**
 * Country-locked Amazon CTA. Reads the `pregret_country` cookie set by
 * proxy.ts (auto-populated from Vercel's IP header on first visit) and shows
 * ONLY the matching country's button — Canadian visitors see just the
 * amazon.ca button, US visitors see just amazon.com. This eliminates the
 * biggest source of attribution loss: users clicking the wrong flag and
 * getting silently cross-border-redirected by Amazon (which strips the tag).
 *
 * Users who legitimately want to shop the other country can flip the flag
 * toggle in the header — that overrides the cookie, and this button follows.
 *
 * Fallback: before the cookie is read on first paint (SSR shipped no cookie),
 * default to Amazon.com so users always see a working button while JS boots.
 */
export default function AmazonCountryCTA({
  productId,
  source = "product-page",
  variant = "full",
}: {
  productId: string;
  source?: string;
  variant?: "full" | "compact";
}) {
  const [country, setCountry] = useState<"US" | "CA">("US");

  useEffect(() => {
    const readCookie = () => {
      const m = document.cookie.match(/(?:^|;\s*)pregret_country=(US|CA)/);
      if (m) setCountry(m[1] as "US" | "CA");
    };
    readCookie();
    // CountryToggle fetches /api/geo on first visit — listen for the update
    // so our button flips from US → CA (or vice versa) once detection lands.
    window.addEventListener("pregret:country-changed", readCookie);
    return () => window.removeEventListener("pregret:country-changed", readCookie);
  }, []);

  const flag = country === "US" ? "🇺🇸" : "🇨🇦";
  const host = country === "US" ? "Amazon.com" : "Amazon.ca";
  const href = `/go/${productId}?ref=${encodeURIComponent(source)}&to=${country}`;

  if (variant === "compact") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[var(--brand-coral)] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[var(--brand-coral-2)]"
      >
        <span aria-hidden>{flag}</span> See on {host}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      data-magnetic
      className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-coral)] px-5 py-3 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(255,107,87,0.6)] transition hover:bg-[var(--brand-coral-2)]"
    >
      <span aria-hidden>{flag}</span> See on {host} →
    </a>
  );
}
