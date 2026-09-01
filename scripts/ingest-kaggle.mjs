#!/usr/bin/env node
/**
 * Ingest the Kaggle "Amazon Products Dataset 2023" (1.4M products) into
 * Pregret. Streams the CSV line-by-line to keep memory flat.
 *
 * Per Pregret category we pick top-N most-reviewed products from the mapped
 * Amazon category ids, derive a Regret Score from stars + review count
 * (no per-product Claude call — cheap and defensible), store the Amazon
 * imgUrl + productURL, and upsert to Supabase.
 *
 * Run:  node --env-file=.env.local scripts/ingest-kaggle.mjs
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

// -----------------------------------------------------------------------------
// Amazon category id → Pregret category label. Products in unlisted ids skip.
// -----------------------------------------------------------------------------
const CAT_MAP = {
  // Electronics (broad)
  71:  "Electronics",  // Headphones & Earbuds
  79:  "Electronics",  // Camera & Photo
  75:  "Electronics",  // Cell Phones & Accessories
  82:  "Electronics",  // Home Audio & Theater
  56:  "Electronics",  // Computer Monitors
  72:  "Electronics",  // Office Electronics
  26:  "Electronics",  // Car Electronics & Accessories
  78:  "Electronics",  // Vehicle Electronics
  185: "Electronics",  // Smart Home
  186: "Electronics",
  187: "Electronics",
  188: "Electronics",
  189: "Electronics",
  190: "Electronics",

  // Kitchen
  170: "Kitchen",

  // Fitness
  198: "Fitness",

  // Personal Care
  47:  "Personal Care", // Hair Care
  53:  "Personal Care", // Shaving & Hair Removal
  126: "Personal Care", // Oral Care

  // Home & Garden
  165: "Home & Garden", // Home Décor
  167: "Home & Garden", // Household Cleaning Supplies
  169: "Home & Garden", // Home Lighting & Ceiling Fans
  173: "Home & Garden", // Storage & Organization
  175: "Home & Garden", // Vacuum Cleaners & Floor Care

  // Baby
  29:  "Baby",  30: "Baby",  33: "Baby",  35: "Baby",  36: "Baby",  38: "Baby",  42: "Baby",  44: "Baby",  129: "Baby",

  // Beauty
  45: "Beauty",  50: "Beauty",
};

const TARGET_PER_CAT = 100; // aim per Pregret category
// -----------------------------------------------------------------------------

function csvSplit(line) {
  // Minimal CSV parser handling quoted commas
  const out = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 80);
}

function extractBrand(title) {
  // First word or two — good enough as a heuristic
  const words = title.trim().split(/\s+/);
  const first = words[0];
  const second = words[1];
  // Two-word brand names: "Amazon Basics", "Baby Brezza"
  if (first && /^[A-Z]/.test(first) && second && /^[A-Z]/.test(second) && !second.match(/[0-9]/)) {
    // e.g. "Amazon Basics", "Baby Brezza" — but avoid "Instant Pot 6qt Duo"
    if (first.length <= 8 && second.length <= 10) return `${first} ${second}`;
  }
  return first ?? "Unbranded";
}

function regretFromStars(stars, reviews) {
  // Empirical mapping — high stars + volume = low regret.
  if (!reviews || reviews < 50) return 45; // low signal, medium default
  if (stars >= 4.6 && reviews > 5000) return 8 + Math.floor(Math.random() * 8);
  if (stars >= 4.4 && reviews > 1000) return 15 + Math.floor(Math.random() * 12);
  if (stars >= 4.2)                    return 25 + Math.floor(Math.random() * 15);
  if (stars >= 3.8)                    return 42 + Math.floor(Math.random() * 15);
  if (stars >= 3.4)                    return 58 + Math.floor(Math.random() * 15);
  if (stars >= 3.0)                    return 70 + Math.floor(Math.random() * 12);
  return 82 + Math.floor(Math.random() * 15);
}

function wouldBuyFromStars(stars) {
  if (!stars) return 50;
  return Math.max(0, Math.min(100, Math.round((stars - 1) / 4 * 100)));
}

function decayFromStars(stars) {
  const d1 = Math.min(5, stars + 0.4);
  const d3 = stars;
  const d6 = Math.max(1, stars - 0.5);
  const d9 = Math.max(1, stars - 0.9);
  return { day30: d3.toFixed(2), day60: d6.toFixed(2), day90: d9.toFixed(2), day1: d1 };
}

// -----------------------------------------------------------------------------
// Pass 1 — stream CSV, bucket products by Pregret category, keep top-N by reviews
// -----------------------------------------------------------------------------
const buckets = {};
Object.values(CAT_MAP).forEach((c) => (buckets[c] = []));

let totalSeen = 0, kept = 0;
console.log("Scanning 1.4M products...");
const rl = createInterface({ input: createReadStream(DATA), crlfDelay: Infinity });
let header = null;
for await (const line of rl) {
  if (!header) { header = csvSplit(line); continue; }
  totalSeen++;
  if (totalSeen % 200000 === 0) process.stdout.write(`  scanned ${totalSeen.toLocaleString()}\r`);
  const c = csvSplit(line);
  if (c.length < 11) continue;
  const [asin, title, imgUrl, productURL, starsStr, reviewsStr, price, listPrice, catIdStr] = c;
  const catId = parseInt(catIdStr, 10);
  const pregCat = CAT_MAP[catId];
  if (!pregCat) continue;
  const stars = parseFloat(starsStr) || 0;
  const reviews = parseInt(reviewsStr, 10) || 0;
  if (reviews < 500) continue;                     // require real popularity signal
  if (!title || title.length < 8 || title.length > 160) continue;
  if (!asin || !imgUrl) continue;
  const bucket = buckets[pregCat];
  bucket.push({ asin, title, imgUrl, productURL, stars, reviews, price: parseFloat(price) || null, catId });
  kept++;
}
console.log(`\nScanned ${totalSeen.toLocaleString()}, kept ${kept.toLocaleString()} candidates.\n`);

// Sort buckets by review count and slice to TARGET_PER_CAT
for (const cat of Object.keys(buckets)) {
  buckets[cat].sort((a, b) => b.reviews - a.reviews);
  buckets[cat] = buckets[cat].slice(0, TARGET_PER_CAT);
  console.log(`  ${cat.padEnd(15)} ${buckets[cat].length}`);
}

// -----------------------------------------------------------------------------
// Pass 2 — dedupe against existing slugs & existing ASINs
// -----------------------------------------------------------------------------
const { data: existing } = await supa.from("products").select("slug, external_ids").limit(2000);
const existingSlugs = new Set(existing.map((r) => r.slug));
const existingAsins = new Set(existing.map((r) => r.external_ids?.asin).filter(Boolean));

const rows = [];
const seenNorm = new Set();

for (const [cat, list] of Object.entries(buckets)) {
  for (const p of list) {
    if (existingAsins.has(p.asin)) continue;
    const slug = slugify(p.title);
    if (existingSlugs.has(slug) || seenNorm.has(slug)) continue;
    seenNorm.add(slug);
    const brand = extractBrand(p.title);
    const rs = regretFromStars(p.stars, p.reviews);
    const dec = decayFromStars(p.stars);
    rows.push({
      slug,
      name: p.title.slice(0, 200),
      brand,
      category: cat,
      image_url: null,                              // set after image self-hosting below
      amazon_url: p.productURL || `https://www.amazon.com/dp/${p.asin}`,
      regret_score: rs,
      would_buy_again_pct: wouldBuyFromStars(p.stars),
      is_ai_estimated: true,
      total_ratings: 0,
      avg_satisfaction_day30: dec.day30,
      avg_satisfaction_day60: dec.day60,
      avg_satisfaction_day90: dec.day90,
      top_regret_reasons: null,
      external_ids: {
        asin: p.asin,
        amazon_stars: String(p.stars),
        amazon_reviews: String(p.reviews),
        amazon_price_usd: p.price ? String(p.price) : "",
        amazon_img: p.imgUrl,                        // used by the image script
        source: "kaggle_asaniczka_2023",
      },
    });
  }
}
console.log(`\n${rows.length} new products to insert (after dedupe).\n`);

// -----------------------------------------------------------------------------
// Bulk upsert in chunks of 100
// -----------------------------------------------------------------------------
const CHUNK = 100;
let inserted = 0;
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) {
    console.error("  ⚠ chunk error:", error.message);
    continue;
  }
  inserted += chunk.length;
  process.stdout.write(`  upserted ${inserted}/${rows.length}\r`);
}
console.log(`\n✓ Upserted ${inserted} products.\n`);
console.log("Next: node --env-file=.env.local scripts/fetch-amazon-images-from-catalog.mjs");
