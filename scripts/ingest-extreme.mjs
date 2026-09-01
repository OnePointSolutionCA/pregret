#!/usr/bin/env node
/**
 * EXTREME ingest: push to ~200k products. Expands category map to cover
 * nearly every consumer category, lowers review floor to 1, and adds
 * new Pregret categories: Fashion, Automotive, Toys & Games, Pet Supplies,
 * Tools & Home Improvement, Arts & Crafts.
 *
 * Run:  node --env-file=.env.local scripts/ingest-extreme.mjs
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
  // Electronics (expanded)
  54: "Electronics", 55: "Electronics", 56: "Electronics", 57: "Electronics",
  58: "Electronics", 60: "Electronics", 63: "Electronics", 64: "Electronics",
  65: "Electronics", 66: "Electronics", 68: "Electronics", 69: "Electronics",
  70: "Electronics", 71: "Electronics", 72: "Electronics", 73: "Electronics",
  74: "Electronics", 75: "Electronics", 76: "Electronics", 77: "Electronics",
  78: "Electronics", 79: "Electronics", 80: "Electronics", 81: "Electronics",
  82: "Electronics", 83: "Electronics", 26: "Electronics", 149: "Electronics",
  185: "Electronics", 186: "Electronics", 187: "Electronics", 188: "Electronics",
  189: "Electronics", 190: "Electronics", 191: "Electronics", 192: "Electronics",
  193: "Electronics", 194: "Electronics", 196: "Electronics", 197: "Electronics",
  222: "Electronics",

  // Gaming (new category)
  255: "Gaming", 256: "Gaming", 259: "Gaming", 260: "Gaming",
  261: "Gaming", 262: "Gaming", 263: "Gaming",
  241: "Gaming", 242: "Gaming", 243: "Gaming", 244: "Gaming",
  245: "Gaming", 248: "Gaming", 249: "Gaming", 250: "Gaming",
  251: "Gaming", 252: "Gaming", 253: "Gaming", 254: "Gaming",

  // Kitchen
  170: "Kitchen", 201: "Kitchen", 156: "Kitchen",

  // Fitness & Sports
  198: "Fitness", 199: "Fitness", 200: "Fitness", 132: "Fitness", 136: "Fitness",
  228: "Fitness",

  // Personal Care & Health
  47: "Personal Care", 52: "Personal Care", 53: "Personal Care",
  126: "Personal Care", 127: "Personal Care", 128: "Personal Care",
  131: "Personal Care", 133: "Personal Care", 135: "Personal Care",

  // Home & Garden
  163: "Home & Garden", 164: "Home & Garden", 165: "Home & Garden",
  166: "Home & Garden", 167: "Home & Garden", 168: "Home & Garden",
  169: "Home & Garden", 171: "Home & Garden", 173: "Home & Garden",
  174: "Home & Garden", 175: "Home & Garden", 176: "Home & Garden",
  195: "Home & Garden", 130: "Home & Garden", 151: "Home & Garden",

  // Tools & Home Improvement (new category)
  203: "Tools & Home Improvement", 204: "Tools & Home Improvement",
  205: "Tools & Home Improvement", 206: "Tools & Home Improvement",
  207: "Tools & Home Improvement", 208: "Tools & Home Improvement",
  209: "Tools & Home Improvement", 210: "Tools & Home Improvement",
  211: "Tools & Home Improvement", 212: "Tools & Home Improvement",
  213: "Tools & Home Improvement", 214: "Tools & Home Improvement",
  215: "Tools & Home Improvement",

  // Baby
  29: "Baby", 30: "Baby", 31: "Baby", 32: "Baby", 33: "Baby", 34: "Baby",
  35: "Baby", 36: "Baby", 38: "Baby", 39: "Baby", 40: "Baby",
  41: "Baby", 42: "Baby", 43: "Baby", 44: "Baby",
  124: "Baby", 129: "Baby", 172: "Baby", 264: "Baby",

  // Beauty
  45: "Beauty", 46: "Beauty", 48: "Beauty", 49: "Beauty",
  50: "Beauty", 51: "Beauty",

  // Toys & Games (new category)
  216: "Toys & Games", 217: "Toys & Games", 218: "Toys & Games",
  219: "Toys & Games", 220: "Toys & Games", 221: "Toys & Games",
  223: "Toys & Games", 224: "Toys & Games", 225: "Toys & Games",
  226: "Toys & Games", 227: "Toys & Games", 229: "Toys & Games",
  230: "Toys & Games", 231: "Toys & Games", 232: "Toys & Games",
  233: "Toys & Games", 234: "Toys & Games", 235: "Toys & Games",
  236: "Toys & Games", 237: "Toys & Games", 238: "Toys & Games",
  239: "Toys & Games", 240: "Toys & Games", 270: "Toys & Games",

  // Pet Supplies (new category)
  178: "Pet Supplies", 179: "Pet Supplies", 180: "Pet Supplies",
  181: "Pet Supplies", 182: "Pet Supplies", 183: "Pet Supplies",
  184: "Pet Supplies",

  // Fashion (new category)
  84: "Fashion", 87: "Fashion", 88: "Fashion", 89: "Fashion", 90: "Fashion",
  91: "Fashion", 94: "Fashion", 95: "Fashion", 96: "Fashion", 97: "Fashion",
  98: "Fashion", 99: "Fashion", 100: "Fashion", 101: "Fashion", 102: "Fashion",
  103: "Fashion", 104: "Fashion", 105: "Fashion", 106: "Fashion", 107: "Fashion",
  108: "Fashion", 109: "Fashion", 110: "Fashion", 112: "Fashion", 113: "Fashion",
  114: "Fashion", 116: "Fashion", 118: "Fashion", 120: "Fashion", 121: "Fashion",
  122: "Fashion", 123: "Fashion", 265: "Fashion",

  // Automotive (new category)
  14: "Automotive", 15: "Automotive", 16: "Automotive", 17: "Automotive",
  18: "Automotive", 19: "Automotive", 20: "Automotive", 21: "Automotive",
  22: "Automotive", 23: "Automotive", 24: "Automotive", 25: "Automotive",
  27: "Automotive", 28: "Automotive",

  // Arts & Crafts (new category)
  1: "Arts & Crafts", 2: "Arts & Crafts", 3: "Arts & Crafts",
  4: "Arts & Crafts", 5: "Arts & Crafts", 6: "Arts & Crafts",
  7: "Arts & Crafts", 8: "Arts & Crafts", 9: "Arts & Crafts",
  10: "Arts & Crafts", 11: "Arts & Crafts", 12: "Arts & Crafts",

  // School Supplies
  137: "School Supplies",

  // Industrial (map to Tools)
  138: "Tools & Home Improvement", 140: "Tools & Home Improvement",
  141: "Tools & Home Improvement", 146: "Tools & Home Improvement",
  154: "Tools & Home Improvement",
};

const REVIEW_FLOOR = 1;
const TARGET_PER_CAT = 25000;

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
  if (!reviews || reviews < 5) return 45;
  if (stars >= 4.6 && reviews > 5000) return 8 + Math.floor(Math.random() * 8);
  if (stars >= 4.6 && reviews > 500)  return 12 + Math.floor(Math.random() * 10);
  if (stars >= 4.4 && reviews > 1000) return 15 + Math.floor(Math.random() * 12);
  if (stars >= 4.4)                    return 20 + Math.floor(Math.random() * 12);
  if (stars >= 4.2)                    return 25 + Math.floor(Math.random() * 15);
  if (stars >= 4.0)                    return 35 + Math.floor(Math.random() * 12);
  if (stars >= 3.8)                    return 42 + Math.floor(Math.random() * 15);
  if (stars >= 3.4)                    return 58 + Math.floor(Math.random() * 15);
  if (stars >= 3.0)                    return 70 + Math.floor(Math.random() * 12);
  return 82 + Math.floor(Math.random() * 15);
}
function wouldBuyFromStars(s) { return !s ? 50 : Math.max(0, Math.min(100, Math.round((s - 1) / 4 * 100))); }
function decayFromStars(s) {
  return { day30: s.toFixed(2), day60: Math.max(1, s - 0.5).toFixed(2), day90: Math.max(1, s - 0.9).toFixed(2) };
}

// ---- Pass 1: bucket ----
const buckets = {};
const allCats = new Set(Object.values(CAT_MAP));
allCats.forEach((c) => (buckets[c] = []));

let n = 0, kept = 0;
console.log("Scanning 1.4M products for EXTREME ingest...");
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
  if (!title || !asin || title.length < 8 || title.length > 200) continue;
  if (reviews < REVIEW_FLOOR) continue;
  const priceNum = parseFloat(price) || null;
  if (priceNum !== null && priceNum <= 0) continue;
  buckets[pregCat].push({ asin, title, imgUrl: imgUrl || "", productURL, stars, reviews, price: priceNum });
  kept++;
}
console.log(`\nScanned ${n.toLocaleString()}, ${kept.toLocaleString()} candidates\n`);

for (const [cat, list] of Object.entries(buckets)) {
  list.sort((a, b) => b.reviews - a.reviews);
  buckets[cat] = list.slice(0, TARGET_PER_CAT);
  console.log(`  ${cat.padEnd(25)} ${buckets[cat].length.toLocaleString()}`);
}

// ---- Pass 2: dedupe against DB ----
console.log("\nLoading existing slugs/ASINs from DB...");
const existingSlugs = new Set();
const existingAsins = new Set();
for (let p = 0; ; p++) {
  const { data } = await supa.from("products").select("slug, external_ids").range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  for (const r of data) {
    existingSlugs.add(r.slug);
    const a = r.external_ids?.asin;
    if (a) existingAsins.add(a);
  }
  if (data.length < 1000) break;
}
console.log(`  ${existingSlugs.size} existing slugs, ${existingAsins.size} existing ASINs`);

const rows = []; const seen = new Set();
for (const [cat, list] of Object.entries(buckets)) {
  for (const p of list) {
    if (existingAsins.has(p.asin)) continue;
    const slug = slugify(p.title);
    if (!slug || slug.length < 5 || existingSlugs.has(slug) || seen.has(slug)) continue;
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
        source: "kaggle_extreme_2026",
      },
    });
  }
}
console.log(`\n${rows.length.toLocaleString()} new rows queued for insert\n`);

// ---- Insert in chunks ----
let inserted = 0, errors = 0;
const CHUNK = 500;
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) { console.warn(`  chunk ${i} err:`, error.message); errors++; continue; }
  inserted += chunk.length;
  if (i % 5000 === 0 || i + CHUNK >= rows.length) process.stdout.write(`  ${inserted.toLocaleString()}/${rows.length.toLocaleString()} (${errors} errors)\r`);
}

console.log(`\n✓ ${inserted.toLocaleString()} inserted (${errors} chunk errors)\n`);

const { count } = await supa.from("products").select("id", { count: "exact", head: true });
console.log(`🚀 Total products now: ${count.toLocaleString()}`);
