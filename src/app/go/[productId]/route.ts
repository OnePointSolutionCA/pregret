import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase, serviceSupabase, supabaseConfigured } from "@/lib/supabase";
import { programFor, withAffiliateTag } from "@/lib/affiliates";
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
  const source = url.searchParams.get("ref") ?? "site";
  // Explicit override via ?to=ca | ?to=us
  const explicitCountry = url.searchParams.get("to")?.toUpperCase();

  if (!supabaseConfigured) return NextResponse.redirect(new URL("/", req.url));

  const supabase = await serverSupabase();
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
  const program = programFor(dest);

  const { data: userData } = await supabase.auth.getUser();
  const sessionId = req.cookies.get("pg_sid")?.value ?? crypto.randomUUID();

  // Fire-and-forget log
  try {
    const svc = serviceSupabase();
    await svc.from("affiliate_clicks").insert({
      product_id: productId,
      user_id: userData.user?.id ?? null,
      session_id: sessionId,
      destination_url: finalUrl,
      affiliate_program: program,
      source,
    });
  } catch {
    // swallow — click tracking must never break the redirect
  }

  const res = NextResponse.redirect(finalUrl);
  if (!req.cookies.get("pg_sid")) {
    res.cookies.set("pg_sid", sessionId, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
}
