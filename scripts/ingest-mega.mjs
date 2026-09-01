#!/usr/bin/env node
/**
 * MEGA ingest: maps ALL 270 Amazon categories, no per-category cap,
 * review floor = 1. Inserts everything not already in the DB.
 *
 * Run:  node --env-file=.env.local scripts/ingest-mega.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, "..", "data-cache", "amazon_products.csv");
const CATS_CSV = resolve(__dirname, "..", "data-cache", "amazon_categories.csv");

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Build complete category map from amazon_categories.csv + manual overrides
const CAT_MAP = {};
const catRL = createInterface({ input: createReadStream(CATS_CSV), crlfDelay: Infinity });
let catHeader = null;
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

// Amazon category name → Pregret category
function mapCategory(name) {
  const n = name.toLowerCase();
  if (n.includes("electronic") || n.includes("computer") || n.includes("phone") || n.includes("tablet") || n.includes("camera") || n.includes("wearable") || n.includes("gps") || n.includes("accessori") && (n.includes("cell") || n.includes("laptop"))) return "Electronics";
  if (n.includes("video game") || n.includes("playstation") || n.includes("xbox") || n.includes("nintendo") || n.includes("gaming")) return "Gaming";
  if (n.includes("kitchen") || n.includes("dining") || n.includes("coffee") || n.includes("cookware") || n.includes("bakeware")) return "Kitchen";
  if (n.includes("sport") || n.includes("fitness") || n.includes("exercise") || n.includes("outdoor") || n.includes("cycling") || n.includes("camping") || n.includes("hunting") || n.includes("fishing")) return "Fitness";
  if (n.includes("health") || n.includes("personal care") || n.includes("medical") || n.includes("vitamin") || n.includes("wellness")) return "Personal Care";
  if (n.includes("home") || n.includes("garden") || n.includes("patio") || n.includes("furniture") || n.includes("bedding") || n.includes("bath") || n.includes("storage") || n.includes("décor") || n.includes("decor") || n.includes("lighting") || n.includes("heating") || n.includes("vacuum") || n.includes("cleaning") || n.includes("laundry")) return "Home & Garden";
  if (n.includes("tool") || n.includes("hardware") || n.includes("power tool") || n.includes("hand tool") || n.includes("industrial") || n.includes("adhesive") || n.includes("abrasive") || n.includes("additive manufacturing") || n.includes("fixture") || n.includes("plumbing") || n.includes("electrical")) return "Tools & Home Improvement";
  if (n.includes("baby") || n.includes("nursery") || n.includes("stroller") || n.includes("diaper") || n.includes("feeding") || n.includes("toddler")) return "Baby";
  if (n.includes("beauty") || n.includes("makeup") || n.includes("skin care") || n.includes("hair care") || n.includes("fragrance") || n.includes("nail")) return "Beauty";
  if (n.includes("toy") || n.includes("game") || n.includes("puzzle") || n.includes("doll") || n.includes("action figure") || n.includes("building") || n.includes("pretend play") || n.includes("party") || n.includes("decoration")) return "Toys & Games";
  if (n.includes("pet") || n.includes("dog") || n.includes("cat") || n.includes("fish") || n.includes("bird") || n.includes("aquarium")) return "Pet Supplies";
  if (n.includes("fashion") || n.includes("clothing") || n.includes("shoe") || n.includes("jewelry") || n.includes("watch") || n.includes("handbag") || n.includes("luggage") || n.includes("sunglasses") || n.includes("uniform") || n.includes("men's") || n.includes("women's") || n.includes("girls'") || n.includes("boys'") || n.includes("boot") || n.includes("sneaker") || n.includes("wallet") || n.includes("backpack")) return "Fashion";
  if (n.includes("automotive") || n.includes("car") || n.includes("motorcycle") || n.includes("truck") || n.includes("vehicle") || n.includes("tire") || n.includes("oil") || n.includes("brake")) return "Automotive";
  if (n.includes("art") || n.includes("craft") || n.includes("sewing") || n.includes("knitting") || n.includes("painting") || n.includes("drawing") || n.includes("beading") || n.includes("scrapbooking")) return "Arts & Crafts";
  if (n.includes("school") || n.includes("office") || n.includes("stationery") || n.includes("pen") || n.includes("desk")) return "School Supplies";
  if (n.includes("grocery") || n.includes("food") || n.includes("beverage") || n.includes("snack")) return "Kitchen";
  return "Home & Garden"; // catch-all for misc
}

for await (const line of catRL) {
  const cols = csvSplit(line);
  if (!catHeader) { catHeader = cols; continue; }
  const id = parseInt(cols[0], 10);
  const name = cols[1] || "";
  if (!isNaN(id) && name) CAT_MAP[id] = mapCategory(name);
}
console.log(`Loaded ${Object.keys(CAT_MAP).length} category mappings\n`);

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

// ---- Scan CSV ----
const candidates = [];
let n = 0;
console.log("Scanning 1.4M products (NO caps, ALL categories)...");
const rl = createInterface({ input: createReadStream(DATA), crlfDelay: Infinity });
let header = null;
for await (const line of rl) {
  if (!header) { header = csvSplit(line); continue; }
  n++;
  if (n % 300000 === 0) process.stdout.write(`  ${n.toLocaleString()}\r`);
  const c = csvSplit(line);
  if (c.length < 9) continue;
  const [asin, title, imgUrl, productURL, starsStr, reviewsStr, price, _lp, catIdStr] = c;
  const catId = parseInt(catIdStr, 10);
  const pregCat = CAT_MAP[catId];
  if (!pregCat) continue;
  const stars = parseFloat(starsStr) || 0;
  const reviews = parseInt(reviewsStr, 10) || 0;
  if (!title || !asin || title.length < 5) continue;
  if (reviews < 1) continue;
  candidates.push({ asin, title: title.slice(0, 200), imgUrl: imgUrl || "", productURL, stars, reviews, price: parseFloat(price) || null, category: pregCat });
}
console.log(`\nScanned ${n.toLocaleString()}, ${candidates.length.toLocaleString()} candidates with 1+ reviews\n`);

// Category breakdown
const catCounts = {};
candidates.forEach(p => { catCounts[p.category] = (catCounts[p.category] || 0) + 1; });
Object.entries(catCounts).sort((a,b) => b[1]-a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat.padEnd(25)} ${count.toLocaleString()}`);
});

// ---- Dedupe against DB ----
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

// Sort by reviews desc so the best products get their slug first
candidates.sort((a, b) => b.reviews - a.reviews);

const rows = []; const seen = new Set();
for (const p of candidates) {
  if (existingAsins.has(p.asin)) continue;
  const slug = slugify(p.title);
  if (!slug || slug.length < 4 || existingSlugs.has(slug) || seen.has(slug)) continue;
  seen.add(slug);
  const dec = decayFromStars(p.stars);
  rows.push({
    slug, name: p.title, brand: extractBrand(p.title), category: p.category,
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
      source: "kaggle_mega_2026",
    },
  });
}
console.log(`\n${rows.length.toLocaleString()} new rows to insert\n`);

// ---- Insert ----
let inserted = 0, errors = 0;
const CHUNK = 500;
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) { console.warn(`  chunk ${i} err:`, error.message); errors++; continue; }
  inserted += chunk.length;
  if (i % 5000 === 0 || i + CHUNK >= rows.length) process.stdout.write(`  ${inserted.toLocaleString()}/${rows.length.toLocaleString()} (${errors} errors)\r`);
}

console.log(`\n\n✓ ${inserted.toLocaleString()} inserted (${errors} chunk errors)\n`);
const { count } = await supa.from("products").select("id", { count: "exact", head: true });
console.log(`🚀 Total products now: ${count.toLocaleString()}`);
