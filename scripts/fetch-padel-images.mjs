#!/usr/bin/env node
/**
 * Fetch product images via Serper (Google Images) for any product with
 * image_url = null. Skips products where a good image is already set.
 *
 * Run: SERPER_API_KEY=xxx node --env-file=.env.local scripts/fetch-padel-images.mjs
 */
import { createClient } from "@supabase/supabase-js";

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SERPER_KEY = process.env.SERPER_API_KEY;
if (!SERPER_KEY) { console.error("Missing SERPER_API_KEY"); process.exit(1); }

async function searchImage(query) {
  const r = await fetch("https://google.serper.dev/images", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5, gl: "us", hl: "en" }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  // Take the first image whose URL looks stable (jpg/png, https, from a reputable domain)
  const imgs = j.images ?? [];
  for (const img of imgs) {
    const u = img.imageUrl || img.link;
    if (!u) continue;
    if (!/^https:\/\//.test(u)) continue;
    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(u)) continue;
    // Skip clearly bad hosts
    if (/pinterest|instagram|facebook/i.test(u)) continue;
    return u;
  }
  // Fallback: first image regardless
  return imgs[0]?.imageUrl || imgs[0]?.link || null;
}

const { data: rows } = await supa
  .from("products")
  .select("id, slug, name, brand")
  .is("image_url", null)
  .limit(200);
console.log(`${rows?.length ?? 0} products without images`);

let ok = 0, fail = 0;
for (const p of rows ?? []) {
  const query = `${p.name} product image`;
  try {
    const url = await searchImage(query);
    if (!url) { fail++; console.log(`  ✗ ${p.slug} (no image)`); continue; }
    await supa.from("products").update({ image_url: url }).eq("id", p.id);
    ok++;
    console.log(`  ✓ ${p.slug.slice(0, 50).padEnd(52)} ${url.slice(0, 60)}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${p.slug} (${e.message})`);
  }
  // Modest rate limit — 100/sec ceiling on Serper free tier
  await new Promise((r) => setTimeout(r, 150));
}

console.log(`\n✓ ${ok} images set, ${fail} failed`);
