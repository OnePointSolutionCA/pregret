import type { NextConfig } from "next";

// Baseline security headers for every response. Kept to headers that cannot change how a page
// renders: no CSP here (a nonce CSP would force dynamic rendering and undo ISR caching).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Near-duplicate merged into the Lululemon Studio Mirror comparison (see RETIRED_SLUGS
      // in src/data/blog-seo-2026-10.ts).
      {
        source: "/blog/mirror-by-lululemon-vs-concept2-rowerg-which-has-lower-long-term-regret",
        destination: "/blog/lululemon-studio-mirror-vs-concept2-rowerg-which-has-lower-long-term-regret",
        statusCode: 301,
      },
      // Short form of the Boxing Day guide URL.
      {
        source: "/blog/boxing-day-deals-canada-2026",
        destination: "/blog/boxing-day-deals-canada-2026-what-s-actually-worth-buying",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
