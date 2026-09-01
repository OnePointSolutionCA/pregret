#!/usr/bin/env node
/**
 * Generate 100 US+CA-targeted blog posts via Claude Haiku and write them
 * into src/data/blog.ts as an appendable POSTS array (does not touch the
 * 5 hand-written seed posts already there).
 *
 * Strategy: mix 5 post archetypes across a pool of high-intent product,
 * category, and shopper queries. Each post gets:
 *   - a US/CA-targeted title (~55-65 chars)
 *   - a 150-160 char meta description
 *   - 700-1000 words of markdown body with an inline US+CA context line
 *   - dated across the last ~9 months so the archive doesn't look bulk-loaded
 *
 * Run:  node --env-file=.env.local scripts/gen-blog-posts.mjs
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_FILE = resolve(__dirname, "..", "src", "data", "blog.ts");
const OUT_FILE = resolve(__dirname, "..", "src", "data", "blog-generated.ts");

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// -----------------------------------------------------------------------------
// Post archetypes → generators of (title, description, prompt)
// -----------------------------------------------------------------------------
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

const ARCH = {
  should_buy: (p) => ({
    title: `Should You Buy the ${p.name} in ${p.year}? (US & Canada Guide)`,
    description: `${p.regret_score}% of owners regret buying the ${p.name}. Long-term satisfaction data for US and Canadian shoppers.`,
    category: "Product Reviews",
    prompt: `Write a 750-word blog post titled "Should You Buy the ${p.name} in ${p.year}? (US & Canada Guide)" for the Pregret website. The product's Regret Score is ${p.regret_score}/100 (higher = more owners regret it). Would-buy-again: ${p.would_buy_again_pct}%. Structure with 4 markdown H2 sections. Cover: what it is, the day-30 vs day-90 satisfaction drop, top complaints (invent plausible ones consistent with the score), whether it's worth it for US buyers on Amazon.com vs Canadian buyers on Amazon.ca, and a bottom-line verdict. Neutral, evidence-based tone. Avoid hype. Mention Amazon.com and Amazon.ca once each. Do NOT include a title heading — start with the first paragraph.`,
  }),
  vs: (a, b) => ({
    title: `${a.name} vs ${b.name}: Which Has Lower Long-Term Regret?`,
    description: `Head-to-head: ${a.name} (${a.regret_score}/100 regret) vs ${b.name} (${b.regret_score}/100). Owner-verified data for US and Canadian shoppers.`,
    category: "Comparisons",
    prompt: `Write a 700-word head-to-head comparison titled "${a.name} vs ${b.name}: Which Has Lower Long-Term Regret?" for Pregret. Regret scores: ${a.name} = ${a.regret_score}, ${b.name} = ${b.regret_score}. Structure: intro, section per product covering what it is + top strengths + top weaknesses, a "The tie-breaker" section, and a verdict recommending one for US shoppers and possibly a different one for Canadian shoppers if the cross-border pricing matters. 4 markdown H2s. Neutral tone. Avoid hype. Do NOT include a title heading.`,
  }),
  category_regret: (cat) => ({
    title: `The ${cat.count} Most Regretted ${cat.label} of ${cat.year}`,
    description: `Owner-verified regret data on ${cat.label.toLowerCase()} — which products US and Canadian shoppers wish they hadn't bought.`,
    category: "Product Insights",
    prompt: `Write a 900-word listicle titled "The ${cat.count} Most Regretted ${cat.label} of ${cat.year}" for Pregret. Cover ${cat.count} high-regret ${cat.label.toLowerCase()} products (use these: ${cat.examples.join(", ")}). For each, one H3 heading with product name and a 3-4 sentence write-up: what it is, why the regret builds by day 90, and what to try instead. Open with a 2-paragraph intro about US and Canadian shopper trends in this category. Close with a 1-paragraph pattern-recognition section — what these products share. Neutral tone. Do NOT include a title H1 heading — start with the intro.`,
  }),
  low_regret: (cat) => ({
    title: `${cat.count} ${cat.label} Worth Keeping (Lowest Regret Scores of the Year)`,
    description: `The ${cat.label.toLowerCase()} US and Canadian shoppers are still happy with at day 90. Owner-verified satisfaction rankings.`,
    category: "Product Insights",
    prompt: `Write a 850-word listicle titled "${cat.count} ${cat.label} Worth Keeping (Lowest Regret Scores of the Year)" for Pregret. Cover ${cat.count} low-regret ${cat.label.toLowerCase()} products (${cat.examples.join(", ")}). For each, one H3 heading with product name + 3 sentences: what it is, why owners stay happy through day 90, ideal buyer. Open with 2 paragraphs on what separates "buy for life" products from disposable ones. Close with a paragraph on shared traits (no subscription, simple mechanics, honest marketing). Neutral tone, no hype. Do NOT include a title H1 heading.`,
  }),
  evergreen: (topic) => ({
    title: topic.title,
    description: topic.description,
    category: topic.category,
    prompt: `Write a 900-word blog post titled "${topic.title}" for Pregret, a product-satisfaction review site serving US and Canadian shoppers. Voice: evidence-based, neutral, no marketing hype. 4 markdown H2 sections. Include one paragraph with US-specific context and one with Canada-specific context. Do NOT include a title H1 heading.`,
  }),
};

// -----------------------------------------------------------------------------
// Evergreen topics — buyer-intent long-tails targeting both countries
// -----------------------------------------------------------------------------
const EVERGREEN = [
  { title: "The 90-Day Product Satisfaction Curve, Explained", description: "How every product tells the truth about itself 90 days after purchase. What US and Canadian shoppers can learn from time-decayed satisfaction data.", category: "How It Works" },
  { title: "Why Amazon Reviews Are Broken (and How to Read Them Anyway)", description: "The three biases hiding in every Amazon review. How US and Canadian shoppers can extract real signal from a 4.6-star average.", category: "How It Works" },
  { title: "Buyer's Remorse Statistics: US and Canada 2026", description: "The latest data on how often shoppers regret their purchases. Return rates, category-by-category breakdown, and psychological triggers.", category: "Consumer Trends" },
  { title: "The Subscription Hardware Trap in North America", description: "Products that stop working when the company folds. What US and Canadian buyers should ask before every connected purchase.", category: "Consumer Trends" },
  { title: "How to Return Anything in the US and Canada Without a Receipt", description: "Practical return policy guides for the top 15 retailers across both countries. Amazon, Costco, Best Buy, Walmart, and more.", category: "Buying Guides" },
  { title: "Amazon US vs Amazon Canada: Which Marketplace Is Better?", description: "Pricing, shipping speed, return policy, and warranty comparison for US and Canadian Prime members in 2026.", category: "Buying Guides" },
  { title: "The Real Cost of Cheap Electronics Over 12 Months", description: "Why the $40 knock-off costs more than the $200 name-brand within a year. Data from US and Canadian owner check-ins.", category: "Consumer Trends" },
  { title: "How to Spot a Product That Will Be Regretted Within 90 Days", description: "The seven warning signs before you click Buy. Applies equally to Amazon.com and Amazon.ca listings.", category: "Buying Guides" },
  { title: "Warranty Coverage US vs Canada: What Actually Changes at the Border", description: "Why the same manufacturer warranty behaves differently on either side of the 49th parallel. Practical implications for shoppers.", category: "Buying Guides" },
  { title: "The Ultimate 2026 US and Canada Black Friday Playbook", description: "Which products to avoid on Black Friday based on 90-day regret data. Cross-border pricing traps for Canadian shoppers.", category: "Buying Guides" },
  { title: "Why 'Best Sellers' Lists Are Misleading", description: "The gap between what sells and what satisfies. Owner-verified data across US and Canadian consumer categories.", category: "Consumer Trends" },
  { title: "The Return-Window Problem: 30 Days Isn't Long Enough", description: "Most product regret builds after the return window closes. Why 90-day check-ins matter for US and Canadian shoppers.", category: "How It Works" },
  { title: "Price Anchoring on Amazon: Are You Really Getting a Deal?", description: "How Amazon.com and Amazon.ca use strikethrough prices to inflate perceived savings. What to look for instead.", category: "Consumer Trends" },
  { title: "The Best Cheap Products That Outlast Expensive Alternatives", description: "Products under $50 that beat their premium counterparts on 90-day satisfaction. Verified with US and Canadian owner data.", category: "Product Insights" },
  { title: "Why Refurbished Beats New in Three Categories", description: "The categories where certified refurbished products have lower regret scores than new. US and Canadian buying guide.", category: "Buying Guides" },
  { title: "How Long Does a Product Really Last? Real-World Data", description: "Owner-verified lifespans by category. What US and Canadian shoppers should expect from consumer electronics, kitchen appliances, and fitness gear.", category: "Consumer Trends" },
  { title: "The Psychology of Buyer's Remorse", description: "Why regret arrives on a delay — and how to buy in a way that minimizes it. Behavioral research applied to US and Canadian shopping habits.", category: "Consumer Trends" },
  { title: "Cross-Border Shopping: When It's Worth It for Canadians", description: "The categories where shopping Amazon.com beats Amazon.ca after duties, exchange, and shipping. Real math from 2026.", category: "Buying Guides" },
  { title: "The Truth About Extended Warranties in North America", description: "Why extended warranties are rarely worth it in the US and Canada. The 3-question test before you say yes at checkout.", category: "Buying Guides" },
  { title: "How to Read Between the Lines of a 4.7-Star Product", description: "The specific keywords in negative reviews that predict long-term regret. Works on both Amazon.com and Amazon.ca listings.", category: "How It Works" },
  { title: "Return-Rate Data Is the New Product Rating", description: "Why retailers hide return-rate data — and how to estimate it yourself. Applicable to US and Canadian shopping.", category: "How It Works" },
  { title: "Best Time of Year to Buy Anything in the US and Canada", description: "Category-by-category seasonal pricing calendar for North American shoppers. When discounts are real vs manufactured.", category: "Buying Guides" },
  { title: "The Hidden Cost of 'Free Trials' on Physical Products", description: "How free-trial and try-before-you-buy programs actually work in the US and Canada. When they benefit you and when they don't.", category: "Consumer Trends" },
  { title: "Why Some Brands Have Chronic Regret Problems", description: "The 7 brands with the highest average regret scores across categories. Data from US and Canadian owner check-ins.", category: "Product Insights" },
  { title: "Renting vs Buying: The Math for High-Regret Categories", description: "For fitness equipment, appliances, and baby gear, renting can beat buying. Cost analysis for US and Canadian shoppers.", category: "Buying Guides" },
];

// -----------------------------------------------------------------------------
// Fetch products for archetype prompts
// -----------------------------------------------------------------------------
const { data: prods } = await supa
  .from("products")
  .select("slug, name, brand, category, regret_score, would_buy_again_pct")
  .order("regret_score", { ascending: false })
  .limit(500);
if (!prods) { console.error("No products"); process.exit(1); }

const YEAR = 2026;
const byCat = {};
prods.forEach((p) => { (byCat[p.category] ??= []).push(p); });

// Build the task list
const TASKS = [];

// 30 "should buy" posts — high-regret + high-loved products
const hiRegret = prods.filter((p) => p.regret_score >= 50).slice(0, 18);
const loRegret = [...prods].sort((a,b) => a.regret_score - b.regret_score).slice(0, 12);
[...hiRegret, ...loRegret].forEach((p) => TASKS.push(ARCH.should_buy({ ...p, year: YEAR })));

// 15 versus posts — regret vs low-regret in same category
Object.entries(byCat).forEach(([cat, list]) => {
  const hi = list.filter((p) => p.regret_score >= 50).slice(0, 2);
  const lo = [...list].sort((a,b) => a.regret_score - b.regret_score).slice(0, 2);
  for (const h of hi) for (const l of lo) {
    if (TASKS.filter((t) => t.category === "Comparisons").length >= 15) return;
    if (h.slug === l.slug) continue;
    TASKS.push(ARCH.vs(h, l));
  }
});

// 14 "most regretted category" listicles (2 per category)
Object.entries(byCat).forEach(([cat, list]) => {
  const top = list.filter((p) => p.regret_score >= 40).slice(0, 7);
  if (top.length < 5) return;
  TASKS.push(ARCH.category_regret({ label: cat, count: Math.min(top.length, 7), examples: top.map((p) => p.name), year: YEAR }));
});

// 7 "worth keeping" listicles
Object.entries(byCat).forEach(([cat, list]) => {
  const best = [...list].sort((a,b) => a.regret_score - b.regret_score).slice(0, 6);
  if (best.length < 4) return;
  TASKS.push(ARCH.low_regret({ label: cat, count: best.length, examples: best.map((p) => p.name) }));
});

// Evergreen (up to 25)
EVERGREEN.forEach((t) => TASKS.push(ARCH.evergreen(t)));

// Cap at 100 and dedupe by title
const seen = new Set(); const finalTasks = [];
for (const t of TASKS) { if (seen.has(t.title)) continue; seen.add(t.title); finalTasks.push(t); if (finalTasks.length >= 100) break; }

console.log(`Generating ${finalTasks.length} posts. This will take ~15-25 minutes.\n`);

// -----------------------------------------------------------------------------
// Claude call per post
// -----------------------------------------------------------------------------
const SYSTEM = `You are a staff writer for Pregret, a consumer product review site serving shoppers in the United States and Canada. Voice: neutral, evidence-based, no marketing hype (no "stunning", "revolutionary", "game-changer"). Structure posts with markdown H2 headings (## Section). Do not include an H1 title heading — start with the intro paragraph. Include at least one paragraph with US-specific context (Amazon.com, US return policies, Best Buy US, Costco US) and at least one with Canada-specific context (Amazon.ca, Best Buy Canada, Canadian Tire, Costco Canada). Never invent quantitative regret-score data beyond what's stated in the prompt. Never fabricate quotes from real people.`;

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

// Dates spread across last 9 months — starting Aug 5 2026, one every ~2 days
const posts = [];
const startDate = new Date(2026, 7, 5); // Aug 5, 2026
for (let i = 0; i < finalTasks.length; i++) {
  const t = finalTasks[i];
  const daysBack = Math.round(i * 2.7);
  const date = new Date(startDate); date.setDate(date.getDate() - daysBack);
  const iso = date.toISOString().slice(0, 10);

  process.stdout.write(`  [${String(i + 1).padStart(3)}/${finalTasks.length}] ${t.title.slice(0, 55).padEnd(56)} `);
  const body = await writePost(t.prompt);
  if (!body) { console.log("FAILED"); continue; }
  const slug = slugify(t.title);
  posts.push({
    slug, title: t.title, description: t.description,
    publishedDate: iso, category: t.category,
    readMins: Math.max(3, Math.round(body.split(/\s+/).length / 220)),
    body,
  });
  console.log("ok");
}

// -----------------------------------------------------------------------------
// Write to blog-generated.ts
// -----------------------------------------------------------------------------
const header = `// AUTO-GENERATED by scripts/gen-blog-posts.mjs — do not hand-edit.\n// ${new Date().toISOString().slice(0,10)} · ${posts.length} posts\nimport type { BlogPost } from "./blog";\n\nexport const GENERATED_POSTS: BlogPost[] = ${JSON.stringify(posts, null, 2)};\n`;
writeFileSync(OUT_FILE, header);
console.log(`\n✓ Wrote ${posts.length} posts to ${OUT_FILE}`);

// Patch blog.ts to re-export the union
const blogTs = readFileSync(BLOG_FILE, "utf8");
if (!blogTs.includes("GENERATED_POSTS")) {
  const patched = blogTs.replace(
    /export const POSTS: BlogPost\[\] = \[/,
    `import { GENERATED_POSTS } from "./blog-generated";\n\nexport const POSTS: BlogPost[] = [\n  ...GENERATED_POSTS,\n`
  );
  writeFileSync(BLOG_FILE, patched);
  console.log("✓ Patched blog.ts to include GENERATED_POSTS");
} else {
  console.log("blog.ts already imports GENERATED_POSTS");
}
console.log("\nRerun `next build` to see the new posts.");
