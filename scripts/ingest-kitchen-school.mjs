#!/usr/bin/env node
/**
 * Targeted top-up for the two under-represented Pregret categories:
 *   Kitchen        → Kaggle cat 170 (Kitchen & Dining) with review floor 5
 *   School Supplies → Kaggle cats 137, 11, 219, 10, 9 (stationery + arts/crafts)
 *
 * Run:  node --env-file=.env.local scripts/ingest-kitchen-school.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, "..", "data-cache", "amazon_products.csv");

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CAT_MAP = {
  170: "Kitchen",
  137: "School Supplies", // Stationery & Gift Wrapping
  11:  "School Supplies", // Craft Supplies & Materials
  219: "School Supplies", // Arts & Crafts Supplies
  10:  "School Supplies", // Painting, Drawing & Art
  9:   "School Supplies", // Arts, Crafts & Sewing Storage
};
const REVIEW_FLOOR = 5; // Kitchen has ~825 rows total, School cats vary — floor low so we get real coverage

function csvSplit(line) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === "," && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur); return out;
}
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
function extractBrand(title) {
  const w = title.trim().split(/\s+/);
  if (w[0] && w[1] && /^[A-Z]/.test(w[0]) && /^[A-Z]/.test(w[1]) && !w[1].match(/[0-9]/) && w[0].length <= 8 && w[1].length <= 10) return `${w[0]} ${w[1]}`;
  return w[0] ?? "Unbranded";
}
function regretFromStars(stars, reviews) {
  if (!reviews || reviews < 20) return 45;
  if (stars >= 4.6 && reviews > 5000) return 8 + Math.floor(Math.random() * 8);
  if (stars >= 4.4 && reviews > 1000) return 15 + Math.floor(Math.random() * 12);
  if (stars >= 4.2)                    return 25 + Math.floor(Math.random() * 15);
  if (stars >= 3.8)                    return 42 + Math.floor(Math.random() * 15);
  if (stars >= 3.4)                    return 58 + Math.floor(Math.random() * 15);
  if (stars >= 3.0)                    return 70 + Math.floor(Math.random() * 12);
  return 82 + Math.floor(Math.random() * 15);
}
function wouldBuyFromStars(s) { return !s ? 50 : Math.max(0, Math.min(100, Math.round((s - 1) / 4 * 100))); }
function decayFromStars(s) {
  return { day30: s.toFixed(2), day60: Math.max(1, s - 0.5).toFixed(2), day90: Math.max(1, s - 0.9).toFixed(2) };
}

const buckets = { "Kitchen": [], "School Supplies": [] };
let n = 0, kept = 0;
console.log("Scanning for Kitchen + School Supplies...");
const rl = createInterface({ input: createReadStream(DATA), crlfDelay: Infinity });
let header = null;
for await (const line of rl) {
  if (!header) { header = csvSplit(line); continue; }
  n++;
  if (n % 300000 === 0) process.stdout.write(`  ${n.toLocaleString()}\r`);
  const c = csvSplit(line);
  if (c.length < 11) continue;
  const [asin, title, imgUrl, productURL, starsStr, reviewsStr, price, _lp, catIdStr] = c;
  const pregCat = CAT_MAP[parseInt(catIdStr, 10)];
  if (!pregCat) continue;
  const stars = parseFloat(starsStr) || 0;
  const reviews = parseInt(reviewsStr, 10) || 0;
  if (!title || !asin || !imgUrl || title.length < 8 || title.length > 200) continue;
  if (reviews < REVIEW_FLOOR) continue;
  buckets[pregCat].push({ asin, title, imgUrl, productURL, stars, reviews, price: parseFloat(price) || null });
  kept++;
}
console.log(`\nScanned ${n.toLocaleString()}, kept ${kept}\n`);
console.log(`  Kitchen:         ${buckets["Kitchen"].length}`);
console.log(`  School Supplies: ${buckets["School Supplies"].length}\n`);

// Dedupe against existing DB
const existingSlugs = new Set();
const existingAsins = new Set();
for (let p = 0; p < 100; p++) {
  const { data } = await supa.from("products").select("slug, external_ids").range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  for (const r of data) {
    existingSlugs.add(r.slug);
    const a = r.external_ids?.asin;
    if (a) existingAsins.add(a);
  }
  if (data.length < 1000) break;
}
console.log(`Existing: ${existingSlugs.size} slugs, ${existingAsins.size} ASINs`);

const rows = []; const seen = new Set();
for (const [cat, list] of Object.entries(buckets)) {
  list.sort((a, b) => b.reviews - a.reviews);
  for (const p of list) {
    if (existingAsins.has(p.asin)) continue;
    const slug = slugify(p.title);
    if (!slug || existingSlugs.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    const dec = decayFromStars(p.stars);
    rows.push({
      slug, name: p.title.slice(0, 200), brand: extractBrand(p.title), category: cat,
      image_url: p.imgUrl,
      amazon_url: p.productURL || `https://www.amazon.com/dp/${p.asin}`,
      regret_score: regretFromStars(p.stars, p.reviews),
      would_buy_again_pct: wouldBuyFromStars(p.stars),
      is_ai_estimated: true, total_ratings: 0,
      avg_satisfaction_day30: dec.day30, avg_satisfaction_day60: dec.day60, avg_satisfaction_day90: dec.day90,
      top_regret_reasons: null,
      external_ids: {
        asin: p.asin, amazon_stars: String(p.stars), amazon_reviews: String(p.reviews),
        amazon_price_usd: p.price ? String(p.price) : "", amazon_img: p.imgUrl,
        source: "kaggle_ks_2026",
      },
    });
  }
}
console.log(`\n${rows.length} new rows queued\n`);

let inserted = 0;
for (let i = 0; i < rows.length; i += 500) {
  const chunk = rows.slice(i, i + 500);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) { console.warn("  chunk err:", error.message); continue; }
  inserted += chunk.length;
  process.stdout.write(`  ${inserted}/${rows.length}\r`);
}
console.log(`\n✓ ${inserted} inserted\n`);

for (const cat of ["Kitchen", "School Supplies"]) {
  const { count } = await supa.from("products").select("id", { count: "exact", head: true }).eq("category", cat);
  console.log(`  ${cat}: ${count}`);
}
const { count: total } = await supa.from("products").select("id", { count: "exact", head: true });
console.log(`\nTotal: ${total.toLocaleString()}`);
