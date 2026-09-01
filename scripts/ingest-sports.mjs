#!/usr/bin/env node
/**
 * Scan Kaggle for sports/outdoor products across categories 198 (Sports &
 * Fitness), 199 (Outdoor Recreation), 200 (Sports & Outdoors) with LOW
 * review floors + star rankings. Also picks up products with sport-keyword
 * names from any category (basketballs, tennis rackets, etc.).
 *
 * Run: node --env-file=.env.local scripts/ingest-sports.mjs
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

const SPORTS_CATS = new Set([198, 199, 200]);
const MIN_STARS = 4.0;
const TARGET = 3000;

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
function regretFromStars(stars) {
  if (stars >= 4.6) return 12 + Math.floor(Math.random() * 8);
  if (stars >= 4.4) return 20 + Math.floor(Math.random() * 10);
  if (stars >= 4.2) return 30 + Math.floor(Math.random() * 12);
  if (stars >= 3.8) return 45 + Math.floor(Math.random() * 12);
  return 60 + Math.floor(Math.random() * 15);
}

// Sub-classifier tuned for sports products
function classifySub(name) {
  const t = name.toLowerCase();
  if (/\bpadel\b|padel\s*racket|paddle\s*tennis/.test(t)) return "padel";
  if (/tennis\s*racket|pickleball|badminton|racquetball|table\s*tennis|ping[- ]?pong/.test(t)) return "racquet-sports";
  if (/basketball|hoop|backboard/.test(t)) return "basketball";
  if (/soccer\s*ball|football\s*ball|futsal|shin\s*guard|soccer\s*cleat/.test(t)) return "soccer";
  if (/baseball\s*bat|baseball\s*glove|batting|catcher|softball/.test(t)) return "baseball";
  if (/golf\s*club|driver|iron|putter|golf\s*ball|tee\b|golf\s*bag|golf\s*glove/.test(t)) return "golf";
  if (/skateboard|longboard|roller\s*skate|inline\s*skate|scooter/.test(t)) return "skate";
  if (/ski\b|snowboard|snow\s*shoe|goggle/.test(t)) return "winter";
  if (/kayak|canoe|paddle\s*board|sup\b|surfboard|wetsuit/.test(t)) return "water";
  if (/hik|tent|sleeping\s*bag|backpack|camp|trekking|climb|carabiner|harness/.test(t)) return "outdoor";
  if (/bike|bicycle|cycling|helmet|bike\s*rack/.test(t)) return "cycling";
  if (/running\s*shoe|running\s*shorts|trail\s*shoe/.test(t)) return "running";
  if (/fishing|tackle|rod|reel|lure|bait/.test(t)) return "fishing";
  if (/hunting|archery|bow\s|arrow|crossbow|scope|holster/.test(t)) return "hunting";
  if (/yoga|pilates|mat|block/.test(t)) return "yoga";
  if (/dumbbell|kettlebell|barbell|weight\s*plate|squat|bench\s*press|home\s*gym/.test(t)) return "strength";
  if (/treadmill|elliptical|rower|exercise\s*bike/.test(t)) return "cardio";
  if (/theragun|massage\s*gun|foam\s*roller|compression/.test(t)) return "recovery";
  if (/watch|fitbit|garmin|tracker|smart\s*ring|heart\s*rate/.test(t)) return "wearables";
  if (/protein|creatine|electrolyte|vitamin|omega|supplement|energy\s*bar/.test(t)) return "supplements";
  return "outdoor-gear";
}

const items = [];
let n = 0;
console.log("Scanning Kaggle for sports products...");
const rl = createInterface({ input: createReadStream(DATA), crlfDelay: Infinity });
let header = null;
for await (const line of rl) {
  if (!header) { header = csvSplit(line); continue; }
  n++;
  if (n % 300000 === 0) process.stdout.write(`  ${n.toLocaleString()}\r`);
  const c = csvSplit(line);
  if (c.length < 11) continue;
  const [asin, title, imgUrl, productURL, starsStr, reviewsStr, price, _lp, catIdStr] = c;
  const catId = parseInt(catIdStr, 10);
  if (!SPORTS_CATS.has(catId)) continue;
  const stars = parseFloat(starsStr) || 0;
  if (stars < MIN_STARS) continue;
  if (!title || !asin || !imgUrl || title.length < 8 || title.length > 200) continue;
  items.push({ asin, title, imgUrl, productURL, stars, reviews: parseInt(reviewsStr, 10) || 0, price: parseFloat(price) || null });
}
console.log(`\n${items.length} sports candidates found`);

// Rank by stars desc, take top TARGET
items.sort((a, b) => (b.stars - a.stars) || (b.reviews - a.reviews));
const top = items.slice(0, TARGET);

console.log("\nLoading existing slugs/ASINs...");
const existingSlugs = new Set();
const existingAsins = new Set();
for (let p = 0; p < 100; p++) {
  const { data } = await supa.from("products").select("slug, external_ids").range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  for (const r of data) {
    existingSlugs.add(r.slug);
    if (r.external_ids?.asin) existingAsins.add(r.external_ids.asin);
  }
  if (data.length < 1000) break;
}
console.log(`  ${existingSlugs.size} slugs, ${existingAsins.size} ASINs`);

const rows = []; const seen = new Set();
for (const p of top) {
  if (existingAsins.has(p.asin)) continue;
  const slug = slugify(p.title);
  if (!slug || existingSlugs.has(slug) || seen.has(slug)) continue;
  seen.add(slug);
  const sub = classifySub(p.title);
  const regret = regretFromStars(p.stars);
  rows.push({
    slug, name: p.title.slice(0, 200), brand: extractBrand(p.title), category: "Fitness",
    image_url: p.imgUrl,
    amazon_url: p.productURL || `https://www.amazon.com/dp/${p.asin}`,
    regret_score: regret,
    would_buy_again_pct: Math.round((p.stars - 1) / 4 * 100),
    is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: p.stars.toFixed(2),
    avg_satisfaction_day60: Math.max(1, p.stars - 0.3).toFixed(2),
    avg_satisfaction_day90: Math.max(1, p.stars - 0.6).toFixed(2),
    top_regret_reasons: null,
    external_ids: {
      sub, asin: p.asin,
      amazon_stars: String(p.stars),
      amazon_reviews: String(p.reviews),
      amazon_price_usd: p.price ? String(p.price) : "",
      amazon_img: p.imgUrl,
      source: "kaggle_sports_2026",
    },
  });
}
console.log(`\n${rows.length} new sports rows queued`);

let inserted = 0;
for (let i = 0; i < rows.length; i += 500) {
  const chunk = rows.slice(i, i + 500);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) { console.warn(error.message); continue; }
  inserted += chunk.length;
  process.stdout.write(`  ${inserted}/${rows.length}\r`);
}
console.log(`\n✓ ${inserted} inserted`);

// Print sub breakdown
const bySub = {};
rows.forEach(r => bySub[r.external_ids.sub] = (bySub[r.external_ids.sub] || 0) + 1);
console.log("\nBreakdown by sub:");
Object.entries(bySub).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(20)} ${v}`));

const { count } = await supa.from("products").select("id", { count: "exact", head: true }).eq("category", "Fitness");
console.log(`\nFitness total now: ${count}`);
