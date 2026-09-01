/**
 * Multi-network affiliate URL handling.
 *
 * Every outbound product URL runs through `withAffiliateTag()` before we redirect
 * users to it via /go/[productId]. The function detects which retailer's domain the
 * URL points at and appends the correct affiliate tracking parameter — Amazon,
 * Best Buy, Walmart, Target, Wayfair, Home Depot, Costco, Newegg, eBay,
 * AliExpress, and universal networks (Impact, CJ, Rakuten, Skimlinks) are all
 * supported. Tags come from environment variables — leave any unset and the URL
 * passes through untagged (fine before you're approved for that program).
 *
 * Env vars (all optional):
 *   AMAZON_AFFILIATE_TAG_US   -> tag= param on amazon.com URLs
 *   AMAZON_AFFILIATE_TAG_CA   -> tag= param on amazon.ca URLs
 *   BESTBUY_AFFILIATE_TAG     -> loc= param on bestbuy.* URLs
 *   WALMART_AFFILIATE_TAG     -> sourceid= on walmart.* URLs
 *   TARGET_AFFILIATE_TAG      -> afid= on target.com URLs
 *   WAYFAIR_AFFILIATE_TAG     -> refid= on wayfair.* URLs
 *   HOMEDEPOT_AFFILIATE_TAG   -> AID= on homedepot.* URLs
 *   COSTCO_AFFILIATE_TAG      -> partnerId= on costco.* URLs
 *   NEWEGG_AFFILIATE_TAG      -> nm_mc= on newegg.com URLs
 *   EBAY_AFFILIATE_TAG        -> campid= on ebay.* URLs
 *   ALIEXPRESS_AFFILIATE_TAG  -> aff_platform= on aliexpress URLs
 *   IMPACT_AFFILIATE_ID       -> irclickid= (used for many Impact.com merchants)
 *   CJ_AFFILIATE_ID           -> AID= (Commission Junction)
 *   RAKUTEN_AFFILIATE_ID      -> u1= (Rakuten Advertising)
 *   SKIMLINKS_SITE_ID         -> if set, ALL unknown-retailer URLs are wrapped
 *                                through go.skimresources.com as a fallback.
 */

const env = (k: string) => process.env[k] ?? "";

type NetworkRule = {
  program: string;                          // canonical id
  label: string;                            // "See on Best Buy"
  match: (host: string, url: URL) => boolean;
  apply: (u: URL) => URL;
};

// Ordered — first match wins.
const RULES: NetworkRule[] = [
  {
    program: "amazon_us",
    label: "See on Amazon",
    match: (h) => h.endsWith(".amazon.com") || h === "amazon.com" || h.endsWith(".amzn.to"),
    apply: (u) => {
      const t = env("AMAZON_AFFILIATE_TAG_US");
      if (t) u.searchParams.set("tag", t);
      return u;
    },
  },
  {
    program: "amazon_ca",
    label: "See on Amazon.ca",
    match: (h) => h.endsWith(".amazon.ca") || h === "amazon.ca",
    apply: (u) => {
      const t = env("AMAZON_AFFILIATE_TAG_CA");
      if (t) u.searchParams.set("tag", t);
      return u;
    },
  },
  {
    program: "bestbuy",
    label: "See on Best Buy",
    match: (h) => h.includes("bestbuy."),
    apply: (u) => {
      const t = env("BESTBUY_AFFILIATE_TAG");
      if (t) { u.searchParams.set("ref", "212"); u.searchParams.set("loc", t); }
      return u;
    },
  },
  {
    program: "walmart",
    label: "See on Walmart",
    match: (h) => h.endsWith(".walmart.com") || h === "walmart.com" || h.endsWith(".walmart.ca"),
    apply: (u) => {
      const t = env("WALMART_AFFILIATE_TAG");
      if (t) u.searchParams.set("sourceid", t);
      return u;
    },
  },
  {
    program: "target",
    label: "See on Target",
    match: (h) => h.endsWith(".target.com") || h === "target.com",
    apply: (u) => {
      const t = env("TARGET_AFFILIATE_TAG");
      if (t) u.searchParams.set("afid", t);
      return u;
    },
  },
  {
    program: "wayfair",
    label: "See on Wayfair",
    match: (h) => h.includes("wayfair."),
    apply: (u) => {
      const t = env("WAYFAIR_AFFILIATE_TAG");
      if (t) u.searchParams.set("refid", t);
      return u;
    },
  },
  {
    program: "homedepot",
    label: "See on Home Depot",
    match: (h) => h.includes("homedepot."),
    apply: (u) => {
      const t = env("HOMEDEPOT_AFFILIATE_TAG");
      if (t) u.searchParams.set("AID", t);
      return u;
    },
  },
  {
    program: "costco",
    label: "See on Costco",
    match: (h) => h.includes("costco."),
    apply: (u) => {
      const t = env("COSTCO_AFFILIATE_TAG");
      if (t) u.searchParams.set("partnerId", t);
      return u;
    },
  },
  {
    program: "newegg",
    label: "See on Newegg",
    match: (h) => h.endsWith(".newegg.com") || h === "newegg.com" || h.endsWith(".newegg.ca"),
    apply: (u) => {
      const t = env("NEWEGG_AFFILIATE_TAG");
      if (t) u.searchParams.set("nm_mc", t);
      return u;
    },
  },
  {
    program: "ebay",
    label: "See on eBay",
    match: (h) => h.endsWith(".ebay.com") || h === "ebay.com" || h.endsWith(".ebay.ca"),
    apply: (u) => {
      const t = env("EBAY_AFFILIATE_TAG");
      if (t) { u.searchParams.set("mkcid", "1"); u.searchParams.set("mkrid", "711-53200-19255-0"); u.searchParams.set("campid", t); }
      return u;
    },
  },
  {
    program: "aliexpress",
    label: "See on AliExpress",
    match: (h) => h.includes("aliexpress."),
    apply: (u) => {
      const t = env("ALIEXPRESS_AFFILIATE_TAG");
      if (t) { u.searchParams.set("aff_platform", "portals-tool"); u.searchParams.set("aff_trace_key", t); }
      return u;
    },
  },
];

export type AffiliateProgram =
  | "amazon_us" | "amazon_ca" | "bestbuy" | "walmart" | "target" | "wayfair"
  | "homedepot" | "costco" | "newegg" | "ebay" | "aliexpress" | "skimlinks" | "generic";

export function programFor(url: string): AffiliateProgram {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const r of RULES) if (r.match(host, new URL(url))) return r.program as AffiliateProgram;
  } catch {}
  return "generic";
}

/**
 * Human-readable label for the CTA button — "See on Amazon", "See on Best Buy", etc.
 */
export function retailerLabel(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const r of RULES) if (r.match(host, new URL(url))) return r.label;
    return "View product";
  } catch {
    return "View product";
  }
}

/**
 * Apply the affiliate tag for whichever network the URL belongs to.
 * If the URL is on a retailer we don't have direct integration for AND
 * SKIMLINKS_SITE_ID is configured, wrap it through Skimlinks so it still
 * generates revenue. Otherwise return the URL unchanged.
 */
export function withAffiliateTag(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    for (const rule of RULES) {
      if (rule.match(host, u)) return rule.apply(u).toString();
    }
    // Fallback: universal wrapper via Skimlinks (if configured)
    const sk = env("SKIMLINKS_SITE_ID");
    if (sk) {
      return `https://go.skimresources.com/?id=${encodeURIComponent(sk)}&url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return url;
  }
}

export function buildGoUrl(productId: string, source?: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const u = new URL(`/go/${productId}`, base || "https://pregret.ca");
  if (source) u.searchParams.set("ref", source);
  return u.toString();
}
