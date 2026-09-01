#!/usr/bin/env node
/**
 * Generate a branded SVG placeholder tile for every product without a photo,
 * write it to public/products/{slug}.svg, and point the DB there.
 *
 * The tile picks a color per category and shows the brand + product name
 * in the Pregret typography.  Runs after fetch-images.mjs.
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

// Category → tile palette (cream backdrops, brand-adjacent accents)
const PALETTES = {
  Electronics: { bg: "#0C3A5E", accent: "#FF6B57", fg: "#FBF7F1", surface: "#0A2E4A" },
  Kitchen:     { bg: "#FBF7F1", accent: "#FF6B57", fg: "#0C3A5E", surface: "#F5EFE5" },
  Fitness:     { bg: "#0A2E4A", accent: "#F2A93A", fg: "#FBF7F1", surface: "#0C3A5E" },
};

function initials(brand) {
  return brand
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function tileSVG({ brand, name, category }) {
  const pal = PALETTES[category] ?? PALETTES.Electronics;
  const inits = initials(brand);
  const nameShort = name.length > 34 ? name.slice(0, 32).trim() + "…" : name;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="640" height="640" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${pal.bg}"/>
      <stop offset="1" stop-color="${pal.surface}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.15" cy="0.1" r="0.9">
      <stop offset="0" stop-color="${pal.accent}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${pal.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="640" fill="url(#g)"/>
  <rect width="640" height="640" fill="url(#glow)"/>
  <circle cx="512" cy="120" r="6" fill="${pal.accent}"/>
  <text x="48" y="120" font-family="Poppins, 'Plus Jakarta Sans', system-ui, sans-serif" font-size="18" letter-spacing="4" fill="${pal.fg}" fill-opacity="0.55">
    ${escapeXml(category.toUpperCase())}
  </text>
  <text x="48" y="440"
        font-family="Fraunces, 'Playfair Display', Georgia, serif"
        font-size="260" font-weight="700" font-style="italic" letter-spacing="-8"
        fill="${pal.fg}">
    ${escapeXml(inits)}
  </text>
  <text x="48" y="520" font-family="Poppins, 'Plus Jakarta Sans', system-ui, sans-serif" font-size="26" font-weight="600" fill="${pal.fg}">
    ${escapeXml(brand)}
  </text>
  <text x="48" y="560" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="22" fill="${pal.fg}" fill-opacity="0.72">
    ${escapeXml(nameShort)}
  </text>
</svg>`;
}

const { data: rows } = await supa.from("products").select("id, slug, name, brand, category, image_url");
if (!rows) process.exit(1);

let generated = 0, kept = 0, updated = 0;
for (const p of rows) {
  // If a real product image already exists on disk, keep it and leave DB alone.
  const jpgPath = resolve(OUT_DIR, `${p.slug}.jpg`);
  if (existsSync(jpgPath)) {
    const s = await stat(jpgPath);
    if (s.size > 5000) {
      if (p.image_url !== `/products/${p.slug}.jpg`) {
        await supa.from("products").update({ image_url: `/products/${p.slug}.jpg` }).eq("id", p.id);
        updated++;
      }
      kept++;
      continue;
    }
  }

  const svgPath = resolve(OUT_DIR, `${p.slug}.svg`);
  await writeFile(svgPath, tileSVG({ brand: p.brand, name: p.name, category: p.category }));
  const url = `/products/${p.slug}.svg`;
  if (p.image_url !== url) {
    await supa.from("products").update({ image_url: url }).eq("id", p.id);
    updated++;
  }
  generated++;
}

console.log(`Kept ${kept} real photos, generated ${generated} SVG tiles, updated ${updated} DB rows.`);
