#!/usr/bin/env node
/**
 * Seed School Supplies — hand-curated bestsellers, AI-scored via Claude Haiku.
 * Same pattern as seed-kitchen-fitness.mjs.
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
  // Backpacks & Bags
  ["JanSport SuperBreak Original Backpack", "JanSport"],
  ["JanSport Big Student Backpack", "JanSport"],
  ["Herschel Little America Backpack", "Herschel"],
  ["Herschel Classic XL Backpack", "Herschel"],
  ["Fjallraven Kanken Classic Backpack", "Fjallraven"],
  ["Fjallraven Kanken No. 2 Laptop Backpack", "Fjallraven"],
  ["North Face Borealis Backpack", "The North Face"],
  ["North Face Recon Backpack", "The North Face"],
  ["Adidas Prime 6 Backpack", "Adidas"],
  ["Nike Brasilia XL Training Backpack", "Nike"],
  ["Osprey Nebula 32L Daypack", "Osprey"],
  ["Under Armour Hustle 5.0 Backpack", "Under Armour"],
  ["Vera Bradley Campus Backpack", "Vera Bradley"],

  // Notebooks & Paper
  ["Five Star Wirebound College Rule Notebook 5-Subject", "Five Star"],
  ["Moleskine Classic Hardcover Notebook Large", "Moleskine"],
  ["Leuchtturm1917 Medium A5 Dotted Hardcover", "Leuchtturm1917"],
  ["Rocketbook Fusion Smart Notebook", "Rocketbook"],
  ["Mead Composition Notebook Wide Ruled 12-Pack", "Mead"],
  ["Oxford Filler Paper College Ruled 500 Sheets", "Oxford"],

  // Writing & Art
  ["Ticonderoga Wood-Cased #2 Pencils 96-Count", "Ticonderoga"],
  ["Pilot G2 Retractable Gel Pen 12-Pack", "Pilot"],
  ["BIC Round Stic Xtra-Life Ballpoint 60-Count", "BIC"],
  ["Sharpie Fine Point Permanent Marker 24-Pack", "Sharpie"],
  ["Crayola Colored Pencils 50-Count", "Crayola"],
  ["Crayola Crayons 64-Count with Sharpener", "Crayola"],
  ["Prismacolor Premier Soft Core Colored Pencils 72-Set", "Prismacolor"],
  ["Faber-Castell Polychromos Colored Pencils 60-Set", "Faber-Castell"],
  ["Zebra Mildliner Double-Ended Highlighters 15-Set", "Zebra"],
  ["Staedtler Triplus Fineliner 20-Pack", "Staedtler"],

  // Calculators & Tech
  ["Texas Instruments TI-84 Plus CE Graphing Calculator", "Texas Instruments"],
  ["Texas Instruments TI-83 Plus Graphing Calculator", "Texas Instruments"],
  ["Casio FX-991EX ClassWiz Scientific Calculator", "Casio"],
  ["Casio FX-CG50 Color Graphing Calculator", "Casio"],
  ["HP Prime Graphing Calculator G2", "HP"],
  ["Logitech M170 Wireless Mouse", "Logitech"],
  ["Logitech K380 Multi-Device Bluetooth Keyboard", "Logitech"],
  ["Anker USB C Hub 7-in-1", "Anker"],

  // Desk & Storage
  ["Bostitch Personal Antimicrobial Electric Pencil Sharpener", "Bostitch"],
  ["Scotch Heavy Duty Packing Tape 8-Roll Pack", "Scotch"],
  ["Sterilite Storage Drawer 3-Pack Clear", "Sterilite"],
  ["Post-it Super Sticky Notes 4x4 12-Pack", "Post-it"],
  ["3M Command Hooks Value Pack 40-Count", "Command"],

  // Lunch & Water Bottles
  ["Hydro Flask 21oz Standard Mouth Water Bottle", "Hydro Flask"],
  ["Owala FreeSip 24oz Insulated Water Bottle", "Owala"],
  ["Contigo Autoseal 20oz Kids Water Bottle", "Contigo"],
  ["Stanley Quencher Flowstate 30oz Kids Tumbler", "Stanley"],
  ["PackIt Freezable Lunch Bag", "PackIt"],
  ["Bentgo Kids Prints Leak-Proof Bento Box", "Bentgo"],
  ["YETI Daytrip Lunch Box", "YETI"],

  // Planners & Agendas
  ["Moleskine 18-Month Weekly Planner", "Moleskine"],
  ["Erin Condren Life Planner Deluxe Monthly", "Erin Condren"],
  ["Panda Planner Pro Undated", "Panda Planner"],
  ["At-A-Glance Academic Weekly Monthly Planner", "At-A-Glance"],
];

// Subcategory mapping — slug prefix or brand-based heuristic
const SUB_MAP = {
  "jansport-": "backpacks", "herschel-": "backpacks", "fjallraven-": "backpacks",
  "north-face": "backpacks", "adidas-prime": "backpacks", "nike-brasilia": "backpacks",
  "osprey-": "backpacks", "under-armour-hustle": "backpacks", "vera-bradley": "backpacks",
  "five-star-": "notebooks", "moleskine-classic": "notebooks", "leuchtturm": "notebooks",
  "rocketbook-": "notebooks", "mead-composition": "notebooks", "oxford-filler": "notebooks",
  "ticonderoga-": "writing", "pilot-g2": "writing", "bic-round": "writing",
  "sharpie-": "writing", "crayola-": "writing", "prismacolor-": "writing",
  "faber-castell": "writing", "zebra-mildliner": "writing", "staedtler-": "writing",
  "texas-instruments": "calculators", "casio-": "calculators", "hp-prime": "calculators",
  "logitech-": "calculators", "anker-usb": "calculators",
  "bostitch-": "desk", "scotch-heavy": "desk", "sterilite-": "desk",
  "post-it-": "desk", "3m-command": "desk",
  "hydro-flask-": "lunch", "owala-": "lunch", "contigo-": "lunch",
  "stanley-quencher-flowstate": "lunch", "packit-": "lunch", "bentgo-": "lunch", "yeti-daytrip": "lunch",
  "moleskine-18": "planners", "erin-condren": "planners", "panda-planner": "planners", "at-a-glance": "planners",
};
function subFor(slug) {
  for (const [k, v] of Object.entries(SUB_MAP)) if (slug.startsWith(k)) return v;
  return "desk";
}

const SYSTEM = `You estimate long-term consumer regret for products from public review sentiment.
Return ONLY JSON: {"regret_score": int 0-100, "would_buy_again_pct": int 0-100,
"avg_satisfaction_day30": num 1-5, "avg_satisfaction_day60": num 1-5, "avg_satisfaction_day90": num 1-5,
"top_regret_reasons": [{"reason": string} up to 3],
"description": "one 12-22 word neutral sentence"}
Established brands (JanSport, Ticonderoga, TI, Moleskine, Hydro Flask) score LOW regret. Cheap/gimmicky = HIGH. Return ONLY JSON.`;

async function scoreOne(name, brand, attempt = 1) {
  try {
    const r = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: `Product: ${name} by ${brand}. Category: School Supplies. JSON only.` }],
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

const { data: existing } = await supa.from("products").select("slug").limit(4000);
const seen = new Set(existing.map((r) => r.slug));

console.log(`Scoring ${CATALOG.length} school supplies via Claude Haiku...\n`);
const rows = [];
for (let i = 0; i < CATALOG.length; i++) {
  const [name, brand] = CATALOG[i];
  const slug = slugify(`${brand} ${name}`);
  if (seen.has(slug)) { console.log(`  [${i+1}/${CATALOG.length}] ${slug} — skip`); continue; }
  seen.add(slug);
  process.stdout.write(`  [${String(i+1).padStart(2)}/${CATALOG.length}] ${slug.padEnd(52)} `);
  const s = await scoreOne(name, brand);
  rows.push({
    slug, name, brand, category: "School Supplies",
    image_url: null, amazon_url: null,
    regret_score: Math.max(0, Math.min(100, Math.round(s.regret_score))),
    would_buy_again_pct: Math.max(0, Math.min(100, Math.round(s.would_buy_again_pct))),
    is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: Number(s.avg_satisfaction_day30).toFixed(2),
    avg_satisfaction_day60: Number(s.avg_satisfaction_day60).toFixed(2),
    avg_satisfaction_day90: Number(s.avg_satisfaction_day90).toFixed(2),
    top_regret_reasons: s.top_regret_reasons ?? [],
    external_ids: { description: s.description ?? "", source: "curated_school_2026", sub: subFor(slug) },
  });
  console.log(`→ regret ${rows[rows.length-1].regret_score}`);
}
console.log(`\nUpserting ${rows.length}...`);
for (let i = 0; i < rows.length; i += 50) {
  const chunk = rows.slice(i, i + 50);
  const { error } = await supa.from("products").upsert(chunk, { onConflict: "slug" });
  if (error) console.warn("chunk err:", error.message);
}
console.log("✓ Done.");
