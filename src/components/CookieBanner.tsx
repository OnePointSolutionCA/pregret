"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Lightweight consent banner. Required for AdSense/analytics compliance in
 * Canada (PIPEDA), California (CCPA), and (if you ever expand) EU (GDPR).
 * Stored in localStorage — no server call, no cookie set (which would break
 * ISR caching). Once dismissed, the banner never renders again.
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem("pregret_cookie_ack");
    if (!acknowledged) {
      // Small delay so it doesn't flash before hero renders
      const id = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(id);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("pregret_cookie_ack", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl border border-[var(--rule)] bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm text-[var(--ink-2)]">
          We use cookies to detect your country (for Amazon.com vs Amazon.ca routing), track affiliate clicks, and
          serve basic analytics. Third-party ad and analytics partners may set their own cookies.{" "}
          <Link href="/privacy" className="font-semibold text-[var(--brand-navy)] underline hover:text-[var(--brand-coral)]">
            Read our privacy policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-navy-2)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
