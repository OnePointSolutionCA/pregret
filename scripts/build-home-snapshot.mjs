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
const SAMPLE =
  "id, slug, name, brand, image_url, category, regret_score, would_buy_again_pct, reviews:external_ids->>amazon_reviews";
const SAMPLE_PER_CATEGORY = 400;

const orderBlock = readFileSync(SUBCATS, "utf8").split("export const CATEGORY_ORDER")[1].split("];")[0];
const categories = [...orderBlock.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]);

async function q(builder, label) {
  const { data, error } = await builder;
  if (error) throw new Error(`${label}: ${error.message || "request failed"}`);
  return data ?? [];
}

// Recognizable product types per category, used to pick a tile image that actually says
// "Gaming" or "Kitchen" (the most-reviewed item is often something odd like a dye pod).
const CATEGORY_KEYWORDS = {
  Electronics: ["headphones", "earbuds", "bluetooth speaker", "smart watch"],
  Kitchen: ["air fryer", "blender", "coffee maker", "stand mixer"],
  Fitness: ["dumbbell", "yoga mat", "kettlebell", "resistance bands"],
  "Personal Care": ["electric toothbrush", "hair dryer", "electric shaver", "trimmer"],
  "Home & Garden": ["table lamp", "throw pillow", "planter", "air purifier"],
  Baby: ["stroller", "baby monitor", "high chair", "car seat"],
  Beauty: ["eyeshadow palette", "lipstick", "serum", "mascara"],
  "School Supplies": ["backpack", "notebook", "colored pencils", "markers"],
  Fashion: ["sneakers", "handbag", "sunglasses", "watch"],
  Automotive: ["dash cam", "jump starter", "car vacuum", "tire inflator"],
  "Toys & Games": ["lego", "board game", "puzzle", "plush"],
  "Pet Supplies": ["dog bed", "cat tree", "dog toy", "pet feeder"],
  "Tools & Home Improvement": ["cordless drill", "tool set", "screwdriver set", "tape measure"],
  "Arts & Crafts": ["acrylic paint", "paint brushes", "sketchbook", "watercolor"],
  Gaming: ["gaming headset", "wireless controller", "gaming mouse", "gaming keyboard"],
};

// The catalog's most-reviewed items are mostly no-name Amazon goods; the homepage reads as
// credible only when it shows brands people recognize.
const KNOWN_BRANDS = [
  "Apple", "Sony", "Bose", "Samsung", "JBL", "Anker", "Logitech", "Beats", "Fitbit", "Garmin", "Google", "Amazon", "Ring",
  "Dyson", "Shark", "iRobot", "Ninja", "KitchenAid", "Instant Pot", "Cuisinart", "Keurig", "Nespresso", "Vitamix",
  "Hamilton Beach", "Breville", "Lodge", "OXO", "Stanley", "YETI", "Hydro Flask", "Contigo", "Philips", "Oral-B",
  "Braun", "Panasonic", "Remington", "Conair", "Revlon", "Maybelline", "L'Oreal", "Neutrogena", "CeraVe", "e.l.f.",
  "NYX", "Olaplex", "LEGO", "Crayola", "Melissa & Doug", "Hasbro", "Mattel", "Fisher-Price", "Hot Wheels", "Nerf",
  "Play-Doh", "Graco", "Chicco", "Britax", "Dr. Brown's", "Owlet", "Hatch", "KONG", "Purina", "PetSafe", "Furbo",
  "DEWALT", "BLACK+DECKER", "Bosch", "Makita", "Milwaukee", "Craftsman", "Sharpie", "Five Star", "JanSport",
  "Nike", "adidas", "Ray-Ban", "Fossil", "Casio", "Levi's", "Champion", "Under Armour", "Crocs", "Skechers",
  "Nintendo", "PlayStation", "Xbox", "Razer", "Corsair", "SteelSeries", "HyperX", "Turtle Beach",
  "Meguiar's", "Chemical Guys", "Armor All", "NOCO", "Rain-X", "Bowflex", "Theragun", "Gaiam", "CAP Barbell",
];
const POPULAR = 300;
const reviewsOf = (r) => parseInt(r.reviews ?? "", 10) || 0;

// Best-ranked well-known products, no repeats across rails, no brand twice, max 2 per category
// so a rail isn't eight tapes or eight watches.
function pick(pool, rank, used, n = 8) {
  const brands = new Set();
  const perCat = {};
  const out = [];
  for (const r of [...pool].sort(rank)) {
    // First word only: the brand column holds variants like "Graco Slimfit" / "Graco 4Ever".
    const brand = (r.brand || r.name).split(/\s+/)[0].toLowerCase();
    if (used.has(r.id) || brands.has(brand) || (perCat[r.category] ?? 0) >= 2) continue;
    out.push(r);
    used.add(r.id);
    brands.add(brand);
    perCat[r.category] = (perCat[r.category] ?? 0) + 1;
    if (out.length === n) break;
  }
  return out;
}

async function main() {
  const base = () => db.from("products").select(SAMPLE).not("image_url", "is", null);
  const popular = {}, heroCandidates = {};
  for (const cat of categories) {
    const kw = CATEGORY_KEYWORDS[cat] ?? [];
    [popular[cat], heroCandidates[cat]] = await Promise.all([
      // Rows were ingested most-reviewed first, so the first N per category are the popular ones.
      q(base().eq("category", cat).limit(SAMPLE_PER_CATEGORY), `popular:${cat}`),
      kw.length
        ? q(base().eq("category", cat).or(kw.map((k) => `name.ilike.%${k}%`).join(",")).limit(250), `hero:${cat}`)
        : Promise.resolve([]),
    ]);
  }

  // Same name-or-brand trigram filter as site search (a brand-only ILIKE can seq-scan and time
  // out); then keep rows that actually start with the brand, which drops "for Dyson V11" parts.
  const known = [];
  for (let i = 0; i < KNOWN_BRANDS.length; i += 8) {
    const batch = await Promise.all(
      KNOWN_BRANDS.slice(i, i + 8).map(async (b) => {
        const term = b.replace(/[%_\\(),"]/g, " ");
        // A slow brand (very short names like "JBL" can time out) just drops out of the pool.
        const rows = await q(base().or(`name.ilike.%${term}%,brand.ilike.%${term}%`).limit(120), `brand:${b}`).catch(() => []);
        const lb = b.toLowerCase();
        return rows.filter((r) => (r.brand ?? "").toLowerCase().startsWith(lb) || r.name.toLowerCase().startsWith(lb));
      }),
    );
    known.push(...batch.flat());
  }
  const knownIds = new Set(known.map((r) => r.id));

  // Extremes on regret / satisfaction come from products with a handful of reviews, so every
  // rail draws only from recognizable brands with a real review count.
  const pool = [...new Map(known.map((r) => [r.id, r])).values()].filter((r) => reviewsOf(r) >= POPULAR);
  const used = new Set();
  const byReviews = (a, b) => reviewsOf(b) - reviewsOf(a);
  const picks = {
    trending: pick(pool, byReviews, used),
    mostRegret: pick(pool, (a, b) => b.regret_score - a.regret_score || byReviews(a, b), used),
    mostLoved: pick(pool, (a, b) => b.would_buy_again_pct - a.would_buy_again_pct || byReviews(a, b), used),
  };

  const ids = Object.values(picks).flat().map((r) => r.id);
  const cards = await q(db.from("products").select(CARD).in("id", ids), "rail cards");
  const card = (id) => cards.find((c) => c.id === id);
  const rails = Object.fromEntries(Object.entries(picks).map(([k, rows]) => [k, rows.map((r) => card(r.id)).filter(Boolean)]));

  // Tile image: known brands first (keyword-only matches are often accessories like "stroller
  // toy"), then earliest keyword ("gaming headset" beats "gaming mouse", which hits mouse pads).
  const categoryHero = {};
  for (const cat of categories) {
    const kw = CATEGORY_KEYWORDS[cat] ?? [];
    const kwIndex = (r) => {
      const i = kw.findIndex((k) => r.name.toLowerCase().includes(k));
      return i === -1 ? kw.length : i;
    };
    const heroRank = (a, b) =>
      Number(knownIds.has(b.id)) - Number(knownIds.has(a.id)) || kwIndex(a) - kwIndex(b) || byReviews(a, b);
    const best = [...heroCandidates[cat]].sort(heroRank)[0] ?? [...popular[cat]].sort(byReviews)[0];
    if (best) categoryHero[cat] = best.image_url;
  }

  // Hero mosaic: tile images, rail products, then more recognizable-brand products.
  const mosaic = [...new Set([
    ...Object.values(categoryHero),
    ...Object.values(rails).flat().map((p) => p.image_url),
    ...[...pool].sort(byReviews).map((r) => r.image_url),
  ])].filter(Boolean).slice(0, 60);

  const snapshot = {
    generatedAt: new Date().toISOString(),
    rails,
    categoryHero,
    mosaic,
  };
  if (!rails.trending.length) throw new Error("DB returned no products");
  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(
    `[snapshot] wrote ${Object.keys(categoryHero).length} category images, ${mosaic.length} mosaic images, ` +
      `${Object.values(rails).flat().length} rail products`,
  );
}

main().catch((e) => {
  console.warn(`[snapshot] could not refresh (${e.message}); keeping ${existsSync(OUT) ? "existing" : "empty"} snapshot`);
  if (!existsSync(OUT)) {
    writeFileSync(OUT, JSON.stringify({ generatedAt: null, rails: { trending: [], mostRegret: [], mostLoved: [] }, categoryHero: {}, mosaic: [] }));
  }
  process.exit(0);
});
