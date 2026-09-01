import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy is a no-op. Any Set-Cookie header from a proxy forces
 * `cache-control: private, no-store` on every response, killing ISR/CDN
 * caching for the entire site — which was blowing our Vercel Fluid Active
 * CPU quota. Country detection was moved to a client-side ping to
 * `/api/geo` (called only when the `pregret_country` cookie is missing),
 * so pages can stay statically cached.
 *
 * Kept as an exported symbol so Next.js still tree-shakes the file cleanly
 * without changing our build config.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Match nothing — proxy runs zero times per request. This is intentional
  // during CPU triage; if we ever need proxy work again, widen the matcher.
  matcher: [],
};
