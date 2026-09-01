#!/usr/bin/env node
/**
 * Fetch product images from Amazon by ASIN, save to public/products/{slug}.jpg,
 * and update the products table with the image_url.
 *
 * Amazon exposes stable, un-authenticated image URLs by ASIN:
 *   https://m.media-amazon.com/images/P/{ASIN}._SCLZZZZZZZ_.jpg   (full)
 *   https://m.media-amazon.com/images/P/{ASIN}._SL500_.jpg        (500px)
 * We try a few variants and use the first one that returns >5KB (Amazon returns
 * a tiny 1x1 placeholder for missing/blocked ASINs).
 *
 * Run:  node --env-file=.env.local scripts/fetch-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "products");
await mkdir(OUT_DIR, { recursive: true });

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// -----------------------------------------------------------------------------
// slug → { asin, amazonUrl } lookup.  ASINs verified from Amazon.com listings.
// -----------------------------------------------------------------------------
const CATALOG = {
  // Electronics
  "anker-737-power-bank":            { asin: "B0B18QCLQR" },
  "apple-airpods-max":               { asin: "B08PZHYWJS" },
  "bose-quietcomfort-ultra":         { asin: "B0CCZ26B5V" },
  "dji-mini-3-pro":                  { asin: "B0B4CV7L98" },
  "dyson-v15-detect":                { asin: "B08J4Q1FDG" },
  "gopro-hero-12-black":             { asin: "B0CBBZKKV5" },
  "irobot-roomba-j7":                { asin: "B09H5RJTQY" },
  "kindle-scribe":                   { asin: "B09BS5XWNS" },
  "lg-c3-65-oled-tv":                { asin: "B0BXK9RY8H" },
  "meta-quest-3":                    { asin: "B0CJHCFTMS" },
  "oura-ring-gen-3":                 { asin: "B08K3QY6NM" },
  "peloton-bike":                    { asin: "B08JQKWGVL" },
  "ring-video-doorbell-pro-2":       { asin: "B09WZBPS44" },
  "samsung-galaxy-z-fold-5":         { asin: "B0C7C8T9BR" },
  "sonos-era-300":                   { asin: "B0BVPX7CX9" },
  "sony-wh-1000xm5":                 { asin: "B09XS7JWHH" },

  // Fitness
  "apple-watch-ultra-2":             { asin: "B0CHX7R2VF" },
  "bowflex-selecttech-552-dumbbells":{ asin: "B001ARYU58" },
  "concept2-rowerg":                 { asin: "B007VBRDS8" },
  "garmin-forerunner-265":           { asin: "B0BW4WT9RM" },
  "hydrow-rower":                    { asin: "B0BPZDLCPZ" },
  "hyperice-normatec-3-legs":        { asin: "B09MKMGH6L" },
  "lululemon-studio-mirror":         { asin: null },
  "mirror-by-lululemon":             { asin: null },
  "nordictrack-commercial-1750-treadmill": { asin: "B08V8B4TC7" },
  "peloton-tread":                   { asin: "B09B2FVBQ8" },
  "rep-fitness-pr-4000-rack":        { asin: null },
  "tempo-studio":                    { asin: null },
  "theragun-elite":                  { asin: "B0BZ8QN2Z1" },
  "trx-pro4-system":                 { asin: "B078NLXR23" },
  "whoop-4-0":                       { asin: "B09XH1BDL9" },

  // Kitchen
  "breville-barista-express":        { asin: "B00CH9QWOU" },
  "cuisinart-food-processor-14-cup": { asin: "B01AXM4WV2" },
  "ember-mug-2":                     { asin: "B08MMV8DXY" },
  "instant-pot-duo-7-in-1":          { asin: "B00FLYWNYQ" },
  "keurig-k-supreme-plus":           { asin: "B08MC2WXG3" },
  "kitchenaid-artisan-stand-mixer":  { asin: "B00005UP2P" },
  "lodge-cast-iron-skillet-12":      { asin: "B00006JSUB" },
  "nespresso-vertuo-next":           { asin: "B084HHM8YZ" },
  "ninja-creami":                    { asin: "B09BC7HJVD" },
  "ninja-foodi-air-fryer":           { asin: "B08LZK4GK5" },
  "our-place-always-pan":            { asin: "B08K8QCJJT" },
  "sodastream-art":                  { asin: "B09TZ6RVFT" },
  "thermomix-tm6":                   { asin: null },
  "vitamix-a3500":                   { asin: "B01D6KP9TM" },
  "yeti-rambler-30oz-tumbler":       { asin: "B073WJRY3N" },
};

// -----------------------------------------------------------------------------
// Amazon image URL variants — try each; pick the first that returns a real image.
// -----------------------------------------------------------------------------
const HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  accept: "image/webp,image/apng,image/*,*/*;q=0.8",
};

function variants(asin) {
  return [
    `https://m.media-amazon.com/images/P/${asin}._SCLZZZZZZZ_.jpg`,
    `https://m.media-amazon.com/images/P/${asin}._SL500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`,
  ];
}

async function tryFetch(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Amazon returns a tiny (~1KB) placeholder for missing/blocked ASINs.
    if (buf.length < 5000) return null;
    return buf;
  } catch {
    return null;
  }
}

async function downloadFor(slug, asin) {
  const dest = resolve(OUT_DIR, `${slug}.jpg`);
  if (existsSync(dest)) {
    const s = await stat(dest);
    if (s.size > 5000) return "cached";
  }
  if (!asin) return "no-asin";

  for (const url of variants(asin)) {
    const buf = await tryFetch(url);
    if (buf) {
      await writeFile(dest, buf);
      return "ok";
    }
  }
  return "failed";
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
const { data: rows } = await supa.from("products").select("id, slug, name");
if (!rows) {
  console.error("Could not fetch products.");
  process.exit(1);
}

const results = { ok: 0, cached: 0, "no-asin": 0, failed: 0 };
const updates = [];

for (let i = 0; i < rows.length; i++) {
  const p = rows[i];
  const meta = CATALOG[p.slug] ?? {};
  process.stdout.write(`  [${String(i + 1).padStart(2)}/${rows.length}] ${p.slug.padEnd(40)} `);
  const status = await downloadFor(p.slug, meta.asin);
  results[status] += 1;
  console.log(status + (meta.asin ? ` (asin ${meta.asin})` : ""));
  const update = { id: p.id };
  if (status === "ok" || status === "cached") update.image_url = `/products/${p.slug}.jpg`;
  if (meta.asin) update.amazon_url = `https://www.amazon.com/dp/${meta.asin}`;
  if (Object.keys(update).length > 1) updates.push(update);
  // gentle pacing
  await new Promise((r) => setTimeout(r, 120));
}

console.log(`\nSummary:`, results);

// -----------------------------------------------------------------------------
// Push updates to DB in one shot
// -----------------------------------------------------------------------------
console.log(`\nUpdating ${updates.length} rows...`);
for (const u of updates) {
  const { id, ...patch } = u;
  const { error } = await supa.from("products").update(patch).eq("id", id);
  if (error) console.warn(`  ⚠ ${id}: ${error.message}`);
}
console.log("Done.");
