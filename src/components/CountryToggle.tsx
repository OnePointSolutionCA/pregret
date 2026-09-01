"use client";

import { useEffect, useState } from "react";

/**
 * US/CA flag switcher in the header. Stores the choice in a `pregret_country`
 * cookie that /go/[productId] reads to decide amazon.com vs amazon.ca — this
 * lets a CA user on a US IP (or vice versa) override the geo-detection.
 */
export default function CountryToggle() {
  const [country, setCountry] = useState<"US" | "CA" | null>(null);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)pregret_country=(US|CA)/);
    if (m) {
      setCountry(m[1] as "US" | "CA");
      return;
    }
    // No cookie yet — fetch /api/geo to detect from IP and persist.
    // This replaces the proxy-based cookie set which was killing ISR caching.
    fetch("/api/geo")
      .then((r) => r.json())
      .then((j: { country?: "US" | "CA" }) => {
        if (j.country === "US" || j.country === "CA") {
          setCountry(j.country);
          window.dispatchEvent(new CustomEvent("pregret:country-changed"));
        }
      })
      .catch(() => {});
  }, []);

  const set = (c: "US" | "CA") => {
    document.cookie = `pregret_country=${c}; path=/; max-age=31536000; samesite=lax`;
    setCountry(c);
    window.dispatchEvent(new CustomEvent("pregret:country-changed"));
  };

  const btn = (c: "US" | "CA", flag: string, label: string) => {
    const active = country === c;
    return (
      <button
        key={c}
        type="button"
        onClick={() => set(c)}
        aria-label={`Show prices for ${label}`}
        aria-pressed={active}
        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition ${
          active
            ? "bg-[var(--brand-navy)] text-white shadow-sm"
            : "text-[var(--ink-2)] hover:bg-[var(--brand-cream-2)]"
        }`}
      >
        <span aria-hidden>{flag}</span>
      </button>
    );
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-[var(--rule)] bg-white p-0.5"
      role="group"
      aria-label="Country"
    >
      {btn("US", "🇺🇸", "United States")}
      {btn("CA", "🇨🇦", "Canada")}
    </div>
  );
}
