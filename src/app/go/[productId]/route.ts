import { NextResponse, type NextRequest } from "next/server";
import { serverSupabase, serviceSupabase, supabaseConfigured } from "@/lib/supabase";
import { programFor, withAffiliateTag } from "@/lib/affiliates";
import type { Product } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const url = new URL(req.url);
  const source = url.searchParams.get("ref") ?? "site";

  if (!supabaseConfigured) return NextResponse.redirect(new URL("/", req.url));

  const supabase = await serverSupabase();
  const { data: product } = await supabase
    .from("products")
    .select("id, amazon_url")
    .eq("id", productId)
    .maybeSingle();

  const dest = (product as Pick<Product, "id" | "amazon_url"> | null)?.amazon_url ?? null;
  if (!dest) return NextResponse.redirect(new URL("/", req.url));

  const finalUrl = withAffiliateTag(dest);
  const program = programFor(dest);

  const { data: userData } = await supabase.auth.getUser();
  const sessionId = req.cookies.get("pg_sid")?.value ?? crypto.randomUUID();

  // Fire-and-forget log via service role so RLS doesn't require the user.
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
