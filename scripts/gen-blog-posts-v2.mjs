#!/usr/bin/env node
/**
 * v2: generate 50 MORE blogs targeting high-search-volume buyer intents.
 * New archetypes cover exact-match search queries people actually type
 * ("is X worth it", "best X under $Y", "why people regret X"). Writes to
 * src/data/blog-generated-v2.ts; blog.ts is patched to concat it.
 *
 * Focus: long-tail keywords that convert (buyer intent), not brand-awareness
 * fluff. Every post targets a specific product name + buyer-intent modifier.
 *
 * Run:  node --env-file=.env.local scripts/gen-blog-posts-v2.mjs
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_FILE = resolve(__dirname, "..", "src", "data", "blog.ts");
const OUT_FILE = resolve(__dirname, "..", "src", "data", "blog-generated-v2.ts");
const EXISTING_V1 = resolve(__dirname, "..", "src", "data", "blog-generated.ts");

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

// New archetypes tuned for high buyer-intent search queries
const ARCH = {
  is_worth_it: (p) => ({
    title: `Is the ${p.name} Worth It in 2026? (Honest Answer)`,
    description: `Real long-term data on the ${p.name}: pros, cons, and whether it's worth the money in 2026 for US and Canadian shoppers.`,
    category: "Buyer's Guide",
    prompt: `Write a 750-word blog post titled "Is the ${p.name} Worth It in 2026? (Honest Answer)" for Pregret. Regret Score: ${p.regret_score}/100. Would-buy-again: ${p.would_buy_again_pct}%. Category: ${p.category}. Answer the question directly in the opening line ("Short answer: ${p.regret_score > 55 ? 'no' : p.regret_score < 30 ? 'yes' : 'it depends'} — here's why."). 4 markdown H2s: "The Case For It", "The Case Against It", "Who Should Actually Buy It", "The Verdict". Include one paragraph each on Amazon.com pricing/returns and Amazon.ca pricing/returns. Neutral tone. Do NOT include a title H1.`,
  }),
  why_regret: (p) => ({
    title: `Why People Regret Buying the ${p.name} (Data + Reasons)`,
    description: `${p.regret_score}% of ${p.name} owners regret the purchase. The specific complaints, warning signs, and alternatives to consider first.`,
    category: "Product Insights",
    prompt: `Write a 750-word blog post titled "Why People Regret Buying the ${p.name} (Data + Reasons)" for Pregret. Regret Score: ${p.regret_score}/100. Cover 5-6 specific reasons owners regret this product, structured as H3 subheadings under an H2 "The Real Reasons". Then an H2 "Warning Signs Before You Buy" with a checklist. Then an H2 "What to Try Instead" mentioning ${p.category.toLowerCase()} alternatives generally. Then an H2 "US and Canada Buying Notes" covering Amazon.com + Amazon.ca return windows. Neutral, plain-spoken tone. Do NOT include a title H1.`,
  }),
  alternatives: (p) => ({
    title: `${p.name} Alternatives: Better Options for 2026`,
    description: `Not sold on the ${p.name}? Here are the top alternatives with lower regret scores. Owner-verified data for US and Canadian shoppers.`,
    category: "Comparisons",
    prompt: `Write a 700-word blog post titled "${p.name} Alternatives: Better Options for 2026" for Pregret. Assume ${p.name} has a Regret Score of ${p.regret_score}/100 and readers are shopping around. Structure: 2-paragraph intro on why alternatives matter. Then 4 H3 subheadings ("### 1. [Alternative product type/example]") each with 3-4 sentences comparing to the ${p.name} on price, longevity, and buyer-fit. Then an H2 "US vs Canada Availability" covering Amazon.com and Amazon.ca options. Neutral tone. Do NOT include a title H1.`,
  }),
  best_under: (topic) => ({
    title: topic.title,
    description: topic.description,
    category: "Buyer's Guide",
    prompt: `Write a 850-word blog post titled "${topic.title}" for Pregret. Structure: 2-paragraph intro on shopping this category on a budget. Then 5 H3 subheadings ("### 1. [Product-type category]") — each covering a real product type (not fake products, use category descriptions like "the mid-tier robot vacuum" or "the entry-level cast-iron skillet") with 3-4 sentences on why it stays under the budget cap and delivers long-term satisfaction. Then an H2 "How to Shop This List on Amazon.com and Amazon.ca". Neutral, evidence-based tone. Do NOT include a title H1.`,
  }),
  real_reviews: (p) => ({
    title: `${p.name} Real Reviews from Long-Term Owners`,
    description: `What ${p.name} owners actually say after 90 days. The complaints, praise, and satisfaction data you won't find on Amazon.`,
    category: "Product Reviews",
    prompt: `Write a 750-word blog post titled "${p.name} Real Reviews from Long-Term Owners" for Pregret. Regret Score: ${p.regret_score}/100. Cover: (H2) "The Day-30 Honeymoon" — what new owners typically love. (H2) "The Day-90 Reality" — what changes 3 months in. (H2) "Recurring Complaint Themes" with 3-4 H3 subheadings for specific issues. (H2) "US Return Policies vs Canadian Return Policies" — Amazon.com vs Amazon.ca windows. Close with 1-paragraph verdict. Neutral, plain-spoken tone. Do NOT include a title H1.`,
  }),
  common_question: (topic) => ({
    title: topic.title,
    description: topic.description,
    category: "How It Works",
    prompt: `Write a 900-word blog post titled "${topic.title}" for Pregret, a product satisfaction data site serving US and Canadian shoppers. Voice: evidence-based, no marketing hype. 4 markdown H2 sections. Include one paragraph with Amazon.com/US-specific context and one with Amazon.ca/Canada-specific context. Do NOT include a title H1.`,
  }),
};

// -------- Product-driven picks --------
const { data: prods } = await supa
  .from("products")
  .select("slug, name, brand, category, regret_score, would_buy_again_pct, external_ids")
  .order("regret_score", { ascending: false })
  .limit(500);
if (!prods) { console.error("No products"); process.exit(1); }

// Prefer products with real Amazon reviews for buyer-intent posts (those get search traffic)
const withReviews = prods.filter((p) => {
  const r = parseInt(p.external_ids?.amazon_reviews ?? "0", 10) || 0;
  return r >= 1000;
});
console.log(`  ${withReviews.length} products have 1000+ reviews`);

// De-dup against existing v1 posts (title-based)
const existingSlugs = new Set();
if (existsSync(EXISTING_V1)) {
  const v1 = readFileSync(EXISTING_V1, "utf8");
  const m = v1.matchAll(/"slug":\s*"([^"]+)"/g);
  for (const x of m) existingSlugs.add(x[1]);
}
console.log(`  ${existingSlugs.size} v1 slugs to skip`);

// -------- Build tasks --------
const TASKS = [];

// 15 "is X worth it" posts targeting top-reviewed high-regret + mid-regret products
const highSignal = [...withReviews]
  .sort((a, b) => (parseInt(b.external_ids?.amazon_reviews ?? "0", 10)) - (parseInt(a.external_ids?.amazon_reviews ?? "0", 10)))
  .slice(0, 30);
for (const p of highSignal.slice(0, 15)) TASKS.push(ARCH.is_worth_it(p));

// 10 "why people regret X" for high-regret products with real review signal
for (const p of withReviews.filter((x) => x.regret_score >= 55).slice(0, 10)) TASKS.push(ARCH.why_regret(p));

// 10 "X alternatives" for high-regret popular products
for (const p of withReviews.filter((x) => x.regret_score >= 45).slice(0, 10)) TASKS.push(ARCH.alternatives(p));

// 5 "real reviews" for the most-reviewed products regardless of score
for (const p of highSignal.slice(15, 20)) TASKS.push(ARCH.real_reviews(p));

// 6 "best under $X" evergreen — high-intent shopper searches
const BEST_UNDER = [
  { title: "Best Air Fryer Under $200 for 2026 (US & Canada)", description: "Owner-satisfaction data on the best-value air fryers under $200 in North America. Which brands actually last past year one." },
  { title: "Best Robot Vacuum Under $500 (US & Canada Guide 2026)", description: "The mid-range robot vacuums with the lowest owner regret. Real long-term data for US and Canadian shoppers." },
  { title: "Best Coffee Maker Under $300 (2026 Owner-Verified Guide)", description: "The coffee makers with 90-day satisfaction that justifies the price. Amazon.com and Amazon.ca picks." },
  { title: "Best Wireless Earbuds Under $150 in 2026 (US & Canada)", description: "Wireless earbuds under $150 that still hold up at day 90. Owner-verified satisfaction rankings for North America." },
  { title: "Best Kitchen Stand Mixer Under $400 for 2026", description: "The stand mixers with the strongest long-term satisfaction under $400. Real 90-day owner data across US and Canada." },
  { title: "Best Massage Gun Under $200 in 2026 (Owner Data)", description: "Which sub-$200 massage guns owners actually keep using at day 90. US and Canadian buying guide." },
];
BEST_UNDER.forEach((t) => TASKS.push(ARCH.best_under(t)));

// 8 common-question evergreens targeting long-tail SEO
const QUESTIONS = [
  { title: "Is Extended Warranty Worth It on Amazon Purchases?", description: "The real value of Amazon extended warranties in the US and Canada. When they pay off and when they don't." },
  { title: "How to Tell If a Product Is Actually Popular vs Astroturfed", description: "The signs an Amazon 'bestseller' is manufactured, not organic. What US and Canadian shoppers should look for." },
  { title: "Why Some Amazon Products Have Fake 5-Star Reviews", description: "How fake reviews slip past Amazon's filters. Techniques US and Canadian shoppers can use to spot them." },
  { title: "What Is a Regret Score and How Does Pregret Calculate It?", description: "The methodology behind Pregret's regret scores. Why 90-day satisfaction beats day-1 review counts." },
  { title: "How Long Do Robot Vacuums Actually Last? Real Data", description: "Owner-verified lifespan data on the top robot vacuum brands. What US and Canadian buyers can expect." },
  { title: "Why 4.5 Stars on Amazon Isn't Actually That Good", description: "The star inflation problem on Amazon marketplaces. What a 4.5 vs 4.7 star average actually means in 2026." },
  { title: "How to Return an Amazon Purchase Without Losing Money", description: "The refund tactics that work on Amazon.com and Amazon.ca. Restocking fees, shipping, and edge cases." },
  { title: "The Best-Value Amazon Categories to Buy From in 2026", description: "The Amazon categories with the highest owner-satisfaction data in the US and Canada right now." },
];
QUESTIONS.forEach((t) => TASKS.push(ARCH.common_question(t)));

// De-dup vs existing
const seen = new Set();
const finalTasks = [];
for (const t of TASKS) {
  const slug = slugify(t.title);
  if (seen.has(slug) || existingSlugs.has(slug)) continue;
  seen.add(slug);
  finalTasks.push(t);
}
console.log(`\n${finalTasks.length} new posts to generate. Est. 8-15 min.\n`);

// -------- Claude generation --------
const SYSTEM = `You are a staff writer for Pregret, a consumer product review site serving shoppers in the United States and Canada. Voice: neutral, evidence-based, no marketing hype (no "stunning", "revolutionary", "game-changer"). Structure posts with markdown H2 headings (## Section). Do not include an H1 title heading — start with the intro paragraph. Include Amazon.com and Amazon.ca context. Never invent quantitative regret-score data beyond what's stated in the prompt.`;

async function writePost(prompt, attempt = 1) {
  try {
    const resp = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2400,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    return resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  } catch (err) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 1000 * attempt)); return writePost(prompt, attempt + 1); }
    console.warn("Write failed:", err.message);
    return null;
  }
}

// Dates: spread 50 posts across the next ~2 months so archive looks fresh
const posts = [];
const startDate = new Date(2026, 7, 5); // Aug 5 2026
for (let i = 0; i < finalTasks.length; i++) {
  const t = finalTasks[i];
  const daysBack = Math.round(i * 1.4);
  const d = new Date(startDate); d.setDate(d.getDate() - daysBack);
  process.stdout.write(`  [${String(i + 1).padStart(3)}/${finalTasks.length}] ${t.title.slice(0, 55).padEnd(56)} `);
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

const header = `// AUTO-GENERATED by scripts/gen-blog-posts-v2.mjs — do not hand-edit.\n// ${new Date().toISOString().slice(0,10)} · ${posts.length} posts\nimport type { BlogPost } from "./blog";\n\nexport const GENERATED_POSTS_V2: BlogPost[] = ${JSON.stringify(posts, null, 2)};\n`;
writeFileSync(OUT_FILE, header);
console.log(`\n✓ Wrote ${posts.length} posts to ${OUT_FILE}`);

// Patch blog.ts to include v2 if not already
const blogTs = readFileSync(BLOG_FILE, "utf8");
if (!blogTs.includes("GENERATED_POSTS_V2")) {
  const patched = blogTs.replace(
    /import { GENERATED_POSTS } from "\.\/blog-generated";/,
    `import { GENERATED_POSTS } from "./blog-generated";\nimport { GENERATED_POSTS_V2 } from "./blog-generated-v2";`
  ).replace(
    /\.\.\.GENERATED_POSTS,/,
    `...GENERATED_POSTS,\n  ...GENERATED_POSTS_V2,`
  );
  writeFileSync(BLOG_FILE, patched);
  console.log("✓ Patched blog.ts to include GENERATED_POSTS_V2");
}
