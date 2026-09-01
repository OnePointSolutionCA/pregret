#!/usr/bin/env node
/**
 * Convert every product's amazon_url from /dp/ASIN → /s?k=name. Search URLs
 * never 404 or show "product unavailable" — Amazon always returns a results
 * page. Trade-off: user lands on a list instead of the exact product page,
 * so conversion is slightly lower, but they never bounce.
 *
 * ASINs are preserved in external_ids.asin (already there for Kaggle imports)
 * so we can flip back to /dp/ URLs later if we want.
 *
 * Run: node --env-file=.env.local scripts/convert-to-search-urls.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Rebuild a clean search URL: prepend brand only if the name doesn't already start with it.
function buildSearchUrl(brand, name) {
  const b = (brand ?? "").trim();
  const n = name.trim();
  let term = n;
  if (b && !n.toLowerCase().startsWith(b.toLowerCase() + " ") && n.toLowerCase() !== b.toLowerCase()) {
    term = `${b} ${n}`;
  }
  return "https://www.amazon.com/s?k=" + encodeURIComponent(term.slice(0, 120));
}

console.log("Loading all products with /dp/ URLs...");
const rows = [];
for (let p = 0; p < 100; p++) {
  const { data } = await supa
    .from("products")
    .select("id, slug, name, brand, amazon_url")
    .ilike("amazon_url", "%/dp/%")
    .range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  rows.push(...data);
  if (data.length < 1000) break;
}
console.log(`  ${rows.length.toLocaleString()} products to convert`);

let done = 0;
for (const p of rows) {
  const newUrl = buildSearchUrl(p.brand, p.name);
  if (newUrl === p.amazon_url) continue;
  await supa.from("products").update({ amazon_url: newUrl }).eq("id", p.id);
  done++;
  if (done % 500 === 0) process.stdout.write(`  ${done}/${rows.length}\r`);
}
console.log(`\n✓ ${done.toLocaleString()} converted to search URLs`);

// Sanity check
const { count: totalWithSearch } = await supa
  .from("products")
  .select("id", { count: "exact", head: true })
  .ilike("amazon_url", "%/s?k=%");
const { count: totalWithDp } = await supa
  .from("products")
  .select("id", { count: "exact", head: true })
  .ilike("amazon_url", "%/dp/%");
console.log(`\nFinal: ${totalWithSearch?.toLocaleString()} search URLs, ${totalWithDp?.toLocaleString()} /dp/ URLs`);
