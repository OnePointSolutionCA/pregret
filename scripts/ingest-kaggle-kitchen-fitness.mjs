#!/usr/bin/env node
/**
 * Follow-up pass — Kitchen + Fitness came back empty from the main ingest
 * because their leaf-category IDs have looser review distributions. Rerun
 * with a lower review floor and broader category set for just those two.
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
  201: "Kitchen",  // Home Appliances (includes small kitchen appliances)
  198: "Fitness",
  199: "Fitness",  // Outdoor Recreation
  200: "Fitness",  // Sports & Outdoors
};

const REVIEW_FLOOR = 200; // looser than the 500 used for the wider run
const TARGET_PER_CAT = 100;

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
  if (!reviews || reviews < 50) return 45;
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

const buckets = { Kitchen: [], Fitness: [] };
console.log("Scanning for Kitchen + Fitness...");
const rl = createInterface({ input: createReadStream(DATA), crlfDelay: Infinity });
let header = null, n = 0;
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
  if (reviews < REVIEW_FLOOR) continue;
  if (!title || !asin || !imgUrl || title.length < 8 || title.length > 160) continue;
  buckets[pregCat].push({ asin, title, imgUrl, productURL, stars, reviews, price: parseFloat(price) || null });
}
console.log(`\n${buckets.Kitchen.length} kitchen, ${buckets.Fitness.length} fitness candidates.\n`);

for (const k of Object.keys(buckets)) {
  buckets[k].sort((a, b) => b.reviews - a.reviews);
  buckets[k] = buckets[k].slice(0, TARGET_PER_CAT);
}

const { data: existing } = await supa.from("products").select("slug, external_ids").limit(4000);
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
      image_url: null, amazon_url: p.productURL || `https://www.amazon.com/dp/${p.asin}`,
      regret_score: regretFromStars(p.stars, p.reviews),
      would_buy_again_pct: wouldBuyFromStars(p.stars),
      is_ai_estimated: true, total_ratings: 0,
      avg_satisfaction_day30: dec.day30, avg_satisfaction_day60: dec.day60, avg_satisfaction_day90: dec.day90,
      top_regret_reasons: null,
      external_ids: {
        asin: p.asin, amazon_stars: String(p.stars), amazon_reviews: String(p.reviews),
        amazon_price_usd: p.price ? String(p.price) : "", amazon_img: p.imgUrl,
        source: "kaggle_asaniczka_2023",
      },
    });
  }
}
console.log(`Inserting ${rows.length} new products...`);
for (let i = 0; i < rows.length; i += 100) {
  const chunk = rows.slice(i, i + 100);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) console.warn("chunk err:", error.message);
}
console.log(`✓ Done`);
