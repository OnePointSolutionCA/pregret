import { NextRequest, NextResponse } from "next/server";

// Edge runtime — tiny, fast, no Node startup cost.
export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Returns the visitor's country (US/CA) from Vercel's IP header and sets
 * the `pregret_country` cookie. Called client-side by CountryToggle on
 * mount if the cookie isn't already set.
 *
 * Kept out of proxy.ts because setting a Set-Cookie header from proxy
 * would make every page response `private, no-store` — killing ISR/CDN
 * caching and the Fluid Active CPU budget.
 */
export async function GET(req: NextRequest) {
  const raw = (
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    ""
  ).toUpperCase();
  const country: "US" | "CA" = raw === "CA" ? "CA" : "US";

  const res = NextResponse.json({ country });
  res.cookies.set("pregret_country", country, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
