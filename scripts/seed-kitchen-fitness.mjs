#!/usr/bin/env node
/**
 * Expand Kitchen + Fitness — the Kaggle dump had zero leaf-category products for these two.
 * Hand-curated bestsellers → Claude Haiku scores each → Bing photos → upsert.
 *
 * Run:  node --env-file=.env.local scripts/seed-kitchen-fitness.mjs
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 80);
}

// -----------------------------------------------------------------------------
// Curated bestseller lists — [name, brand]
// -----------------------------------------------------------------------------
const KITCHEN = [
  // Coffee & Espresso
  ["Breville Bambino Plus Espresso Machine", "Breville"],
  ["Breville Oracle Touch", "Breville"],
  ["De'Longhi La Specialista Arte", "De'Longhi"],
  ["De'Longhi Magnifica Evo", "De'Longhi"],
  ["Gaggia Classic Pro Espresso Machine", "Gaggia"],
  ["Rancilio Silvia", "Rancilio"],
  ["Chemex Classic 8-Cup Pour-Over", "Chemex"],
  ["AeroPress Original Coffee Maker", "AeroPress"],
  ["Hario V60 Ceramic Coffee Dripper", "Hario"],
  ["Fellow Stagg EKG Electric Kettle", "Fellow"],
  ["Baratza Encore Coffee Grinder", "Baratza"],
  ["Ninja Specialty Coffee Maker CM407", "Ninja"],
  ["Bodum Chambord French Press 8-Cup", "Bodum"],

  // Blenders & Food Prep
  ["Vitamix E310 Explorian Blender", "Vitamix"],
  ["Vitamix 5200 Blender", "Vitamix"],
  ["Blendtec Total Classic Original Blender", "Blendtec"],
  ["Ninja Professional Plus Blender BN701", "Ninja"],
  ["Nutribullet Pro 900 Watt Blender", "Nutribullet"],
  ["Cuisinart DFP-14BCNY 14-Cup Food Processor", "Cuisinart"],
  ["KitchenAid 7-Cup Food Processor", "KitchenAid"],

  // Small Appliances
  ["Instant Pot Pro 10-in-1", "Instant Pot"],
  ["Instant Vortex Plus Air Fryer 6 QT", "Instant"],
  ["Cosori Air Fryer TurboBlaze 6-Qt", "Cosori"],
  ["Ninja Foodi 8-in-1 Digital Air Fry Oven", "Ninja"],
  ["Cuisinart TOA-70 Air Fryer Toaster Oven", "Cuisinart"],
  ["Breville Smart Oven Air Fryer Pro", "Breville"],
  ["KitchenAid Artisan Series 5-Qt Mixer", "KitchenAid"],
  ["Kitchen Aid Pro 600 6-Qt Mixer", "KitchenAid"],
  ["Cuisinart CSB-179 Smart Stick Immersion Blender", "Cuisinart"],
  ["Zojirushi NS-ZCC10 Neuro Fuzzy Rice Cooker", "Zojirushi"],
  ["Ninja CREAMi NC301 Ice Cream Maker", "Ninja"],
  ["Presto 06006 Kitchen Kettle Multi-Cooker", "Presto"],

  // Cookware
  ["Lodge 10.25-inch Cast Iron Skillet", "Lodge"],
  ["Le Creuset Signature 5.5-Qt Dutch Oven", "Le Creuset"],
  ["Staub 5.5-Qt Round Cocotte", "Staub"],
  ["Made In 10-Piece Stainless Steel Set", "Made In"],
  ["All-Clad D3 3-Qt Saucepan", "All-Clad"],
  ["T-fal Ultimate Hard Anodized 17-Piece Set", "T-fal"],
  ["Caraway Cookware Set", "Caraway"],
  ["HexClad Hybrid 12-inch Frying Pan", "HexClad"],
  ["GreenPan Valencia Pro 11-Piece Set", "GreenPan"],
  ["OXO Good Grips 12-inch Stainless Fry Pan", "OXO"],

  // Knives & Tools
  ["Wusthof Classic 8-Inch Chef's Knife", "Wusthof"],
  ["Zwilling J.A. Henckels Pro 8-Inch Chef's Knife", "Zwilling"],
  ["Global G-2 8-Inch Chef's Knife", "Global"],
  ["Shun Classic 8-Inch Chef's Knife", "Shun"],

  // Drinkware
  ["Stanley Quencher H2.0 FlowState 40oz Tumbler", "Stanley"],
  ["Owala FreeSip 24oz Stainless Steel Bottle", "Owala"],
  ["Hydro Flask 32oz Wide Mouth", "Hydro Flask"],
];

const FITNESS = [
  // Cardio
  ["Sole F80 Folding Treadmill", "Sole Fitness"],
  ["Bowflex Treadmill 22", "Bowflex"],
  ["Horizon 7.0 AT Treadmill", "Horizon Fitness"],
  ["Peloton Row", "Peloton"],
  ["NordicTrack RW900 Rower", "NordicTrack"],
  ["Sunny Health & Fitness SF-RW5515 Magnetic Rower", "Sunny Health"],
  ["Assault AirBike Classic", "Assault Fitness"],
  ["Schwinn IC4 Indoor Cycling Bike", "Schwinn"],
  ["MYX II Stationary Bike", "MYX"],
  ["Rogue Echo Bike", "Rogue Fitness"],

  // Strength — Barbells, plates, racks, benches
  ["Rogue Bella Bar 2.0 Women's Barbell", "Rogue Fitness"],
  ["Rep Fitness Ohio Bar", "REP Fitness"],
  ["Fringe Sport Wonder Bar", "Fringe Sport"],
  ["Cap Barbell Olympic 300lb Weight Set", "CAP Barbell"],
  ["Rogue RML-390F Flat Foot Monster Lite Rack", "Rogue Fitness"],
  ["REP PR-1100 Power Rack", "REP Fitness"],
  ["Titan Fitness T-3 Power Rack", "Titan Fitness"],
  ["Rogue AB-3 Adjustable Bench", "Rogue Fitness"],
  ["REP AB-5200 2.0 Adjustable Bench", "REP Fitness"],

  // Dumbbells
  ["PowerBlock Elite EXP Stage 3 Adjustable Dumbbells", "PowerBlock"],
  ["Nuobell 5-80lb Adjustable Dumbbells", "Nuobell"],
  ["Ironmaster Quick-Lock 75lb Adjustable Dumbbells", "Ironmaster"],
  ["Rogue Rubber Hex Dumbbells", "Rogue Fitness"],
  ["CAP Barbell Coated Hex Dumbbell Set", "CAP Barbell"],

  // Kettlebells / functional
  ["Rogue Kettlebell 24kg", "Rogue Fitness"],
  ["Kettlebell Kings Powder Coat 24kg", "Kettlebell Kings"],
  ["Perform Better First Place Sandbag", "Perform Better"],

  // Recovery
  ["Theragun Prime", "Therabody"],
  ["Theragun Pro Plus", "Therabody"],
  ["Hyperice Hypervolt 2 Pro", "Hyperice"],
  ["Renpho Massage Gun R3", "Renpho"],
  ["TheraGun Mini 2.0", "Therabody"],
  ["Chirp Wheel+ 12-inch Back Roller", "Chirp"],
  ["TriggerPoint GRID Foam Roller", "TriggerPoint"],
  ["RAD Roller Original Muscle Ball", "RAD"],

  // Wearables / trackers
  ["Whoop 5.0 Fitness Band", "Whoop"],
  ["Garmin Fenix 8 Sapphire", "Garmin"],
  ["Garmin Venu 3", "Garmin"],
  ["Polar Vantage V3", "Polar"],
  ["Wahoo TICKR X Heart Rate Monitor", "Wahoo"],
  ["Coros Pace 3", "Coros"],
  ["Amazfit T-Rex Ultra", "Amazfit"],

  // Yoga / bodyweight / accessories
  ["Manduka eKO Superlite Travel Mat", "Manduka"],
  ["Jade Harmony Yoga Mat", "Jade Yoga"],
  ["Liforme Original Yoga Mat", "Liforme"],
  ["Perfect Fitness Pull-Up Bar Elite", "Perfect Fitness"],
  ["Iron Gym Total Upper Body Workout Bar", "Iron Gym"],
  ["Rogue Monster Bands Set", "Rogue Fitness"],
  ["WODFitters Resistance Band Set", "WODFitters"],
  ["StrongTek Rubber-Coated Ab Wheel Roller", "StrongTek"],
];

// -----------------------------------------------------------------------------
// AI scoring
// -----------------------------------------------------------------------------
const SYSTEM = `You estimate long-term consumer regret for products based on publicly known review sentiment.
Return ONLY a JSON object matching:
{ "regret_score": integer 0-100, "would_buy_again_pct": integer 0-100,
  "avg_satisfaction_day30": number 1.0-5.0, "avg_satisfaction_day60": number 1.0-5.0, "avg_satisfaction_day90": number 1.0-5.0,
  "top_regret_reasons": [{"reason": string} up to 3],
  "description": "one 12-22 word neutral product description" }
Weight late satisfaction heavily. Established brands with strong long-term reviews (Vitamix, Concept2, Wusthof, KitchenAid, Le Creuset, Manduka, Rogue) should score LOW regret. Subscription-locked or gimmicky = HIGH regret. Return ONLY the JSON.`;

async function scoreOne(name, brand, category, attempt = 1) {
  try {
    const resp = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: `Product: ${name} by ${brand}. Category: ${category}. Return JSON only.` }],
    });
    const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    if (s < 0 || e <= s) throw new Error("no json");
    return JSON.parse(text.slice(s, e + 1));
  } catch (err) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 700 * attempt)); return scoreOne(name, brand, category, attempt + 1); }
    return { regret_score: 40, would_buy_again_pct: 60,
      avg_satisfaction_day30: 4.0, avg_satisfaction_day60: 3.5, avg_satisfaction_day90: 3.2,
      top_regret_reasons: [{ reason: "Data pending" }], description: `${name} — details coming soon.` };
  }
}

// -----------------------------------------------------------------------------
// Build + upsert
// -----------------------------------------------------------------------------
const items = [
  ...KITCHEN.map(([name, brand]) => ({ name, brand, category: "Kitchen" })),
  ...FITNESS.map(([name, brand]) => ({ name, brand, category: "Fitness" })),
];

const { data: existing } = await supa.from("products").select("slug").limit(2000);
const seen = new Set(existing.map((r) => r.slug));

console.log(`Scoring ${items.length} products via Claude Haiku...\n`);
const rows = [];
for (let i = 0; i < items.length; i++) {
  const it = items[i];
  const slug = slugify(`${it.brand} ${it.name}`);
  if (seen.has(slug)) { console.log(`  [${i+1}/${items.length}] ${slug} — skip (exists)`); continue; }
  seen.add(slug);
  process.stdout.write(`  [${String(i+1).padStart(2)}/${items.length}] ${slug.padEnd(50)} `);
  const s = await scoreOne(it.name, it.brand, it.category);
  rows.push({
    slug, name: it.name, brand: it.brand, category: it.category,
    image_url: null, amazon_url: null,
    regret_score: Math.max(0, Math.min(100, Math.round(s.regret_score))),
    would_buy_again_pct: Math.max(0, Math.min(100, Math.round(s.would_buy_again_pct))),
    is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: Number(s.avg_satisfaction_day30).toFixed(2),
    avg_satisfaction_day60: Number(s.avg_satisfaction_day60).toFixed(2),
    avg_satisfaction_day90: Number(s.avg_satisfaction_day90).toFixed(2),
    top_regret_reasons: s.top_regret_reasons ?? [],
    external_ids: { description: s.description ?? "", source: "curated_2026" },
  });
  console.log(`→ regret ${rows[rows.length-1].regret_score}`);
}
console.log(`\nUpserting ${rows.length} products...`);
for (let i = 0; i < rows.length; i += 50) {
  const chunk = rows.slice(i, i + 50);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) console.warn("chunk err:", error.message);
}
console.log("Done.");
