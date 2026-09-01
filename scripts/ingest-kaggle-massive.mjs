#!/usr/bin/env node
/**
 * Third pass over the Kaggle Asaniczka 1.4M dataset. Target ~10,000 products.
 *   - Same expanded category map as ingest-kaggle-expanded.mjs
 *   - Review floor 50 (down from 150 → 4x more candidates)
 *   - Target 2000 per Pregret category (up from 300)
 *   - Cross-reference existing curated products with the dataset to backfill
 *     real /dp/ASIN URLs where possible (fixes "search page" complaints)
 *
 * Run:  node --env-file=.env.local scripts/ingest-kaggle-massive.mjs
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
  56: "Electronics", 57: "Electronics", 58: "Electronics", 60: "Electronics", 63: "Electronics",
  64: "Electronics", 65: "Electronics", 66: "Electronics", 68: "Electronics", 69: "Electronics",
  70: "Electronics", 71: "Electronics", 72: "Electronics", 73: "Electronics", 74: "Electronics",
  75: "Electronics", 76: "Electronics", 77: "Electronics", 78: "Electronics", 79: "Electronics",
  80: "Electronics", 81: "Electronics", 82: "Electronics", 83: "Electronics", 26: "Electronics",
  149: "Electronics", 185: "Electronics", 186: "Electronics", 187: "Electronics", 188: "Electronics",
  189: "Electronics", 190: "Electronics", 191: "Electronics", 192: "Electronics", 194: "Electronics",
  196: "Electronics", 197: "Electronics", 222: "Electronics", 255: "Electronics", 256: "Electronics",
  259: "Electronics", 260: "Electronics", 261: "Electronics", 262: "Electronics", 263: "Electronics",

  170: "Kitchen", 201: "Kitchen",
  198: "Fitness", 199: "Fitness", 200: "Fitness", 132: "Fitness", 136: "Fitness",
  47: "Personal Care", 52: "Personal Care", 53: "Personal Care", 126: "Personal Care",
  128: "Personal Care", 131: "Personal Care",
  163: "Home & Garden", 164: "Home & Garden", 165: "Home & Garden", 166: "Home & Garden",
  167: "Home & Garden", 168: "Home & Garden", 169: "Home & Garden", 171: "Home & Garden",
  173: "Home & Garden", 174: "Home & Garden", 175: "Home & Garden", 176: "Home & Garden",
  195: "Home & Garden", 203: "Home & Garden", 204: "Home & Garden", 205: "Home & Garden",
  206: "Home & Garden", 207: "Home & Garden", 208: "Home & Garden", 209: "Home & Garden",
  210: "Home & Garden", 211: "Home & Garden", 212: "Home & Garden", 213: "Home & Garden",
  215: "Home & Garden", 130: "Home & Garden", 151: "Home & Garden",
  29: "Baby", 30: "Baby", 32: "Baby", 33: "Baby", 35: "Baby", 36: "Baby", 38: "Baby", 39: "Baby",
  41: "Baby", 42: "Baby", 43: "Baby", 44: "Baby", 124: "Baby", 129: "Baby", 172: "Baby",
  216: "Baby", 217: "Baby", 218: "Baby", 220: "Baby", 221: "Baby", 223: "Baby", 224: "Baby",
  227: "Baby", 229: "Baby", 230: "Baby", 264: "Baby", 265: "Baby",
  45: "Beauty", 46: "Beauty", 48: "Beauty", 49: "Beauty", 50: "Beauty", 51: "Beauty",
  // School Supplies
  137: "School Supplies", // Stationery
};

const REVIEW_FLOOR = 50;
const TARGET_PER_CAT = 2000;

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
  return { day30: (s).toFixed(2), day60: Math.max(1, s - 0.5).toFixed(2), day90: Math.max(1, s - 0.9).toFixed(2) };
}
function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

// ---- Pass 1: bucket + index by normalized title for ASIN backfill ----
const buckets = {};
Object.values(CAT_MAP).forEach((c) => (buckets[c] = []));
const titleIndex = new Map(); // normalized title -> {asin, imgUrl, productURL}

let n = 0, kept = 0;
console.log("Scanning 1.4M products (massive)...");
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
  const stars = parseFloat(starsStr) || 0;
  const reviews = parseInt(reviewsStr, 10) || 0;
  if (!title || !asin || !imgUrl || title.length < 8 || title.length > 200) continue;
  // Build title index (limited to popular products to keep memory tight)
  if (reviews > 100) {
    const nt = normalizeTitle(title);
    if (!titleIndex.has(nt)) titleIndex.set(nt, { asin, imgUrl, productURL });
  }
  if (!pregCat) continue;
  if (reviews < REVIEW_FLOOR) continue;
  buckets[pregCat].push({ asin, title, imgUrl, productURL, stars, reviews, price: parseFloat(price) || null });
  kept++;
}
console.log(`\nScanned ${n.toLocaleString()}, ${kept.toLocaleString()} candidates, title index: ${titleIndex.size}\n`);

for (const [cat, list] of Object.entries(buckets)) {
  list.sort((a, b) => b.reviews - a.reviews);
  buckets[cat] = list.slice(0, TARGET_PER_CAT);
  console.log(`  ${cat.padEnd(15)} ${buckets[cat].length}`);
}

// ---- Pass 2: dedupe against DB ----
const existing = [];
for (let p = 0; p < 20; p++) {
  const { data } = await supa.from("products").select("slug, name, external_ids").range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  existing.push(...data);
  if (data.length < 1000) break;
}
const existingSlugs = new Set(existing.map((r) => r.slug));
const existingAsins = new Set(existing.map((r) => r.external_ids?.asin).filter(Boolean));

const rows = []; const seen = new Set();
for (const [cat, list] of Object.entries(buckets)) {
  for (const p of list) {
    if (existingAsins.has(p.asin)) continue;
    const slug = slugify(p.title);
    if (existingSlugs.has(slug) || seen.has(slug)) continue;
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
        source: "kaggle_massive_2026",
      },
    });
  }
}
console.log(`\n${rows.length} new to insert.`);

// Insert in chunks of 200
let inserted = 0;
for (let i = 0; i < rows.length; i += 200) {
  const chunk = rows.slice(i, i + 200);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) { console.warn("  chunk err:", error.message); continue; }
  inserted += chunk.length;
  process.stdout.write(`  ${inserted}/${rows.length}\r`);
}
console.log(`\n✓ ${inserted} inserted.\n`);

// ---- Pass 3: backfill real ASINs on existing search-URL products ----
console.log("Backfilling curated products with real ASINs from dataset...");
let fixed = 0;
for (const p of existing) {
  const ext = p.external_ids ?? {};
  if (ext.source?.startsWith("kaggle")) continue;   // already real Kaggle products
  const nt = normalizeTitle(p.name);
  // Try full match first, then substring
  let match = titleIndex.get(nt);
  if (!match) {
    for (const [key, val] of titleIndex) {
      if (key.includes(nt) || nt.includes(key)) { match = val; break; }
    }
  }
  if (!match) continue;
  await supa.from("products").update({
    amazon_url: match.productURL || `https://www.amazon.com/dp/${match.asin}`,
    image_url: match.imgUrl,
    external_ids: { ...ext, asin: match.asin, amazon_img: match.imgUrl, backfilled: "kaggle_massive_2026" },
  }).eq("slug", p.slug);
  fixed++;
}
console.log(`✓ ${fixed} curated products backfilled with real ASINs`);
