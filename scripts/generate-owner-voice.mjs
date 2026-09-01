#!/usr/bin/env node
/**
 * Generates "what owners love / what owners regret" bullet points for the
 * top ~2000 most-reviewed products using Claude Haiku. Stored in
 * external_ids.owner_voice = { loves: [...], regrets: [...] } and rendered
 * on the product detail page.
 *
 * We only run this for popular products because the AI has more signal to
 * work with (name + brand + high review count = confident inference of
 * failure modes). Long-tail products keep their stars-only score.
 *
 * Cost: ~$1 total on Haiku for 2000 products.
 *
 * Run:  node --env-file=.env.local scripts/generate-owner-voice.mjs
 */
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-haiku-4-5-20251001";
const TARGET = parseInt(process.env.TARGET ?? "2000", 10);
const CONCURRENCY = 8;

console.log(`Fetching top ${TARGET} most-reviewed products...`);
// Order by numeric review count. Skip products that already have owner_voice cached.
const all = [];
for (let p = 0; p < 100; p++) {
  const { data } = await supa
    .from("products")
    .select("id, slug, name, brand, category, regret_score, external_ids")
    .not("image_url", "is", null)
    .range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  all.push(...data);
  if (data.length < 1000) break;
}
console.log(`  loaded ${all.length}`);

const candidates = all
  .map((p) => {
    const ext = p.external_ids ?? {};
    const reviews = parseInt(ext.amazon_reviews ?? "0", 10) || 0;
    return { ...p, _reviews: reviews, _hasVoice: !!ext.owner_voice };
  })
  .filter((p) => !p._hasVoice && p._reviews > 0)
  .sort((a, b) => b._reviews - a._reviews)
  .slice(0, TARGET);

console.log(`  ${candidates.length} need generation\n`);

const PROMPT = (p) => `Product: ${p.name}
Brand: ${p.brand ?? "unknown"}
Category: ${p.category ?? "unknown"}
Amazon rating: ${p.external_ids?.amazon_stars ?? "unknown"} stars (${p._reviews.toLocaleString()} reviews)
Regret score: ${p.regret_score}/100

Based on typical owner feedback patterns for products with this rating and review count, write:
- 2-3 short bullets on what owners TYPICALLY LOVE about it (real, specific, believable)
- 2-3 short bullets on what owners TYPICALLY REGRET or complain about (real failure modes for this product type)

Each bullet: 6-14 words, plain conversational language, no marketing fluff. Focus on concrete usage patterns, not abstract adjectives.

Return ONLY valid JSON, no other text:
{"loves":["...","..."],"regrets":["...","..."]}`;

async function generate(p) {
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: PROMPT(p) }],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.loves) || !Array.isArray(parsed.regrets)) return null;
    return {
      loves: parsed.loves.slice(0, 3).map((s) => String(s).slice(0, 120)),
      regrets: parsed.regrets.slice(0, 3).map((s) => String(s).slice(0, 120)),
    };
  } catch (e) {
    console.warn(`  ${p.slug}: ${e.message}`);
    return null;
  }
}

async function run() {
  let done = 0, ok = 0;
  const queue = [...candidates];
  await Promise.all(
    Array.from({ length: CONCURRENCY }).map(async () => {
      while (queue.length) {
        const p = queue.shift();
        if (!p) break;
        const voice = await generate(p);
        done++;
        if (voice) {
          const newExt = { ...(p.external_ids ?? {}), owner_voice: voice };
          await supa.from("products").update({ external_ids: newExt }).eq("id", p.id);
          ok++;
        }
        if (done % 25 === 0) {
          process.stdout.write(`  ${done}/${candidates.length}  ok=${ok}\r`);
        }
      }
    })
  );
  console.log(`\n✓ ${ok}/${done} generated\n`);
}
await run();
