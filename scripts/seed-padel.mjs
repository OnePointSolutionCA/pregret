#!/usr/bin/env node
/**
 * Seed ~30 curated padel products. Category = Fitness, sub = padel.
 * Covers paddles (racquets), balls, bags, shoes, court gear from the
 * brands that dominate the padel market (Bullpadel, Nox, HEAD, Babolat,
 * Wilson, Adidas, Siux, Vibor-A).
 *
 * Run: node --env-file=.env.local scripts/seed-padel.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
const search = (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;

// name, brand, regret, loved% — regret leans low for most padel gear (satisfies enthusiasts)
const PRODUCTS = [
  // ---- Paddles / racquets ----
  ["Bullpadel Vertex 04 Comfort Padel Racquet", "Bullpadel", 18, 85],
  ["Bullpadel Hack 03 Padel Racquet", "Bullpadel", 22, 82],
  ["Nox AT10 Genius 18K By Agustin Tapia Padel Racket", "Nox", 15, 88],
  ["Nox ML10 Pro Cup Padel Racket", "Nox", 20, 84],
  ["Nox Equation Padel Racket", "Nox", 25, 78],
  ["HEAD Delta Motion Padel Racquet", "HEAD", 20, 82],
  ["HEAD Extreme Motion Padel Racket", "HEAD", 22, 80],
  ["HEAD Gravity Motion Padel Racket", "HEAD", 24, 78],
  ["Babolat Technical Viper Padel Racket", "Babolat", 20, 82],
  ["Babolat Air Veron Padel Racket", "Babolat", 25, 78],
  ["Babolat Counter Vertuo Padel Racket", "Babolat", 30, 74],
  ["Wilson Bela Pro V2.5 Padel Racket", "Wilson", 22, 81],
  ["Wilson Blade Pro Padel Racket", "Wilson", 25, 78],
  ["Adidas Metalbone 3.3 Padel Racket", "Adidas", 18, 85],
  ["Adidas Adipower Multiweight CTRL Padel Racket", "Adidas", 20, 83],
  ["Siux Electra ST3 Stupa Padel Racket", "Siux", 24, 79],
  ["Siux Diablo Grafeno Padel Racket", "Siux", 28, 75],
  ["StarVie R9.5 Aluminium Soft Padel Racket", "StarVie", 26, 76],

  // ---- Balls ----
  ["HEAD Padel Pro S Balls (Tube of 3)", "HEAD", 15, 88],
  ["Bullpadel Premium Padel Balls (Tube of 3)", "Bullpadel", 18, 85],
  ["Wilson X3 Speed Padel Balls (Tube of 3)", "Wilson", 20, 83],
  ["Babolat Tour Padel Balls (Tube of 3)", "Babolat", 22, 81],

  // ---- Bags ----
  ["Bullpadel BPP-24004 Vertex Padel Racket Bag", "Bullpadel", 20, 82],
  ["Nox Pro Series Padel Racket Bag", "Nox", 22, 80],
  ["HEAD Tour Team Padel Bag", "HEAD", 25, 78],
  ["Babolat RH X 12 Team Padel Bag", "Babolat", 28, 75],

  // ---- Shoes ----
  ["Bullpadel Comfort Pro Padel Shoes", "Bullpadel", 25, 78],
  ["Adidas Adipower Padel Shoes", "Adidas", 20, 84],
  ["Nike Court Air Zoom Vapor Cage 4 Rafa Padel", "Nike", 30, 74],
  ["Asics Gel-Padel Pro 5 GS Padel Shoes", "Asics", 22, 82],

  // ---- Accessories ----
  ["HEAD Padel Wristband (Pair)", "HEAD", 25, 78],
  ["Bullpadel Overgrip 3-Pack Padel Grip", "Bullpadel", 15, 90],
  ["Nox Anti-Vibration Padel Racket Protector", "Nox", 20, 84],
];

const rows = PRODUCTS.map(([name, brand, regret, loved]) => {
  const slug = slugify(name);
  // Satisfaction decay tuned to regret score
  const initSat = ((100 - regret) / 25).toFixed(2);
  const d90 = Math.max(1, (parseFloat(initSat) - 0.6)).toFixed(2);
  const d60 = Math.max(1, (parseFloat(initSat) - 0.3)).toFixed(2);
  return {
    slug,
    name,
    brand,
    category: "Fitness",
    image_url: null, // will be backfilled to placeholder or via Bing later
    amazon_url: search(name),
    regret_score: regret,
    would_buy_again_pct: loved,
    is_ai_estimated: true,
    total_ratings: 0,
    avg_satisfaction_day30: initSat,
    avg_satisfaction_day60: d60,
    avg_satisfaction_day90: d90,
    top_regret_reasons: null,
    external_ids: {
      sub: "padel",
      source: "curated_padel_2026",
    },
  };
});

console.log(`Seeding ${rows.length} padel products...`);
const { error } = await supa.from("products").upsert(rows, { onConflict: "slug" });
if (error) {
  console.error("insert failed:", error.message);
  process.exit(1);
}
console.log(`✓ Inserted ${rows.length} padel products`);
const { count } = await supa.from("products").select("id", { count: "exact", head: true }).eq("external_ids->>sub", "padel");
console.log(`Fitness/padel now: ${count}`);
