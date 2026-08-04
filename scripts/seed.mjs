#!/usr/bin/env node
/**
 * Seed the Pregret database with 50 products across 3 categories.
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * Usage:  node scripts/seed.mjs
 *         node scripts/seed.mjs --dry   # print JSON, no DB writes
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("No .env.local found — set SUPABASE env vars manually.");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dry = process.argv.includes("--dry");

if (!dry && (!url || !key)) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ── Slug helper ──────────────────────────────────────────────────────────────
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ── Product catalog ──────────────────────────────────────────────────────────
const PRODUCTS = [
  // ─── ELECTRONICS ─────────────────────────────────────────────────────────
  {
    name: "Peloton Bike+", brand: "Peloton", category: "Electronics",
    regret_score: 78, would_buy_again_pct: 24,
    avg_satisfaction_day30: 4.2, avg_satisfaction_day60: 2.8, avg_satisfaction_day90: 1.9,
    top_regret_reasons: [
      { reason: "Subscription cost adds up fast" },
      { reason: "Screen wobble on hard sprints" },
      { reason: "Resale value tanks quickly" },
    ],
  },
  {
    name: "Dyson V15 Detect", brand: "Dyson", category: "Electronics",
    regret_score: 31, would_buy_again_pct: 72,
    avg_satisfaction_day30: 4.6, avg_satisfaction_day60: 3.9, avg_satisfaction_day90: 3.5,
    top_regret_reasons: [
      { reason: "Battery life degrades within a year" },
      { reason: "Expensive replacement filters" },
      { reason: "Heavy for overhead cleaning" },
    ],
  },
  {
    name: "Apple AirPods Max", brand: "Apple", category: "Electronics",
    regret_score: 42, would_buy_again_pct: 61,
    avg_satisfaction_day30: 4.5, avg_satisfaction_day60: 3.8, avg_satisfaction_day90: 3.1,
    top_regret_reasons: [
      { reason: "No power button — drains in case" },
      { reason: "Condensation inside ear cups" },
      { reason: "Heavy for long listening sessions" },
    ],
  },
  {
    name: "Samsung Galaxy Z Fold 5", brand: "Samsung", category: "Electronics",
    regret_score: 55, would_buy_again_pct: 48,
    avg_satisfaction_day30: 4.7, avg_satisfaction_day60: 3.4, avg_satisfaction_day90: 2.6,
    top_regret_reasons: [
      { reason: "Screen crease gets more visible over time" },
      { reason: "Fragile — no real case protection for fold" },
      { reason: "Too heavy for one-hand use" },
    ],
  },
  {
    name: "iRobot Roomba j7+", brand: "iRobot", category: "Electronics",
    regret_score: 38, would_buy_again_pct: 65,
    avg_satisfaction_day30: 4.3, avg_satisfaction_day60: 3.7, avg_satisfaction_day90: 3.2,
    top_regret_reasons: [
      { reason: "Gets stuck on dark rugs" },
      { reason: "Auto-empty dock is loud" },
      { reason: "Mapping resets after firmware updates" },
    ],
  },
  {
    name: "Meta Quest 3", brand: "Meta", category: "Electronics",
    regret_score: 44, would_buy_again_pct: 58,
    avg_satisfaction_day30: 4.5, avg_satisfaction_day60: 3.5, avg_satisfaction_day90: 2.9,
    top_regret_reasons: [
      { reason: "Novelty wears off fast" },
      { reason: "Motion sickness in many games" },
      { reason: "Uncomfortable after 30 minutes" },
    ],
  },
  {
    name: "Sony WH-1000XM5", brand: "Sony", category: "Electronics",
    regret_score: 12, would_buy_again_pct: 93,
    avg_satisfaction_day30: 4.8, avg_satisfaction_day60: 4.7, avg_satisfaction_day90: 4.5,
    top_regret_reasons: [
      { reason: "No folding design for travel" },
      { reason: "Touch controls too sensitive" },
    ],
  },
  {
    name: "LG C3 65\" OLED TV", brand: "LG", category: "Electronics",
    regret_score: 8, would_buy_again_pct: 96,
    avg_satisfaction_day30: 4.9, avg_satisfaction_day60: 4.8, avg_satisfaction_day90: 4.7,
    top_regret_reasons: [
      { reason: "Burn-in worry with static content" },
    ],
  },
  {
    name: "Bose QuietComfort Ultra", brand: "Bose", category: "Electronics",
    regret_score: 18, would_buy_again_pct: 87,
    avg_satisfaction_day30: 4.7, avg_satisfaction_day60: 4.5, avg_satisfaction_day90: 4.2,
    top_regret_reasons: [
      { reason: "Ear tips fall out during workouts" },
      { reason: "Battery life shorter than advertised" },
    ],
  },
  {
    name: "Ring Video Doorbell Pro 2", brand: "Ring", category: "Electronics",
    regret_score: 52, would_buy_again_pct: 51,
    avg_satisfaction_day30: 4.1, avg_satisfaction_day60: 3.2, avg_satisfaction_day90: 2.5,
    top_regret_reasons: [
      { reason: "Requires subscription for useful features" },
      { reason: "False motion alerts constantly" },
      { reason: "WiFi disconnects in cold weather" },
    ],
  },
  {
    name: "DJI Mini 3 Pro", brand: "DJI", category: "Electronics",
    regret_score: 22, would_buy_again_pct: 82,
    avg_satisfaction_day30: 4.6, avg_satisfaction_day60: 4.4, avg_satisfaction_day90: 4.0,
    top_regret_reasons: [
      { reason: "Wind sensitivity at altitude" },
      { reason: "Prop guards make it heavier" },
    ],
  },
  {
    name: "Oura Ring Gen 3", brand: "Oura", category: "Electronics",
    regret_score: 61, would_buy_again_pct: 42,
    avg_satisfaction_day30: 4.3, avg_satisfaction_day60: 3.1, avg_satisfaction_day90: 2.3,
    top_regret_reasons: [
      { reason: "Subscription required after year one" },
      { reason: "Scratches easily" },
      { reason: "Heart rate less accurate than wrist wearables" },
    ],
  },
  {
    name: "Sonos Era 300", brand: "Sonos", category: "Electronics",
    regret_score: 25, would_buy_again_pct: 79,
    avg_satisfaction_day30: 4.5, avg_satisfaction_day60: 4.3, avg_satisfaction_day90: 3.9,
    top_regret_reasons: [
      { reason: "Spatial audio only on Apple Music and Amazon" },
      { reason: "Large footprint for a bookshelf speaker" },
    ],
  },
  {
    name: "GoPro Hero 12 Black", brand: "GoPro", category: "Electronics",
    regret_score: 35, would_buy_again_pct: 68,
    avg_satisfaction_day30: 4.4, avg_satisfaction_day60: 3.8, avg_satisfaction_day90: 3.3,
    top_regret_reasons: [
      { reason: "Overheats recording 4K in sun" },
      { reason: "Phone app is buggy" },
      { reason: "Battery life barely covers a ski run" },
    ],
  },
  {
    name: "Kindle Scribe", brand: "Amazon", category: "Electronics",
    regret_score: 47, would_buy_again_pct: 55,
    avg_satisfaction_day30: 4.2, avg_satisfaction_day60: 3.4, avg_satisfaction_day90: 2.8,
    top_regret_reasons: [
      { reason: "Handwriting recognition is slow" },
      { reason: "Can't write on Kindle books" },
      { reason: "Too big for one-hand reading" },
    ],
  },
  {
    name: "Anker 737 Power Bank", brand: "Anker", category: "Electronics",
    regret_score: 15, would_buy_again_pct: 89,
    avg_satisfaction_day30: 4.7, avg_satisfaction_day60: 4.6, avg_satisfaction_day90: 4.4,
    top_regret_reasons: [
      { reason: "Heavy for travel" },
    ],
  },

  // ─── KITCHEN ─────────────────────────────────────────────────────────────
  {
    name: "Instant Pot Duo 7-in-1", brand: "Instant Pot", category: "Kitchen",
    regret_score: 14, would_buy_again_pct: 92,
    avg_satisfaction_day30: 4.7, avg_satisfaction_day60: 4.6, avg_satisfaction_day90: 4.5,
    top_regret_reasons: [
      { reason: "Sealing ring absorbs smells" },
      { reason: "Learning curve for pressure cooking" },
    ],
  },
  {
    name: "Vitamix A3500", brand: "Vitamix", category: "Kitchen",
    regret_score: 9, would_buy_again_pct: 96,
    avg_satisfaction_day30: 4.9, avg_satisfaction_day60: 4.8, avg_satisfaction_day90: 4.7,
    top_regret_reasons: [
      { reason: "Loud at full speed" },
    ],
  },
  {
    name: "Ninja Creami", brand: "Ninja", category: "Kitchen",
    regret_score: 58, would_buy_again_pct: 45,
    avg_satisfaction_day30: 4.4, avg_satisfaction_day60: 3.2, avg_satisfaction_day90: 2.4,
    top_regret_reasons: [
      { reason: "Takes 24 hours to freeze each batch" },
      { reason: "Texture is icy without exact recipes" },
      { reason: "Novelty wears off in a month" },
    ],
  },
  {
    name: "KitchenAid Artisan Stand Mixer", brand: "KitchenAid", category: "Kitchen",
    regret_score: 11, would_buy_again_pct: 94,
    avg_satisfaction_day30: 4.8, avg_satisfaction_day60: 4.7, avg_satisfaction_day90: 4.6,
    top_regret_reasons: [
      { reason: "Very heavy — hard to move" },
    ],
  },
  {
    name: "SodaStream Art", brand: "SodaStream", category: "Kitchen",
    regret_score: 44, would_buy_again_pct: 58,
    avg_satisfaction_day30: 4.3, avg_satisfaction_day60: 3.5, avg_satisfaction_day90: 2.9,
    top_regret_reasons: [
      { reason: "CO2 canisters are expensive" },
      { reason: "Flavor syrups taste artificial" },
      { reason: "Carbonation weakens after a few months" },
    ],
  },
  {
    name: "Breville Barista Express", brand: "Breville", category: "Kitchen",
    regret_score: 28, would_buy_again_pct: 76,
    avg_satisfaction_day30: 4.5, avg_satisfaction_day60: 4.2, avg_satisfaction_day90: 3.7,
    top_regret_reasons: [
      { reason: "Steep learning curve for good espresso" },
      { reason: "Counter space hog" },
      { reason: "Grinder retention wastes beans" },
    ],
  },
  {
    name: "Ninja Foodi Air Fryer", brand: "Ninja", category: "Kitchen",
    regret_score: 19, would_buy_again_pct: 85,
    avg_satisfaction_day30: 4.6, avg_satisfaction_day60: 4.4, avg_satisfaction_day90: 4.1,
    top_regret_reasons: [
      { reason: "Basket coating chips after a few months" },
      { reason: "Smoky smell with fatty foods" },
    ],
  },
  {
    name: "Keurig K-Supreme Plus", brand: "Keurig", category: "Kitchen",
    regret_score: 53, would_buy_again_pct: 49,
    avg_satisfaction_day30: 4.0, avg_satisfaction_day60: 3.2, avg_satisfaction_day90: 2.5,
    top_regret_reasons: [
      { reason: "Pod waste — not environmentally friendly" },
      { reason: "Descaling required every 3 months" },
      { reason: "Coffee quality doesn't match pour-over" },
    ],
  },
  {
    name: "Nespresso Vertuo Next", brand: "Nespresso", category: "Kitchen",
    regret_score: 65, would_buy_again_pct: 38,
    avg_satisfaction_day30: 4.1, avg_satisfaction_day60: 2.8, avg_satisfaction_day90: 2.0,
    top_regret_reasons: [
      { reason: "Machine stops reading pods — common defect" },
      { reason: "Locked into proprietary pods" },
      { reason: "Red/orange light errors within months" },
    ],
  },
  {
    name: "Lodge Cast Iron Skillet 12\"", brand: "Lodge", category: "Kitchen",
    regret_score: 5, would_buy_again_pct: 98,
    avg_satisfaction_day30: 4.8, avg_satisfaction_day60: 4.9, avg_satisfaction_day90: 4.9,
    top_regret_reasons: [
      { reason: "Heavy" },
    ],
  },
  {
    name: "Cuisinart Food Processor 14-Cup", brand: "Cuisinart", category: "Kitchen",
    regret_score: 16, would_buy_again_pct: 88,
    avg_satisfaction_day30: 4.6, avg_satisfaction_day60: 4.5, avg_satisfaction_day90: 4.3,
    top_regret_reasons: [
      { reason: "Lots of parts to wash" },
      { reason: "Large footprint" },
    ],
  },
  {
    name: "Ember Mug 2", brand: "Ember", category: "Kitchen",
    regret_score: 56, would_buy_again_pct: 46,
    avg_satisfaction_day30: 4.2, avg_satisfaction_day60: 3.3, avg_satisfaction_day90: 2.5,
    top_regret_reasons: [
      { reason: "Battery only lasts 80 minutes" },
      { reason: "Can't go in the dishwasher" },
      { reason: "Expensive for a mug" },
    ],
  },
  {
    name: "Thermomix TM6", brand: "Vorwerk", category: "Kitchen",
    regret_score: 41, would_buy_again_pct: 62,
    avg_satisfaction_day30: 4.4, avg_satisfaction_day60: 3.8, avg_satisfaction_day90: 3.2,
    top_regret_reasons: [
      { reason: "Requires WiFi subscription for recipes" },
      { reason: "Extremely expensive" },
      { reason: "MLM sales model feels pushy" },
    ],
  },
  {
    name: "Yeti Rambler 30oz Tumbler", brand: "Yeti", category: "Kitchen",
    regret_score: 7, would_buy_again_pct: 95,
    avg_satisfaction_day30: 4.8, avg_satisfaction_day60: 4.8, avg_satisfaction_day90: 4.7,
    top_regret_reasons: [
      { reason: "Doesn't fit most cup holders" },
    ],
  },
  {
    name: "Our Place Always Pan", brand: "Our Place", category: "Kitchen",
    regret_score: 49, would_buy_again_pct: 53,
    avg_satisfaction_day30: 4.3, avg_satisfaction_day60: 3.4, avg_satisfaction_day90: 2.7,
    top_regret_reasons: [
      { reason: "Non-stick coating wears off within a year" },
      { reason: "Handle gets hot" },
      { reason: "Not truly oven-safe as claimed" },
    ],
  },

  // ─── FITNESS ──────────────────────────────────────────────────────────────
  {
    name: "Theragun Elite", brand: "Therabody", category: "Fitness",
    regret_score: 63, would_buy_again_pct: 41,
    avg_satisfaction_day30: 4.4, avg_satisfaction_day60: 3.1, avg_satisfaction_day90: 2.3,
    top_regret_reasons: [
      { reason: "Generic $60 massage guns work just as well" },
      { reason: "Battery dies mid-session after 6 months" },
      { reason: "Loud despite marketing claims" },
    ],
  },
  {
    name: "Bowflex SelectTech 552 Dumbbells", brand: "Bowflex", category: "Fitness",
    regret_score: 24, would_buy_again_pct: 80,
    avg_satisfaction_day30: 4.5, avg_satisfaction_day60: 4.3, avg_satisfaction_day90: 3.9,
    top_regret_reasons: [
      { reason: "Dial mechanism feels fragile" },
      { reason: "Long/bulky shape at heavier weights" },
    ],
  },
  {
    name: "Mirror (by Lululemon)", brand: "Lululemon", category: "Fitness",
    regret_score: 82, would_buy_again_pct: 19,
    avg_satisfaction_day30: 3.8, avg_satisfaction_day60: 2.4, avg_satisfaction_day90: 1.6,
    top_regret_reasons: [
      { reason: "Subscription cancelled — now a giant mirror" },
      { reason: "Content quality declined rapidly" },
      { reason: "Zero resale value" },
    ],
  },
  {
    name: "NordicTrack Commercial 1750 Treadmill", brand: "NordicTrack", category: "Fitness",
    regret_score: 68, would_buy_again_pct: 34,
    avg_satisfaction_day30: 4.1, avg_satisfaction_day60: 2.9, avg_satisfaction_day90: 2.0,
    top_regret_reasons: [
      { reason: "iFIT subscription required for basic features" },
      { reason: "Service and parts nearly impossible to get" },
      { reason: "Becomes an expensive clothes rack" },
    ],
  },
  {
    name: "Whoop 4.0", brand: "Whoop", category: "Fitness",
    regret_score: 59, would_buy_again_pct: 44,
    avg_satisfaction_day30: 4.3, avg_satisfaction_day60: 3.2, avg_satisfaction_day90: 2.4,
    top_regret_reasons: [
      { reason: "Monthly subscription with no option to own" },
      { reason: "Apple Watch does 90% of the same thing" },
      { reason: "Strain coach advice is generic" },
    ],
  },
  {
    name: "Concept2 RowErg", brand: "Concept2", category: "Fitness",
    regret_score: 6, would_buy_again_pct: 97,
    avg_satisfaction_day30: 4.9, avg_satisfaction_day60: 4.8, avg_satisfaction_day90: 4.8,
    top_regret_reasons: [
      { reason: "Takes up a lot of floor space" },
    ],
  },
  {
    name: "Peloton Tread+", brand: "Peloton", category: "Fitness",
    regret_score: 74, would_buy_again_pct: 28,
    avg_satisfaction_day30: 4.0, avg_satisfaction_day60: 2.7, avg_satisfaction_day90: 1.8,
    top_regret_reasons: [
      { reason: "Safety recall killed confidence" },
      { reason: "$44/month on top of $4,000 machine" },
      { reason: "Too big for most home gyms" },
    ],
  },
  {
    name: "TRX Pro4 System", brand: "TRX", category: "Fitness",
    regret_score: 20, would_buy_again_pct: 84,
    avg_satisfaction_day30: 4.5, avg_satisfaction_day60: 4.3, avg_satisfaction_day90: 4.1,
    top_regret_reasons: [
      { reason: "Door anchor marks the door frame" },
      { reason: "Requires existing strength to use properly" },
    ],
  },
  {
    name: "Apple Watch Ultra 2", brand: "Apple", category: "Fitness",
    regret_score: 27, would_buy_again_pct: 77,
    avg_satisfaction_day30: 4.6, avg_satisfaction_day60: 4.3, avg_satisfaction_day90: 3.8,
    top_regret_reasons: [
      { reason: "Too bulky for smaller wrists" },
      { reason: "Most outdoor features unused by average buyer" },
      { reason: "Battery still only 2 days" },
    ],
  },
  {
    name: "Hydrow Rower", brand: "Hydrow", category: "Fitness",
    regret_score: 71, would_buy_again_pct: 31,
    avg_satisfaction_day30: 4.2, avg_satisfaction_day60: 2.8, avg_satisfaction_day90: 1.9,
    top_regret_reasons: [
      { reason: "Mandatory $44/month subscription" },
      { reason: "Concept2 is half the price and more durable" },
      { reason: "WiFi-dependent — no offline workouts" },
    ],
  },
  {
    name: "Garmin Forerunner 265", brand: "Garmin", category: "Fitness",
    regret_score: 10, would_buy_again_pct: 94,
    avg_satisfaction_day30: 4.8, avg_satisfaction_day60: 4.7, avg_satisfaction_day90: 4.6,
    top_regret_reasons: [
      { reason: "Touchscreen feels laggy" },
    ],
  },
  {
    name: "Lululemon Studio Mirror", brand: "Lululemon", category: "Fitness",
    regret_score: 85, would_buy_again_pct: 14,
    avg_satisfaction_day30: 3.5, avg_satisfaction_day60: 2.1, avg_satisfaction_day90: 1.4,
    top_regret_reasons: [
      { reason: "Lululemon killed the service — now e-waste" },
      { reason: "No refund or buyback offered" },
      { reason: "YouTube is free" },
    ],
  },
  {
    name: "REP Fitness PR-4000 Rack", brand: "REP Fitness", category: "Fitness",
    regret_score: 8, would_buy_again_pct: 95,
    avg_satisfaction_day30: 4.8, avg_satisfaction_day60: 4.8, avg_satisfaction_day90: 4.7,
    top_regret_reasons: [
      { reason: "Shipping is expensive and slow" },
    ],
  },
  {
    name: "Tempo Studio", brand: "Tempo", category: "Fitness",
    regret_score: 76, would_buy_again_pct: 26,
    avg_satisfaction_day30: 4.0, avg_satisfaction_day60: 2.6, avg_satisfaction_day90: 1.7,
    top_regret_reasons: [
      { reason: "Company folded — no more content updates" },
      { reason: "3D sensor was gimmicky" },
      { reason: "Resale value is zero" },
    ],
  },
  {
    name: "Hyperice Normatec 3 Legs", brand: "Hyperice", category: "Fitness",
    regret_score: 48, would_buy_again_pct: 54,
    avg_satisfaction_day30: 4.3, avg_satisfaction_day60: 3.5, avg_satisfaction_day90: 2.8,
    top_regret_reasons: [
      { reason: "Novelty wears off — sits in closet" },
      { reason: "Generic compression boots work similarly" },
      { reason: "Zipper quality is poor" },
    ],
  },
];

// ── Alternative links (slug pairs: regretted → suggested) ────────────────
const ALTERNATIVES = [
  ["peloton-bike", "concept2-rowerg"],
  ["peloton-tread", "concept2-rowerg"],
  ["mirror-by-lululemon", "trx-pro4-system"],
  ["lululemon-studio-mirror", "trx-pro4-system"],
  ["nordictrack-commercial-1750-treadmill", "concept2-rowerg"],
  ["hydrow-rower", "concept2-rowerg"],
  ["tempo-studio", "rep-fitness-pr-4000-rack"],
  ["theragun-elite", "trx-pro4-system"],
  ["nespresso-vertuo-next", "breville-barista-express"],
  ["keurig-k-supreme-plus", "breville-barista-express"],
  ["ninja-creami", "kitchenaid-artisan-stand-mixer"],
  ["ember-mug-2", "yeti-rambler-30oz-tumbler"],
  ["our-place-always-pan", "lodge-cast-iron-skillet-12"],
  ["sodastream-art", "yeti-rambler-30oz-tumbler"],
  ["oura-ring-gen-3", "garmin-forerunner-265"],
  ["whoop-40", "garmin-forerunner-265"],
  ["ring-video-doorbell-pro-2", "dji-mini-3-pro"],
  ["apple-airpods-max", "sony-wh-1000xm5"],
  ["kindle-scribe", "lg-c3-65-oled-tv"],
  ["samsung-galaxy-z-fold-5", "anker-737-power-bank"],
];

// ── Seed logic ───────────────────────────────────────────────────────────────
async function seed() {
  const products = PRODUCTS.map((p) => ({
    slug: slugify(p.name),
    name: p.name,
    brand: p.brand,
    category: p.category,
    image_url: null,
    amazon_url: null,
    regret_score: p.regret_score,
    would_buy_again_pct: p.would_buy_again_pct,
    is_ai_estimated: true,
    total_ratings: 0,
    avg_satisfaction_day30: p.avg_satisfaction_day30,
    avg_satisfaction_day60: p.avg_satisfaction_day60,
    avg_satisfaction_day90: p.avg_satisfaction_day90,
    top_regret_reasons: p.top_regret_reasons,
  }));

  if (dry) {
    console.log(JSON.stringify(products, null, 2));
    console.log(`\n${products.length} products (dry run — no DB writes)`);
    return;
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Upsert products
  console.log(`Seeding ${products.length} products...`);
  const { data: inserted, error: prodErr } = await supabase
    .from("products")
    .upsert(products, { onConflict: "slug" })
    .select("id, slug");

  if (prodErr) {
    console.error("Product insert error:", prodErr.message);
    process.exit(1);
  }

  console.log(`  ✓ ${inserted.length} products upserted`);

  // Build slug→id map
  const slugMap = Object.fromEntries(inserted.map((r) => [r.slug, r.id]));

  // Insert alternatives
  const altRows = [];
  for (const [fromSlug, toSlug] of ALTERNATIVES) {
    const fromId = slugMap[fromSlug];
    const toId = slugMap[toSlug];
    if (fromId && toId) {
      altRows.push({
        product_id: fromId,
        alternative_product_id: toId,
        switch_count: Math.floor(Math.random() * 50) + 5,
        source: "ai_suggested",
      });
    } else {
      console.warn(`  ⚠ Skipped alt: ${fromSlug} → ${toSlug} (slug not found)`);
    }
  }

  if (altRows.length) {
    const { error: altErr } = await supabase
      .from("product_alternatives")
      .upsert(altRows, { onConflict: "product_id,alternative_product_id" });

    if (altErr) {
      console.error("Alternatives insert error:", altErr.message);
    } else {
      console.log(`  ✓ ${altRows.length} alternatives linked`);
    }
  }

  console.log("\nDone! Visit your site to see the seeded products.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
