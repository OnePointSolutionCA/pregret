import { NextResponse, type NextRequest } from "next/server";
import { publicSupabase, supabaseConfigured } from "@/lib/supabase";
import { withAffiliateTag } from "@/lib/affiliates";
import type { Product } from "@/lib/types";

/**
 * Rewrite an amazon.com URL to amazon.ca (or vice versa) when we can. Same ASIN
 * usually maps 1:1 between the two stores. We swap the domain and rebuild the
 * path so `/dp/B0XXX`, `/gp/product/B0XXX`, and search URLs all work.
 */
function localizeAmazon(url: string, targetHost: "amazon.com" | "amazon.ca"): string {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("amazon.com") && !u.hostname.endsWith("amazon.ca")) return url;
    u.hostname = targetHost === "amazon.ca" ? "www.amazon.ca" : "www.amazon.com";
    // Clear any pre-existing affiliate tag so we don't ship the wrong-country tag.
    u.searchParams.delete("tag");
    return u.toString();
  } catch {
    return url;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const url = new URL(req.url);
  // Explicit override via ?to=ca | ?to=us
  const explicitCountry = url.searchParams.get("to")?.toUpperCase();

  if (!supabaseConfigured) return NextResponse.redirect(new URL("/", req.url));

  const supabase = publicSupabase();
  const { data: product } = await supabase
    .from("products")
    .select("id, amazon_url")
    .eq("id", productId)
    .maybeSingle();

  let dest = (product as Pick<Product, "id" | "amazon_url"> | null)?.amazon_url ?? null;
  if (!dest) return NextResponse.redirect(new URL("/", req.url));

  // -------------------- Country routing --------------------
  // Order of precedence: ?to= override → user's saved cookie choice → IP geo.
  const cookieCountry = req.cookies.get("pregret_country")?.value?.toUpperCase();
  const country =
    explicitCountry ||
    cookieCountry ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") || // fallback if we ever proxy through Cloudflare
    "";
  if ((country === "CA" || explicitCountry === "CA") && /amazon\.com/.test(dest)) {
    dest = localizeAmazon(dest, "amazon.ca");
  } else if (explicitCountry === "US" && /amazon\.ca/.test(dest)) {
    dest = localizeAmazon(dest, "amazon.com");
  }
  // -------------------------------------------------------

  const finalUrl = withAffiliateTag(dest);

  // No click logging here. Bots made nearly every hit (275k rows, 101 MB by Nov 2026, one session
  // each), which pushed the free database over 500 MB. Amazon Associates reports real clicks.
  const res = NextResponse.redirect(finalUrl);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
