#!/usr/bin/env node
/**
 * Generate 1-line product descriptions via Claude Haiku for every product
 * missing one. Stores the description in the existing `external_ids` JSONB
 * column (external_ids.description) — zero schema migration required.
 *
 * Run:  node --env-file=.env.local scripts/gen-descriptions.mjs
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You write concise, honest, single-sentence product descriptions for a consumer review site.
Rules:
- Exactly one sentence, 12-22 words.
- Describe WHAT the product IS and its key selling point.
- Neutral tone — no marketing hype ("stunning", "revolutionary", "game-changer").
- Do NOT mention regret, reviews, or the product's Regret Score.
- Do NOT start with "The" or the product name.
- Return only the sentence, no quotes, no markdown.
Examples:
"Cordless stick vacuum with laser-illuminated dust detection and up to 60 minutes of runtime per charge."
"Multifunction pressure cooker that also sautés, steams, slow-cooks, and makes yogurt in a single pot."
"Bluetooth soundbar with room-correction tuning designed to fill a home-cinema space with immersive audio."`;

async function describe(name, brand, category, attempt = 1) {
  try {
    const resp = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 90,
      system: SYSTEM,
      messages: [{ role: "user", content: `Product: ${name} by ${brand}. Category: ${category}. One sentence only.` }],
    });
    const text = resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim()
      .replace(/^["'"]|["'"]$/g, "");
    if (!text || text.length < 20) throw new Error("too short");
    return text;
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 700 * attempt));
      return describe(name, brand, category, attempt + 1);
    }
    return null;
  }
}

const { data: rows } = await supa
  .from("products")
  .select("id, slug, name, brand, category, external_ids")
  .order("category")
  .order("name");
if (!rows) process.exit(1);

console.log(`Generating descriptions for ${rows.length} products...\n`);
let ok = 0, skipped = 0, failed = 0;

for (let i = 0; i < rows.length; i++) {
  const p = rows[i];
  const existing = p.external_ids?.description;
  if (existing) {
    skipped++;
    continue;
  }
  process.stdout.write(`  [${String(i + 1).padStart(3)}/${rows.length}] ${p.slug.padEnd(42)} `);
  const desc = await describe(p.name, p.brand, p.category);
  if (!desc) {
    console.log("FAILED");
    failed++;
    continue;
  }
  const next = { ...(p.external_ids ?? {}), description: desc };
  const { error } = await supa.from("products").update({ external_ids: next }).eq("id", p.id);
  if (error) {
    console.log("db-err:", error.message);
    failed++;
  } else {
    ok++;
    console.log("→ " + desc.slice(0, 60));
  }
}
console.log(`\nDone. ok=${ok}, skipped=${skipped}, failed=${failed}`);
