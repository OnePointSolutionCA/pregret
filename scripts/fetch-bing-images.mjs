#!/usr/bin/env node
/**
 * For every product still showing an SVG placeholder tile, hit Bing Images,
 * parse the first result, download the image, save as public/products/{slug}.jpg,
 * and update the DB.
 *
 * Bing Images ships real image URLs inside <a class="iusc" m='{"murl": "..."}'>
 * blobs in the HTML — no API key, no auth needed. Skips products that already
 * have a .jpg to preserve existing real photos.
 *
 * Run:  node --env-file=.env.local scripts/fetch-bing-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { writeFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "products");

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

// -----------------------------------------------------------------------------
// Search Bing for the product, return an ordered list of candidate image URLs.
// -----------------------------------------------------------------------------
async function searchBing(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1&safeSearch=Strict`;
  const res = await fetch(url, {
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return [];
  const html = await res.text();

  // Bing embeds each image tile as: <a class="iusc" ... m="{"murl":"https://..."}">
  const rx = /m="([^"]+)"/g;
  const out = [];
  const seen = new Set();
  let m;
  while ((m = rx.exec(html))) {
    let obj;
    try {
      obj = JSON.parse(m[1].replace(/&quot;/g, '"'));
    } catch {
      continue;
    }
    const murl = obj.murl || obj.imgurl || obj.mediaurl;
    if (!murl) continue;
    if (seen.has(murl)) continue;
    seen.add(murl);
    out.push(murl);
    if (out.length >= 8) break;
  }
  return out;
}

async function downloadImage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": UA,
        accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        referer: "https://www.bing.com/",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8000) return null; // reject tiny placeholders/icons
    return buf;
  } catch {
    return null;
  }
}

async function acquire(product) {
  const dest = resolve(OUT_DIR, `${product.slug}.jpg`);
  if (existsSync(dest)) {
    const s = await stat(dest);
    if (s.size > 8000) return "cached";
  }

  const query = `${product.brand} ${product.name} product photo white background`;
  const candidates = await searchBing(query);
  if (!candidates.length) return "no-results";

  for (const url of candidates) {
    const buf = await downloadImage(url);
    if (buf) {
      await writeFile(dest, buf);
      return "ok";
    }
  }
  return "failed";
}

// Paginate — Supabase caps single selects at 1000 rows.
const rows = [];
for (let p = 0; p < 10; p++) {
  const { data } = await supa
    .from("products")
    .select("id, slug, name, brand, image_url")
    .order("slug")
    .range(p * 1000, (p + 1) * 1000 - 1);
  if (!data || data.length === 0) break;
  rows.push(...data);
  if (data.length < 1000) break;
}
if (!rows.length) process.exit(1);

const targets = rows.filter((p) => {
  if (!p.image_url || p.image_url.endsWith(".svg")) return true;
  return false;
});
console.log(`Need photos for ${targets.length} of ${rows.length} products.\n`);

const results = { ok: 0, cached: 0, "no-results": 0, failed: 0 };
const updates = [];

for (let i = 0; i < targets.length; i++) {
  const p = targets[i];
  process.stdout.write(`  [${String(i + 1).padStart(2)}/${targets.length}] ${p.slug.padEnd(42)} `);
  const status = await acquire(p);
  results[status] += 1;
  console.log(status);
  if (status === "ok" || status === "cached") {
    updates.push({ id: p.id, image_url: `/products/${p.slug}.jpg` });
  }
  // gentle pacing to avoid Bing throttling
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 400));
}

console.log(`\nSummary:`, results);
console.log(`\nUpdating ${updates.length} DB rows to point at the new .jpg files...`);
for (const u of updates) {
  await supa.from("products").update({ image_url: u.image_url }).eq("id", u.id);
}
console.log("Done.");
