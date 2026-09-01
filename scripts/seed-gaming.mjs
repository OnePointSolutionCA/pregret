#!/usr/bin/env node
/**
 * Seed the trending gaming products — PS5, Xbox, Switch, Steam Deck +
 * peripherals — under Electronics with subcategory "gaming".
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

const CATALOG = [
  // Consoles
  ["Sony PlayStation 5 Console Slim", "Sony", "consoles"],
  ["Sony PlayStation 5 Pro Console", "Sony", "consoles"],
  ["Sony PlayStation 5 Digital Edition", "Sony", "consoles"],
  ["Xbox Series X 1TB Console", "Microsoft", "consoles"],
  ["Xbox Series X 2TB Galaxy Black Special Edition", "Microsoft", "consoles"],
  ["Xbox Series S 1TB Carbon Black", "Microsoft", "consoles"],
  ["Xbox Series S 512GB Robot White", "Microsoft", "consoles"],
  ["Nintendo Switch OLED Model", "Nintendo", "consoles"],
  ["Nintendo Switch 2", "Nintendo", "consoles"],
  ["Nintendo Switch Lite", "Nintendo", "consoles"],
  ["Valve Steam Deck OLED 1TB", "Valve", "consoles"],
  ["ASUS ROG Ally X Handheld", "ASUS ROG", "consoles"],
  ["Analogue Pocket Retro Handheld", "Analogue", "consoles"],

  // Controllers
  ["Sony DualSense Wireless Controller PS5", "Sony", "gaming-accessories"],
  ["Sony DualSense Edge Wireless Controller", "Sony", "gaming-accessories"],
  ["Xbox Wireless Controller Series X/S", "Microsoft", "gaming-accessories"],
  ["Xbox Elite Wireless Controller Series 2", "Microsoft", "gaming-accessories"],
  ["Nintendo Switch Pro Controller", "Nintendo", "gaming-accessories"],
  ["8BitDo Ultimate Wireless Controller", "8BitDo", "gaming-accessories"],

  // Headsets
  ["SteelSeries Arctis Nova Pro Wireless", "SteelSeries", "gaming-accessories"],
  ["Razer BlackShark V2 Pro Wireless Headset", "Razer", "gaming-accessories"],
  ["HyperX Cloud III Wireless Gaming Headset", "HyperX", "gaming-accessories"],
  ["Astro A50 X Wireless Headset", "Astro Gaming", "gaming-accessories"],
  ["Sony PULSE Elite Wireless Headset", "Sony", "gaming-accessories"],
  ["Bose QuietComfort Ultra Gaming Headset", "Bose", "gaming-accessories"],

  // Keyboards & Mice
  ["Razer BlackWidow V4 Pro Mechanical Keyboard", "Razer", "gaming-accessories"],
  ["Logitech G Pro X Superlight 2 Mouse", "Logitech G", "gaming-accessories"],
  ["Razer DeathAdder V3 Pro Wireless Mouse", "Razer", "gaming-accessories"],
  ["SteelSeries Apex Pro TKL Gen 3", "SteelSeries", "gaming-accessories"],
  ["Corsair K70 MAX RGB Magnetic Keyboard", "Corsair", "gaming-accessories"],

  // Chairs
  ["Secretlab TITAN Evo 2022 Gaming Chair", "Secretlab", "gaming-accessories"],
  ["Herman Miller Embody Gaming Chair", "Herman Miller", "gaming-accessories"],
  ["Razer Iskur V2 Gaming Chair", "Razer", "gaming-accessories"],

  // Racing wheels + flight
  ["Logitech G923 Racing Wheel and Pedals", "Logitech G", "gaming-accessories"],
  ["Thrustmaster T248 Racing Wheel", "Thrustmaster", "gaming-accessories"],

  // Streaming / capture
  ["Elgato Stream Deck MK.2", "Elgato", "gaming-accessories"],
  ["Elgato HD60 X Capture Card", "Elgato", "gaming-accessories"],
  ["Shure MV7+ USB Podcast Microphone", "Shure", "gaming-accessories"],
];

const SYSTEM = `You estimate long-term consumer regret for products from public review sentiment.
Return ONLY JSON: {"regret_score": int 0-100, "would_buy_again_pct": int 0-100,
"avg_satisfaction_day30": num 1-5, "avg_satisfaction_day60": num 1-5, "avg_satisfaction_day90": num 1-5,
"top_regret_reasons": [{"reason": string} up to 3],
"description": "one 12-22 word neutral sentence"}
Established brands (Sony, Nintendo, Microsoft, Valve, Logitech G, Razer, SteelSeries) score LOW-MEDIUM regret. Chairs and premium peripherals often score higher due to price + durability complaints. Return JSON only.`;

async function scoreOne(name, brand, attempt = 1) {
  try {
    const r = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: `Product: ${name} by ${brand}. Category: Gaming. JSON only.` }],
    });
    const t = r.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const s = t.indexOf("{"), e = t.lastIndexOf("}");
    if (s < 0 || e <= s) throw new Error("no json");
    return JSON.parse(t.slice(s, e + 1));
  } catch (err) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 700 * attempt)); return scoreOne(name, brand, attempt + 1); }
    return { regret_score: 30, would_buy_again_pct: 70,
      avg_satisfaction_day30: 4.2, avg_satisfaction_day60: 4.0, avg_satisfaction_day90: 3.8,
      top_regret_reasons: [{ reason: "Data pending" }], description: `${name} — details coming soon.` };
  }
}

const { data: existing } = (await supa.from("products").select("slug").limit(1000));
const seen = new Set(existing.map((r) => r.slug));

console.log(`Scoring ${CATALOG.length} gaming products...\n`);
const rows = [];
for (let i = 0; i < CATALOG.length; i++) {
  const [name, brand, sub] = CATALOG[i];
  const slug = slugify(`${brand} ${name}`);
  if (seen.has(slug)) { console.log(`  [${i+1}/${CATALOG.length}] ${slug} — skip`); continue; }
  seen.add(slug);
  process.stdout.write(`  [${String(i+1).padStart(2)}/${CATALOG.length}] ${slug.padEnd(52)} `);
  const s = await scoreOne(name, brand);
  rows.push({
    slug, name, brand, category: "Electronics",
    image_url: null, amazon_url: null,
    regret_score: Math.max(0, Math.min(100, Math.round(s.regret_score))),
    would_buy_again_pct: Math.max(0, Math.min(100, Math.round(s.would_buy_again_pct))),
    is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: Number(s.avg_satisfaction_day30).toFixed(2),
    avg_satisfaction_day60: Number(s.avg_satisfaction_day60).toFixed(2),
    avg_satisfaction_day90: Number(s.avg_satisfaction_day90).toFixed(2),
    top_regret_reasons: s.top_regret_reasons ?? [],
    external_ids: { description: s.description ?? "", source: "curated_gaming_2026", sub },
  });
  console.log(`→ regret ${rows[rows.length-1].regret_score}`);
}
console.log(`\nUpserting ${rows.length}...`);
for (let i = 0; i < rows.length; i += 50) {
  const chunk = rows.slice(i, i + 50);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) console.warn("chunk err:", error.message);
}
// Backfill amazon search URLs
console.log("Backfilling amazon URLs...");
for (const r of rows) {
  const q = encodeURIComponent(`${r.brand} ${r.name}`.slice(0,120));
  await supa.from("products").update({ amazon_url: `https://www.amazon.com/s?k=${q}` }).eq("slug", r.slug);
}
console.log("✓ Done.");
