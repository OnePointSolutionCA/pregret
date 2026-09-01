#!/usr/bin/env node
/**
 * v3: generate 60 MORE blogs targeting untapped niches and seasonal keywords.
 * Covers: sports/padel, gaming, back-to-school, brand deep-dives, more
 * "best under $X" guides, seasonal/holiday, and Canadian-specific content.
 *
 * Run:  node --env-file=.env.local scripts/gen-blog-posts-v3.mjs
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_FILE = resolve(__dirname, "..", "src", "data", "blog.ts");
const OUT_FILE = resolve(__dirname, "..", "src", "data", "blog-generated-v3.ts");

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

// Collect all existing slugs to de-dup
function collectExistingSlugs() {
  const slugs = new Set();
  for (const f of ["blog-generated.ts", "blog-generated-v2.ts"]) {
    const p = resolve(__dirname, "..", "src", "data", f);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf8");
    for (const m of txt.matchAll(/"slug":\s*"([^"]+)"/g)) slugs.add(m[1]);
  }
  const blogTs = readFileSync(BLOG_FILE, "utf8");
  for (const m of blogTs.matchAll(/slug:\s*"([^"]+)"/g)) slugs.add(m[1]);
  return slugs;
}

const existingSlugs = collectExistingSlugs();
console.log(`${existingSlugs.size} existing slugs to skip`);

// -------- TASKS --------
const TASKS = [];

const SYSTEM = `You are a staff writer for Pregret, a consumer product satisfaction data site serving shoppers in the United States and Canada. Voice: neutral, evidence-based, no marketing hype (no "stunning", "revolutionary", "game-changer"). Structure posts with markdown H2 headings (## Section). Do not include an H1 title heading — start with the intro paragraph. Include Amazon.com and Amazon.ca context where relevant. Never invent quantitative regret-score data beyond what's stated in the prompt. Write naturally and conversationally — avoid stiff formal phrasing.`;

// ===== BEST UNDER $X (12 new) =====
const BEST_UNDER = [
  { title: "Best Padel Racket Under $150 in 2026 (US & Canada)", description: "The padel rackets with the lowest buyer regret under $150. Real owner satisfaction data for North American players." },
  { title: "Best Gaming Headset Under $100 in 2026 (US & Canada)", description: "Gaming headsets under $100 that hold up after 90 days. Owner data for US and Canadian gamers." },
  { title: "Best Baby Monitor Under $200 in 2026 (US & Canada)", description: "Baby monitors under $200 with the highest long-term satisfaction. What parents actually keep using." },
  { title: "Best Blender Under $100 for 2026 (Owner-Verified)", description: "Sub-$100 blenders with the lowest regret. Owner-verified picks for US and Canadian kitchens." },
  { title: "Best Running Shoes Under $150 in 2026 (US & Canada)", description: "Running shoes under $150 that owners still love at day 90. Data-backed picks for North American runners." },
  { title: "Best Smart Watch Under $250 in 2026 (US & Canada)", description: "Smartwatches under $250 with the lowest buyer regret. Owner-verified satisfaction for US and Canadian shoppers." },
  { title: "Best Noise Cancelling Headphones Under $200 in 2026", description: "ANC headphones under $200 ranked by 90-day owner satisfaction. US and Canada buyer's guide." },
  { title: "Best Electric Toothbrush Under $100 in 2026 (US & Canada)", description: "Electric toothbrushes under $100 with the highest owner satisfaction after 90 days. US and Canada picks." },
  { title: "Best Yoga Mat Under $80 in 2026 (Owner Data)", description: "Yoga mats under $80 that don't disappoint at day 90. Owner-verified picks for US and Canadian buyers." },
  { title: "Best Portable Speaker Under $100 in 2026 (US & Canada)", description: "Portable Bluetooth speakers under $100 ranked by long-term satisfaction. Owner data for North America." },
  { title: "Best Office Chair Under $500 in 2026 (US & Canada)", description: "Office chairs under $500 with the lowest buyer regret after 90 days. Data-backed picks for home offices." },
  { title: "Best Instant Camera Under $150 in 2026 (US & Canada)", description: "Instant cameras under $150 with real owner satisfaction. US and Canadian buyer's guide for 2026." },
];

for (const t of BEST_UNDER) {
  TASKS.push({
    title: t.title,
    description: t.description,
    category: "Buyer's Guide",
    prompt: `Write a 900-word blog post titled "${t.title}" for Pregret. Structure: 2-paragraph intro on shopping this category on a budget in the US and Canada. Then 5 H3 subheadings ("### 1. [Product-type category]") — each covering a real product type (not fake products, use category descriptions like "the mid-tier option" or "the entry-level pick") with 3-4 sentences on why it stays under the budget cap and delivers long-term satisfaction. Then H2 "US vs Canada: Price and Availability Differences" comparing Amazon.com and Amazon.ca. Then H2 "When to Buy: Best Time for Deals" with seasonal buying advice. Do NOT include a title H1.`,
  });
}

// ===== BRAND DEEP-DIVES (10 posts) =====
const BRANDS = [
  { name: "Dyson", cats: "vacuums, hair tools, fans", rep: "premium-priced engineering", regretProfile: "high upfront cost + mixed long-term satisfaction on some models" },
  { name: "Ninja", cats: "blenders, air fryers, coffee makers", rep: "value-priced kitchen workhorse", regretProfile: "generally low regret but durability questions after 12 months on some items" },
  { name: "Apple", cats: "AirPods, Apple Watch, HomePod", rep: "ecosystem lock-in + premium", regretProfile: "low regret on core products but high on accessories" },
  { name: "Samsung", cats: "TVs, earbuds, tablets, watches", rep: "wide range from budget to premium", regretProfile: "varies wildly by tier — premium line is solid, budget line has issues" },
  { name: "Bose", cats: "headphones, speakers, earbuds", rep: "audio quality reputation", regretProfile: "low regret on flagship noise-cancelling, higher on budget line" },
  { name: "KitchenAid", cats: "stand mixers, food processors, attachments", rep: "heritage brand, built to last", regretProfile: "very low regret on the classic stand mixer, higher on newer electric products" },
  { name: "Peloton", cats: "bikes, treads, rowers", rep: "connected fitness pioneer", regretProfile: "high regret due to subscription fatigue and resale collapse" },
  { name: "Instant Brands", cats: "Instant Pot, air fryers, blenders", rep: "the pressure cooker company", regretProfile: "low regret on the Duo, mixed on expansion products" },
  { name: "Garmin", cats: "running watches, cycling computers, fitness trackers", rep: "serious athlete's brand", regretProfile: "very low regret — owners are loyal but the price barrier deters casual users" },
  { name: "iRobot", cats: "Roomba vacuums, Braava mops", rep: "the original robot vacuum", regretProfile: "mid-tier regret — reliability issues on some models, strong on flagships" },
];

for (const b of BRANDS) {
  TASKS.push({
    title: `${b.name} Regret Report 2026: Which Products Are Worth It?`,
    description: `Owner-verified satisfaction data across ${b.name}'s lineup. Which ${b.name} products have low regret and which ones disappoint.`,
    category: "Brand Reports",
    prompt: `Write an 850-word blog post titled "${b.name} Regret Report 2026: Which Products Are Worth It?" for Pregret. ${b.name} makes ${b.cats}. Brand reputation: ${b.rep}. Regret profile: ${b.regretProfile}. Structure: Intro paragraph on ${b.name}'s brand perception vs reality. H2 "The Low-Regret ${b.name} Products" (3 product types that owners love at day 90). H2 "The High-Regret ${b.name} Products" (2-3 product types where buyers are disappointed). H2 "Why ${b.name} Satisfaction Varies So Much" (price-tier analysis). H2 "Buying ${b.name} in the US vs Canada" (Amazon.com vs Amazon.ca pricing, warranty, availability differences). Close with a brief verdict. Do NOT include a title H1.`,
  });
}

// ===== SPORTS & OUTDOOR (8 posts) =====
const SPORTS = [
  { title: "The Complete Padel Equipment Guide for Beginners in 2026", description: "Everything you need to start playing padel in the US and Canada. Rackets, balls, shoes, and what to avoid." },
  { title: "Best Home Gym Equipment Under $1000 (2026 Owner Data)", description: "Build a complete home gym for under $1000 that you won't regret. Real satisfaction data from US and Canadian owners." },
  { title: "Treadmill vs Peloton vs Rower: Which Has the Lowest Regret?", description: "Owner satisfaction data comparing treadmills, Peloton bikes, and rowing machines. Which cardio machine people actually use." },
  { title: "Why People Stop Using Their Home Fitness Equipment After 90 Days", description: "The psychology and data behind abandoned fitness purchases. What separates regretted equipment from kept equipment." },
  { title: "Best Basketball Shoes for Outdoor Courts in 2026 (US & Canada)", description: "Basketball shoes that hold up on outdoor courts. Owner-verified picks for US and Canadian ballers." },
  { title: "Best Cycling Accessories Under $50 That Actually Last", description: "Budget cycling accessories with real durability data. Lights, locks, pumps, and more for US and Canadian riders." },
  { title: "Best Golf Rangefinder Under $300 in 2026 (Owner Verified)", description: "Golf rangefinders under $300 ranked by long-term owner satisfaction. US and Canada buyer's guide." },
  { title: "Best Soccer Cleats Under $100 in 2026 (US & Canada)", description: "Soccer cleats under $100 with real durability and comfort data from North American players." },
];

for (const t of SPORTS) {
  TASKS.push({
    title: t.title,
    description: t.description,
    category: "Sports & Outdoors",
    prompt: `Write a 900-word blog post titled "${t.title}" for Pregret. Structure: engaging intro paragraph. 4-5 H2 sections with substantive content. Include specific price ranges in USD and CAD where relevant. Add an H2 section on "US vs Canada Availability" comparing Amazon.com and Amazon.ca options. Evidence-based tone — reference owner satisfaction and long-term durability. Do NOT include a title H1.`,
  });
}

// ===== SEASONAL / HOLIDAY (8 posts) =====
const SEASONAL = [
  { title: "Back-to-School 2026: The Products Students Regret Buying Most", description: "Which back-to-school purchases have the highest regret scores. Laptops, backpacks, and supplies that disappoint." },
  { title: "Black Friday 2026: What to Actually Buy (Data-Backed Guide)", description: "Which Black Friday deals are worth it and which are regret traps. Owner-verified data for US and Canadian shoppers." },
  { title: "Holiday Gift Guide 2026: Low-Regret Gifts Under $100", description: "Gifts under $100 that recipients actually keep and use. Owner-verified satisfaction for US and Canadian shoppers." },
  { title: "Holiday Gift Guide 2026: Low-Regret Gifts Under $50", description: "The best gifts under $50 with proven long-term satisfaction. No regretted gifts this year." },
  { title: "Prime Day 2026: What's Actually Worth Buying (Regret Data)", description: "Which Prime Day deals lead to buyer satisfaction and which lead to returns. Historical data analysis." },
  { title: "Winter Gear Worth Buying in Canada: What Owners Actually Keep", description: "The winter jackets, boots, and accessories that Canadian owners rate highest after a full season of use." },
  { title: "Summer Fitness Equipment People Regret Buying Every Year", description: "The seasonal fitness purchases that gather dust by September. What to buy instead." },
  { title: "Labor Day vs Boxing Day Deals: US vs Canada Shopping Guide", description: "When to buy in the US vs Canada. The best seasonal sales for each country and what actually gets discounted." },
];

for (const t of SEASONAL) {
  TASKS.push({
    title: t.title,
    description: t.description,
    category: "Seasonal Guides",
    prompt: `Write a 900-word blog post titled "${t.title}" for Pregret. Structure: strong intro paragraph that hooks the reader. 4-5 H2 sections with practical, actionable content. Include price references in both USD and CAD. Add specific Amazon.com and Amazon.ca context. Evidence-based tone. Do NOT include a title H1.`,
  });
}

// ===== GAMING (6 posts) =====
const GAMING = [
  { title: "Best Gaming Monitor Under $400 in 2026 (US & Canada)", description: "Gaming monitors under $400 ranked by long-term owner satisfaction. What US and Canadian gamers actually keep." },
  { title: "Best Gaming Mouse Under $80 in 2026 (Owner Data)", description: "Gaming mice under $80 with the lowest regret after 90 days. Data-backed picks for North American gamers." },
  { title: "Best Gaming Keyboard Under $100 in 2026 (US & Canada)", description: "Mechanical gaming keyboards under $100 ranked by owner satisfaction. US and Canada buyer's guide." },
  { title: "Console vs PC Gaming in 2026: Which Has Lower Long-Term Regret?", description: "Owner satisfaction data comparing PS5, Xbox, Switch, and gaming PCs. Which platform buyers regret least." },
  { title: "The Most Regretted Gaming Accessories of 2026", description: "The gaming accessories with the highest buyer regret. RGB strips, cheap controllers, and headset stands that disappoint." },
  { title: "Best Gaming Chair Under $300 in 2026 (Owner Verified)", description: "Gaming chairs under $300 that don't fall apart at month 3. Real owner satisfaction for US and Canadian gamers." },
];

for (const t of GAMING) {
  TASKS.push({
    title: t.title,
    description: t.description,
    category: "Gaming",
    prompt: `Write a 850-word blog post titled "${t.title}" for Pregret. Structure: intro paragraph for gamers on a budget. 4-5 H2 sections. Include specific price ranges in USD and CAD. Compare Amazon.com vs Amazon.ca availability and pricing. Evidence-based, no hype. Do NOT include a title H1.`,
  });
}

// ===== CANADIAN-SPECIFIC (6 posts) =====
const CANADA = [
  { title: "10 Products That Cost Way More in Canada (and Better Alternatives)", description: "The biggest US-to-Canada price gaps on popular products and what Canadian shoppers can buy instead." },
  { title: "How to Use Amazon.com from Canada Without Getting Burned", description: "When cross-border Amazon shopping works, when it doesn't, and how to avoid duty and return headaches." },
  { title: "Best Canadian Amazon Prime Day Deals That Actually Deliver Value", description: "Which Prime Day deals are worth it specifically for Canadian shoppers. Historical regret data analysis." },
  { title: "The Most Regretted Products Sold on Amazon.ca in 2026", description: "The highest-regret products on the Canadian Amazon marketplace. What Canadian shoppers should avoid." },
  { title: "Canadian Winter Product Guide: What's Actually Worth the Premium", description: "Winter products that justify their higher Canadian prices. Owner satisfaction data on boots, parkas, and gear." },
  { title: "Costco vs Amazon Canada: Where to Buy 12 Common Product Categories", description: "Price, satisfaction, and return policy comparison between Costco Canada and Amazon.ca across major categories." },
];

for (const t of CANADA) {
  TASKS.push({
    title: t.title,
    description: t.description,
    category: "Canada Shopping",
    prompt: `Write a 900-word blog post titled "${t.title}" for Pregret. This is specifically targeted at Canadian shoppers. Structure: intro paragraph addressing Canadian buyers directly. 4-5 H2 sections with Canada-specific content including CAD pricing, Canadian retailers, shipping to Canada, and PIPEDA/consumer protection context where relevant. Reference Amazon.ca specifically. Compare with Amazon.com options where useful. Do NOT include a title H1.`,
  });
}

// ===== EDUCATIONAL / EVERGREEN (10 posts) =====
const EDITORIAL = [
  { title: "How to Read Amazon Reviews Like a Data Scientist", description: "The framework for extracting real signal from Amazon reviews. What to look for beyond the star average." },
  { title: "The 5 Warning Signs a Product Will Disappoint You", description: "Data-backed red flags that predict high buyer regret. Check these before clicking Add to Cart." },
  { title: "Why 'Amazon's Choice' Badge Doesn't Mean What You Think", description: "What the Amazon's Choice label actually measures and why it often leads buyers to regretted purchases." },
  { title: "The Real Difference Between a 4.2 and 4.6 Star Rating on Amazon", description: "Why small differences in Amazon star ratings hide huge gaps in satisfaction. The math behind the stars." },
  { title: "How Product Categories Affect Regret: Electronics vs Kitchen vs Fitness", description: "Which product categories have the highest and lowest regret rates, and why. Data from 50,000+ products." },
  { title: "The Sunk Cost Trap: Why You Keep Products You Should Return", description: "The psychology of keeping regretted purchases. How sunk cost fallacy affects US and Canadian shoppers." },
  { title: "Do Amazon Return Rates Actually Predict Product Quality?", description: "The correlation between return rates and long-term satisfaction. What sellers don't want you to know." },
  { title: "What Happens to Your Amazon Data (and How to Control It)", description: "How Amazon tracks your shopping behavior in the US and Canada. Privacy controls most shoppers don't know about." },
  { title: "Why the Most Expensive Option Isn't Always the Best", description: "When premium products deliver lower satisfaction than mid-range alternatives. Data from owner reports." },
  { title: "How Influencer Recommendations Compare to Owner Data", description: "The gap between sponsored product reviews and real 90-day owner satisfaction. What to trust and what to ignore." },
];

for (const t of EDITORIAL) {
  TASKS.push({
    title: t.title,
    description: t.description,
    category: "How It Works",
    prompt: `Write a 900-word blog post titled "${t.title}" for Pregret. Voice: evidence-based, conversational, no marketing hype. Structure: engaging intro paragraph. 4-5 H2 sections with substantive content. Include at least one paragraph with US-specific context and one with Canada-specific context. Reference real shopping behaviors and data patterns. Do NOT include a title H1.`,
  });
}

// -------- De-dup --------
const seen = new Set();
const finalTasks = [];
for (const t of TASKS) {
  const slug = slugify(t.title);
  if (seen.has(slug) || existingSlugs.has(slug)) continue;
  seen.add(slug);
  finalTasks.push(t);
}
console.log(`\n${finalTasks.length} new posts to generate (${TASKS.length - finalTasks.length} de-duped). Est. 10-20 min.\n`);

// -------- Claude generation --------
async function writePost(prompt, attempt = 1) {
  try {
    const resp = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2800,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    return resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  } catch (err) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 1500 * attempt)); return writePost(prompt, attempt + 1); }
    console.warn("Write failed:", err.message);
    return null;
  }
}

const posts = [];
const startDate = new Date(2026, 7, 30); // Aug 30 2026
for (let i = 0; i < finalTasks.length; i++) {
  const t = finalTasks[i];
  const daysBack = Math.round(i * 1.2);
  const d = new Date(startDate); d.setDate(d.getDate() - daysBack);
  process.stdout.write(`  [${String(i + 1).padStart(3)}/${finalTasks.length}] ${t.title.slice(0, 60).padEnd(61)} `);
  const body = await writePost(t.prompt);
  if (!body) { console.log("FAIL"); continue; }
  posts.push({
    slug: slugify(t.title),
    title: t.title,
    description: t.description,
    publishedDate: d.toISOString().slice(0, 10),
    category: t.category,
    readMins: Math.max(3, Math.round(body.split(/\s+/).length / 220)),
    body,
  });
  console.log("ok");
}

const header = `// AUTO-GENERATED by scripts/gen-blog-posts-v3.mjs — do not hand-edit.\n// ${new Date().toISOString().slice(0,10)} · ${posts.length} posts\nimport type { BlogPost } from "./blog";\n\nexport const GENERATED_POSTS_V3: BlogPost[] = ${JSON.stringify(posts, null, 2)};\n`;
writeFileSync(OUT_FILE, header);
console.log(`\n✓ Wrote ${posts.length} posts to ${OUT_FILE}`);

// Patch blog.ts to include v3 if not already
const blogTs = readFileSync(BLOG_FILE, "utf8");
if (!blogTs.includes("GENERATED_POSTS_V3")) {
  let patched = blogTs;
  if (patched.includes("GENERATED_POSTS_V2")) {
    patched = patched.replace(
      /import { GENERATED_POSTS_V2 } from "\.\/blog-generated-v2";/,
      `import { GENERATED_POSTS_V2 } from "./blog-generated-v2";\nimport { GENERATED_POSTS_V3 } from "./blog-generated-v3";`
    ).replace(
      /\.\.\.GENERATED_POSTS_V2,/,
      `...GENERATED_POSTS_V2,\n  ...GENERATED_POSTS_V3,`
    );
  } else {
    patched = patched.replace(
      /import { GENERATED_POSTS } from "\.\/blog-generated";/,
      `import { GENERATED_POSTS } from "./blog-generated";\nimport { GENERATED_POSTS_V3 } from "./blog-generated-v3";`
    ).replace(
      /\.\.\.GENERATED_POSTS,/,
      `...GENERATED_POSTS,\n  ...GENERATED_POSTS_V3,`
    );
  }
  writeFileSync(BLOG_FILE, patched);
  console.log("✓ Patched blog.ts to include GENERATED_POSTS_V3");
}
