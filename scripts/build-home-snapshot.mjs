// Builds src/data/home-snapshot.json so the homepage makes zero DB calls at runtime.
// Runs as `prebuild`. If the DB is unreachable it keeps the existing snapshot and exits 0.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const OUT = new URL("../src/data/home-snapshot.json", import.meta.url);
const SUBCATS = new URL("../src/lib/subcategories.ts", import.meta.url);

function env(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
      .split("\n")
      .find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!url || !key) {
  console.log("[snapshot] Supabase not configured, keeping existing snapshot");
  process.exit(0);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const CARD =
  "id, slug, name, brand, category, image_url, amazon_url, regret_score, would_buy_again_pct, total_ratings, external_ids";
const SAMPLE = "id, slug, image_url, category, regret_score, reviews:external_ids->>amazon_reviews";
const SAMPLE_PER_CATEGORY = 400;

const orderBlock = readFileSync(SUBCATS, "utf8").split("export const CATEGORY_ORDER")[1].split("];")[0];
const categories = [...orderBlock.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);

async function q(builder, label) {
  const { data, error } = await builder;
  if (error) throw new Error(`${label}: ${error.message || "request failed"}`);
  return data ?? [];
}

async function main() {
  const withImage = () => db.from("products").select(CARD).not("image_url", "is", null);
  const [mostRegret, mostLoved, newest] = await Promise.all([
    q(withImage().order("regret_score", { ascending: false }).limit(8), "mostRegret"),
    q(withImage().order("would_buy_again_pct", { ascending: false }).limit(8), "mostLoved"),
    q(withImage().order("created_at", { ascending: false }).limit(8), "newest"),
  ]);

  // Rows were ingested most-reviewed first, so the first N per category are the popular ones.
  const samples = {};
  for (const cat of categories) {
    samples[cat] = await q(
      db.from("products").select(SAMPLE).eq("category", cat).not("image_url", "is", null).limit(SAMPLE_PER_CATEGORY),
      `sample:${cat}`,
    );
  }
  const reviewsOf = (r) => parseInt(r.reviews ?? "0", 10) || 500;

  const categoryHero = {};
  for (const [cat, rows] of Object.entries(samples)) {
    let best = null;
    let bestScore = -1;
    for (const r of rows) {
      const relevance = r.regret_score >= 30 && r.regret_score <= 70 ? 1 : r.regret_score > 70 ? 0.4 : 0.7;
      const score = reviewsOf(r) * relevance;
      if (score > bestScore) [best, bestScore] = [r, score];
    }
    if (best) categoryHero[cat] = best.image_url;
  }

  const all = Object.values(samples).flat().sort((a, b) => reviewsOf(b) - reviewsOf(a));
  const trendingIds = all.slice(0, 8).map((r) => r.id);
  const trendingRows = await q(db.from("products").select(CARD).in("id", trendingIds), "trending");
  const trending = trendingIds.map((id) => trendingRows.find((r) => r.id === id)).filter(Boolean);

  // Hero mosaic: round-robin across categories so it isn't all Electronics.
  const queues = Object.values(samples).map((rows) => [...rows].sort((a, b) => reviewsOf(b) - reviewsOf(a)));
  const mosaic = [];
  while (mosaic.length < 72 && queues.some((qq) => qq.length)) {
    for (const qq of queues) {
      const r = qq.shift();
      if (r) mosaic.push(r.image_url);
      if (mosaic.length >= 72) break;
    }
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    rails: { trending, mostRegret, mostLoved, newest },
    categoryHero,
    mosaic,
  };
  if (!trending.length && !mostRegret.length) throw new Error("DB returned no products");
  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(
    `[snapshot] wrote ${Object.keys(categoryHero).length} category images, ${mosaic.length} mosaic images, ` +
      `${trending.length + mostRegret.length + mostLoved.length + newest.length} rail products`,
  );
}

main().catch((e) => {
  console.warn(`[snapshot] could not refresh (${e.message}); keeping ${existsSync(OUT) ? "existing" : "empty"} snapshot`);
  if (!existsSync(OUT)) {
    writeFileSync(OUT, JSON.stringify({ generatedAt: null, rails: { trending: [], mostRegret: [], mostLoved: [], newest: [] }, categoryHero: {}, mosaic: [] }));
  }
  process.exit(0);
});
