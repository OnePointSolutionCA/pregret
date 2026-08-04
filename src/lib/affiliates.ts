const AMAZON_CA = process.env.AMAZON_AFFILIATE_TAG_CA ?? "";
const AMAZON_US = process.env.AMAZON_AFFILIATE_TAG_US ?? "";

export type AffiliateProgram = "amazon_ca" | "amazon_us" | "bestbuy" | "walmart" | "generic";

export function programFor(url: string): AffiliateProgram {
  try {
    const host = new URL(url).hostname;
    if (host.endsWith("amazon.ca")) return "amazon_ca";
    if (host.endsWith("amazon.com")) return "amazon_us";
    if (host.includes("bestbuy")) return "bestbuy";
    if (host.includes("walmart")) return "walmart";
  } catch {}
  return "generic";
}

export function withAffiliateTag(url: string): string {
  const program = programFor(url);
  try {
    const u = new URL(url);
    if (program === "amazon_ca" && AMAZON_CA) u.searchParams.set("tag", AMAZON_CA);
    if (program === "amazon_us" && AMAZON_US) u.searchParams.set("tag", AMAZON_US);
    return u.toString();
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
