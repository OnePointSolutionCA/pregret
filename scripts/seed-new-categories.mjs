#!/usr/bin/env node
/**
 * Seed 4 new categories × 20 products each = 80 new products.
 * Uses Claude Haiku to generate the Regret Score, satisfaction decay, and top
 * regret reasons for each product. Cheap (~$0.30 total) and scriptable — you
 * can extend the PRODUCTS list and rerun to keep growing the catalog.
 *
 * Run:  node --env-file=.env.local scripts/seed-new-categories.mjs
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_SVC = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
if (!SUPA_URL || !SUPA_SVC || !CLAUDE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY");
  process.exit(1);
}

const supa = createClient(SUPA_URL, SUPA_SVC, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const claude = new Anthropic({ apiKey: CLAUDE_KEY });

// -----------------------------------------------------------------------------
// Hand-curated seed list: 20 products per new category. Slugs match those in
// src/lib/subcategories.ts PRODUCT_SUBCATEGORY.
// -----------------------------------------------------------------------------
const PRODUCTS = [
  // ---------- Personal Care (20) ----------
  ["Dyson Airwrap Complete", "Dyson", "Personal Care", "dyson-airwrap-complete"],
  ["Dyson Supersonic Hair Dryer", "Dyson", "Personal Care", "dyson-supersonic"],
  ["GHD Original Styler", "GHD", "Personal Care", "ghd-original-styler"],
  ["Shark FlexStyle", "Shark", "Personal Care", "shark-flexstyle"],
  ["Revlon One-Step Volumizer Plus", "Revlon", "Personal Care", "revlon-one-step-volumizer-plus"],
  ["T3 AireLuxe Hair Dryer", "T3", "Personal Care", "t3-aireluxe"],
  ["Braun Series 9 Pro Electric Shaver", "Braun", "Personal Care", "braun-series-9-pro"],
  ["Philips Norelco Shaver 9500", "Philips", "Personal Care", "philips-norelco-9500"],
  ["Panasonic Arc5 ES-LV97", "Panasonic", "Personal Care", "panasonic-arc5-es-lv97"],
  ["Manscaped Lawn Mower 5.0 Ultra", "Manscaped", "Personal Care", "manscaped-lawn-mower-5-ultra"],
  ["Wahl Beard Trimmer 9918", "Wahl", "Personal Care", "wahl-beard-trimmer-9918"],
  ["Oral-B iO Series 9", "Oral-B", "Personal Care", "oral-b-io-series-9"],
  ["Philips Sonicare DiamondClean Smart 9500", "Philips", "Personal Care", "philips-sonicare-diamondclean-smart-9500"],
  ["Waterpik Aquarius Water Flosser", "Waterpik", "Personal Care", "waterpik-aquarius-water-flosser"],
  ["Foreo Luna 3", "Foreo", "Personal Care", "foreo-luna-3"],
  ["NuFACE Trinity+ Facial Toning Device", "NuFACE", "Personal Care", "nuface-trinity-plus"],
  ["Solawave 4-in-1 Radiant Renewal Wand", "Solawave", "Personal Care", "solawave-4-in-1-wand"],
  ["TheraFace PRO", "Therabody", "Personal Care", "theraface-pro"],
  ["Braun Silk-expert Pro 5 IPL", "Braun", "Personal Care", "braun-silk-expert-pro-5-ipl"],
  ["Ulike Air 10 IPL Hair Removal", "Ulike", "Personal Care", "ulike-air-10-ipl"],

  // ---------- Home & Garden (20) ----------
  ["Shark Navigator Lift-Away Deluxe", "Shark", "Home & Garden", "shark-navigator-lift-away-deluxe"],
  ["Bissell CrossWave Pet Pro", "Bissell", "Home & Garden", "bissell-crosswave-pet-pro"],
  ["Bissell Little Green Portable Carpet Cleaner", "Bissell", "Home & Garden", "bissell-little-green-portable"],
  ["Shark Steam Pocket Mop", "Shark", "Home & Garden", "shark-steam-pocket-mop"],
  ["DeWalt DCF887B Impact Driver", "DeWalt", "Home & Garden", "dewalt-dcf887b-impact-driver"],
  ["Milwaukee M18 FUEL 2-Tool Combo", "Milwaukee", "Home & Garden", "milwaukee-m18-fuel-combo"],
  ["Makita XPH14Z Hammer Drill", "Makita", "Home & Garden", "makita-xph14z-hammer-drill"],
  ["Ryobi P1817 One+ Drill Kit", "Ryobi", "Home & Garden", "ryobi-p1817-one-plus-drill"],
  ["EGO Power+ 21-inch Push Mower", "EGO", "Home & Garden", "ego-power-plus-21-inch-mower"],
  ["Greenworks 40V 20-inch Lawn Mower", "Greenworks", "Home & Garden", "greenworks-40v-20-inch-mower"],
  ["Husqvarna Automower 315X", "Husqvarna", "Home & Garden", "husqvarna-automower-315x"],
  ["Weber Genesis II Gas Grill", "Weber", "Home & Garden", "weber-genesis-ii-grill"],
  ["Traeger Ironwood 885 Pellet Grill", "Traeger", "Home & Garden", "traeger-ironwood-885"],
  ["Ooni Koda 16 Gas Pizza Oven", "Ooni", "Home & Garden", "ooni-koda-16"],
  ["Nest Learning Thermostat (3rd Gen)", "Google Nest", "Home & Garden", "nest-learning-thermostat-3rd-gen"],
  ["Ecobee Smart Thermostat Premium", "Ecobee", "Home & Garden", "ecobee-smart-thermostat-premium"],
  ["Philips Hue Starter Kit", "Philips", "Home & Garden", "philips-hue-starter-kit"],
  ["Lutron Caseta Smart Dimmer Kit", "Lutron", "Home & Garden", "lutron-caseta-smart-dimmer-kit"],
  ["Simplehuman 55L Trash Can", "Simplehuman", "Home & Garden", "simplehuman-trash-can-55l"],
  ["The Container Store Elfa Shelving System", "The Container Store", "Home & Garden", "container-store-elfa-shelving"],

  // ---------- Baby (20) ----------
  ["UPPAbaby Vista V2 Stroller", "UPPAbaby", "Baby", "uppababy-vista-v2"],
  ["Bugaboo Fox 5 Stroller", "Bugaboo", "Baby", "bugaboo-fox-5"],
  ["Nuna Mixx Next Stroller", "Nuna", "Baby", "nuna-mixx-next"],
  ["Baby Jogger City Mini GT2", "Baby Jogger", "Baby", "baby-jogger-city-mini-gt2"],
  ["Doona Car Seat & Stroller", "Doona", "Baby", "doona-car-seat"],
  ["UPPAbaby Mesa V2 Infant Car Seat", "UPPAbaby", "Baby", "uppababy-mesa-v2"],
  ["Nuna PIPA RX Infant Car Seat", "Nuna", "Baby", "nuna-pipa-rx"],
  ["Britax Grow With You ClickTight Plus", "Britax", "Baby", "britax-grow-with-you"],
  ["Chicco Fit4 4-in-1 Convertible", "Chicco", "Baby", "chicco-fit4-4-in-1"],
  ["Owlet Dream Sock Baby Monitor", "Owlet", "Baby", "owlet-dream-sock"],
  ["Nanit Pro Smart Baby Monitor", "Nanit", "Baby", "nanit-pro-smart-monitor"],
  ["VTech VM819 Video Baby Monitor", "VTech", "Baby", "vtech-vm819-baby-monitor"],
  ["Baby Brezza Formula Pro Advanced", "Baby Brezza", "Baby", "baby-brezza-formula-pro-advanced"],
  ["Haakaa Silicone Breast Pump", "Haakaa", "Baby", "haakaa-silicone-breast-pump"],
  ["SNOO Smart Sleeper Bassinet", "Happiest Baby", "Baby", "snoo-smart-sleeper-bassinet"],
  ["4moms MamaRoo 5", "4moms", "Baby", "4moms-mamaroo-5"],
  ["Munchkin 59S UV LED Sterilizer", "Munchkin", "Baby", "munchkin-59s-uv-sanitizer"],
  ["Ubbi Steel Diaper Pail", "Ubbi", "Baby", "ubbi-diaper-pail"],
  ["BabyBjörn Baby Carrier Free", "BabyBjörn", "Baby", "babybjorn-baby-carrier-free"],
  ["Petunia Pickle Bottom Diaper Bag", "Petunia Pickle Bottom", "Baby", "petunia-pickle-bottom-diaper-bag"],

  // ---------- Beauty (20) ----------
  ["Charlotte Tilbury Magic Cream", "Charlotte Tilbury", "Beauty", "charlotte-tilbury-magic-cream"],
  ["La Mer Crème de la Mer", "La Mer", "Beauty", "la-mer-creme-de-la-mer"],
  ["Drunk Elephant Protini Polypeptide Cream", "Drunk Elephant", "Beauty", "drunk-elephant-protini"],
  ["SkinCeuticals C E Ferulic Serum", "SkinCeuticals", "Beauty", "skinceuticals-ce-ferulic"],
  ["Sunday Riley Good Genes Lactic Acid Treatment", "Sunday Riley", "Beauty", "sunday-riley-good-genes"],
  ["Rare Beauty Soft Pinch Liquid Blush", "Rare Beauty", "Beauty", "rare-beauty-soft-pinch-blush"],
  ["Fenty Beauty Pro Filt'r Soft Matte Foundation", "Fenty Beauty", "Beauty", "fenty-beauty-pro-filtr-foundation"],
  ["Charlotte Tilbury Pillow Talk Matte Revolution Lipstick", "Charlotte Tilbury", "Beauty", "charlotte-tilbury-pillow-talk-lipstick"],
  ["Pat McGrath Labs Mothership Eyeshadow Palette", "Pat McGrath Labs", "Beauty", "pat-mcgrath-mothership-palette"],
  ["Urban Decay Naked3 Eyeshadow Palette", "Urban Decay", "Beauty", "urban-decay-naked-palette"],
  ["Anastasia Beverly Hills Brow Wiz", "Anastasia Beverly Hills", "Beauty", "anastasia-brow-wiz"],
  ["Chanel N°5 Eau de Parfum", "Chanel", "Beauty", "chanel-no-5-eau-de-parfum"],
  ["Le Labo Santal 33", "Le Labo", "Beauty", "le-labo-santal-33"],
  ["Byredo Gypsy Water", "Byredo", "Beauty", "byredo-gypsy-water"],
  ["Maison Margiela Replica Jazz Club", "Maison Margiela", "Beauty", "maison-margiela-replica-jazz-club"],
  ["OPI Nail Lacquer", "OPI", "Beauty", "opi-nail-lacquer"],
  ["Essie Nail Polish", "Essie", "Beauty", "essie-nail-polish"],
  ["Nailtiques Formula 2 Nail Protein", "Nailtiques", "Beauty", "nailtiques-formula-2"],
  ["Beautyblender Original Sponge", "Beautyblender", "Beauty", "beautyblender-original-sponge"],
  ["Sigma Beauty F80 Flat Kabuki Brush", "Sigma Beauty", "Beauty", "sigma-beauty-f80-brush"],
];

// -----------------------------------------------------------------------------
// Claude scoring
// -----------------------------------------------------------------------------
const SYSTEM = `You estimate long-term consumer regret for products based on publicly known review sentiment.
Return ONLY a JSON object matching:
{
  "regret_score": integer 0-100,
  "would_buy_again_pct": integer 0-100,
  "avg_satisfaction_day30": number 1.0-5.0,
  "avg_satisfaction_day60": number 1.0-5.0,
  "avg_satisfaction_day90": number 1.0-5.0,
  "top_regret_reasons": [{"reason": string} up to 3]
}
Base your estimate on real review patterns (Amazon 1-3 star themes, Reddit sentiment, expert reviews).
Weight late-term satisfaction heavily: honeymoon reviews don't count.
Subscription-locked hardware, gimmicky products, and things that break after 6 months should have HIGH regret scores.
Products loved 90 days in (cast iron, Vitamix, Concept2, established brands) should have LOW regret scores.
The 3 satisfaction values should describe a realistic decay curve for that product.
Reasons should be short (<=10 words each), specific, and paraphrased from real complaints.
Return ONLY the JSON.`;

async function scoreProduct(name, brand, category, attempt = 1) {
  const prompt = `Product: ${name} by ${brand}. Category: ${category}. Estimate the Regret Score based on known review patterns. Return JSON only.`;
  try {
    const resp = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("no json");
    return JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 800 * attempt));
      return scoreProduct(name, brand, category, attempt + 1);
    }
    return {
      regret_score: 40,
      would_buy_again_pct: 60,
      avg_satisfaction_day30: 4.0,
      avg_satisfaction_day60: 3.5,
      avg_satisfaction_day90: 3.2,
      top_regret_reasons: [{ reason: "Needs owner ratings" }],
    };
  }
}

// -----------------------------------------------------------------------------
// Main — score all, then upsert in one call
// -----------------------------------------------------------------------------
console.log(`Scoring ${PRODUCTS.length} new products via Claude Haiku...\n`);
const rows = [];

for (let i = 0; i < PRODUCTS.length; i++) {
  const [name, brand, category, slug] = PRODUCTS[i];
  process.stdout.write(`  [${String(i + 1).padStart(2)}/${PRODUCTS.length}] ${slug.padEnd(45)} `);
  const s = await scoreProduct(name, brand, category);
  rows.push({
    slug,
    name,
    brand,
    category,
    image_url: null,
    amazon_url: null,
    regret_score: Math.max(0, Math.min(100, Math.round(s.regret_score))),
    would_buy_again_pct: Math.max(0, Math.min(100, Math.round(s.would_buy_again_pct))),
    is_ai_estimated: true,
    total_ratings: 0,
    avg_satisfaction_day30: Number(s.avg_satisfaction_day30).toFixed(2),
    avg_satisfaction_day60: Number(s.avg_satisfaction_day60).toFixed(2),
    avg_satisfaction_day90: Number(s.avg_satisfaction_day90).toFixed(2),
    top_regret_reasons: s.top_regret_reasons ?? [],
  });
  console.log(`→ regret ${rows[i].regret_score}, would-buy ${rows[i].would_buy_again_pct}%`);
}

console.log(`\nUpserting ${rows.length} rows...`);
const { data, error } = await supa.from("products").upsert(rows, { onConflict: "slug" }).select("id, slug, category");
if (error) {
  console.error("Insert error:", error);
  process.exit(1);
}
console.log(`✓ ${data.length} products upserted.`);

// Category summary
const byCat = {};
for (const r of data) (byCat[r.category] ??= []).push(r);
console.log("\nBy category:");
for (const [cat, list] of Object.entries(byCat)) console.log(`  ${cat.padEnd(15)} ${list.length}`);
console.log("\nDone. Run scripts/fetch-bing-images.mjs next to pull photos.");
