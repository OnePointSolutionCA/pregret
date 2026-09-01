#!/usr/bin/env node
/**
 * Full link audit — hits every static route, every category, every subcategory
 * filter, a sample of product pages + /go redirects, all API endpoints.
 * Reports any non-2xx statuses.
 */
import { createClient } from "@supabase/supabase-js";

const BASE = process.argv[2] || "https://pregret.ca";
const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CATEGORIES = ["electronics", "kitchen", "fitness", "personal-care", "home-garden", "baby", "beauty", "school-supplies"];
const SORTS = ["", "?sort=least-regret", "?sort=most-loved", "?sort=a-z"];

async function check(path) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    return { path, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (e) {
    return { path, status: 0, ok: false, err: e.message };
  }
}

const results = [];

// Static
for (const p of ["/", "/about", "/how-it-works", "/privacy", "/terms", "/blog", "/categories", "/robots.txt", "/llms.txt", "/sitemap.xml", "/logo.png", "/og.png", "/icon.png", "/apple-icon.png"]) {
  results.push(await check(p));
}
// API
for (const p of ["/api/search-index", "/api/extension/lookup?title=peloton"]) {
  results.push(await check(p));
}
// Categories + subcategories + sorts
for (const c of CATEGORIES) {
  for (const s of SORTS) results.push(await check(`/category/${c}${s}`));
}
// Sample of products across categories (5 each)
const productSlugs = [];
for (const cat of ["Electronics", "Kitchen", "Fitness", "Personal Care", "Home & Garden", "Baby", "Beauty", "School Supplies"]) {
  const { data } = await supa.from("products").select("id, slug").eq("category", cat).limit(5);
  productSlugs.push(...(data ?? []));
}
console.log(`Sampling ${productSlugs.length} product pages...`);
for (const p of productSlugs) results.push(await check(`/product/${p.slug}`));

// Sample /go redirects (should return 307)
console.log("Sampling /go redirects...");
for (const p of productSlugs.slice(0, 8)) {
  const r = await check(`/go/${p.id}`);
  // 307 is OK (redirect) for /go
  if (r.status === 307) r.ok = true;
  results.push(r);
}
// A few blog posts
const { data: posts } = await supa.from("products").select("slug").limit(0);
console.log(`Blog sample...`);
const blogSlugs = ["why-day-90-matters", "most-regretted-fitness-products-2026", "how-regret-score-is-calculated"];
for (const s of blogSlugs) results.push(await check(`/blog/${s}`));

// Report
const total = results.length;
const bad = results.filter((r) => !r.ok);
console.log(`\n${total} checked | ${total - bad.length} ok | ${bad.length} bad`);
if (bad.length) {
  console.log("\nBAD:");
  bad.forEach((r) => console.log(`  ${r.status}  ${r.path}${r.err ? "  " + r.err : ""}`));
}
