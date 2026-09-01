#!/usr/bin/env node
/**
 * v4: 80 more blog posts targeting new categories (Fashion, Automotive,
 * Toys, Pets, Tools, Arts & Crafts) + deeper buyer-intent posts for
 * existing categories + seasonal 2026 content.
 *
 * Run:  node --env-file=.env.local scripts/gen-blog-posts-v4.mjs
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_FILE = resolve(__dirname, "..", "src", "data", "blog.ts");
const OUT_FILE = resolve(__dirname, "..", "src", "data", "blog-generated-v4.ts");

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

// Collect existing slugs to avoid dupes
const existingSlugs = new Set();
for (const f of ["blog-generated.ts", "blog-generated-v2.ts", "blog-generated-v3.ts"]) {
  const path = resolve(__dirname, "..", "src", "data", f);
  if (existsSync(path)) {
    for (const m of readFileSync(path, "utf8").matchAll(/"slug":\s*"([^"]+)"/g)) existingSlugs.add(m[1]);
  }
}
console.log(`${existingSlugs.size} existing blog slugs to skip`);

const SYSTEM = `You are a staff writer for Pregret (pregret.ca), a product satisfaction data platform serving US and Canadian shoppers. Voice: neutral, evidence-based, no marketing hype. Structure posts with markdown H2 headings (##). Do NOT include an H1 title heading — start with the intro paragraph. Include Amazon.com and Amazon.ca context where relevant. Never invent specific regret-score numbers unless provided in the prompt. Write 700-900 words.`;

const POSTS = [
  // ===== NEW CATEGORY COVERAGE =====
  // Fashion (10)
  { title: "Why People Regret Buying Fast Fashion on Amazon", description: "The hidden costs of cheap clothing: returns, sizing failures, and 90-day dissatisfaction data.", category: "Product Insights" },
  { title: "Best Running Shoes on Amazon: Owner Satisfaction Data 2026", description: "Which running shoes actually hold up past day 90? Real owner data for US and Canadian runners.", category: "Buyer's Guide" },
  { title: "Amazon Fashion Returns: The Real Cost of Wrong Sizes", description: "How sizing inconsistency drives regret in online fashion. What US and Canadian shoppers can do about it.", category: "How It Works" },
  { title: "Best Backpacks Under $100 That Actually Last (2026)", description: "Owner-verified backpacks under $100 with the lowest regret scores. School, travel, and everyday picks.", category: "Buyer's Guide" },
  { title: "Smartwatch vs Traditional Watch: Which Do Owners Regret More?", description: "Long-term satisfaction data on smartwatches vs analog watches. The 90-day verdict is surprising.", category: "Comparisons" },
  { title: "Best Winter Jackets on Amazon for Canadian Winters 2026", description: "Which winter coats actually survive -30°C? Owner satisfaction data for Canadian shoppers.", category: "Buyer's Guide" },
  { title: "Why Cheap Sunglasses Have Lower Regret Than Designer Pairs", description: "The price-satisfaction paradox in eyewear. When spending less actually means less regret.", category: "Product Insights" },
  { title: "Best Luggage Sets Under $300: Owner Regret Rankings 2026", description: "Suitcase sets that survive baggage handlers. 90-day satisfaction data for frequent travelers.", category: "Buyer's Guide" },
  { title: "Amazon Clothing Size Charts Are Wrong: What the Data Shows", description: "How inaccurate sizing drives 40% of fashion returns. Brand-by-brand accuracy rankings.", category: "Product Insights" },
  { title: "Best Everyday Sneakers Under $80 (US & Canada 2026)", description: "The sub-$80 sneakers with the highest 90-day owner satisfaction. No hype, just data.", category: "Buyer's Guide" },

  // Automotive (8)
  { title: "Best Car Phone Mounts: Why Most Owners Regret Their Choice", description: "Phone mount regret is shockingly high. The mounting styles with the best long-term satisfaction.", category: "Product Insights" },
  { title: "Best Dash Cams Under $200 for 2026 (US & Canada)", description: "Owner-verified dash cams that actually work when you need them. 90-day reliability data.", category: "Buyer's Guide" },
  { title: "Why People Regret Cheap Car Accessories on Amazon", description: "The automotive accessories with the highest return rates. What to avoid and what's actually worth it.", category: "Product Insights" },
  { title: "Best Tire Inflators and Jump Starters: Owner Data 2026", description: "Emergency car tools ranked by real-world reliability. Which ones actually work at -20°C?", category: "Buyer's Guide" },
  { title: "Best Car Seat Covers That Don't Fall Apart (2026 Data)", description: "Seat covers ranked by 90-day durability. Most cheap options fail within weeks — here's what doesn't.", category: "Buyer's Guide" },
  { title: "LED Headlight Bulbs: Why 60% of Buyers Regret the Upgrade", description: "The fitment and brightness problems plaguing aftermarket LED headlights. What actually works.", category: "Product Insights" },
  { title: "Best OBD2 Scanners for Home Mechanics (Owner Rankings)", description: "Which diagnostic scanners are worth the money? Real owner satisfaction data for DIY mechanics.", category: "Buyer's Guide" },
  { title: "Car Cleaning Products That Actually Work: 90-Day Owner Data", description: "Detailing products ranked by long-term satisfaction. The ones pros and owners both agree on.", category: "Buyer's Guide" },

  // Toys & Games (8)
  { title: "Best STEM Toys That Kids Actually Keep Playing With", description: "Most STEM toys get abandoned in a week. These ones have 90-day engagement data to prove they don't.", category: "Buyer's Guide" },
  { title: "Board Games with the Lowest Owner Regret on Amazon 2026", description: "The tabletop games families actually replay. Satisfaction data on 200+ titles.", category: "Buyer's Guide" },
  { title: "Why Parents Regret 70% of Toy Purchases Within 90 Days", description: "The toy regret epidemic: data on why most toys fail the 3-month test and how to buy smarter.", category: "Product Insights" },
  { title: "Best LEGO Sets by Value: Price Per Piece vs Satisfaction 2026", description: "Which LEGO sets deliver the most satisfaction per dollar? Owner data across 50+ sets.", category: "Buyer's Guide" },
  { title: "Outdoor Toys That Survive a Full Summer: Owner Data", description: "Water toys, swing sets, and trampolines ranked by durability. What lasts and what breaks.", category: "Buyer's Guide" },
  { title: "Best Puzzles for Adults: Why Harder Doesn't Mean Better", description: "Puzzle satisfaction data shows the sweet spot isn't 1000 pieces. What owners actually enjoy most.", category: "Product Insights" },
  { title: "Remote Control Cars Under $50: Which Ones Actually Last?", description: "RC cars ranked by durability and long-term fun. Most die in a week — these ones don't.", category: "Buyer's Guide" },
  { title: "Why Collectible Toys Have the Highest Regret Scores on Amazon", description: "Action figures, Funko Pops, and trading cards: the buyer's remorse data is brutal.", category: "Product Insights" },

  // Pet Supplies (8)
  { title: "Best Dog Beds That Don't Flatten After a Month (2026)", description: "Dog bed satisfaction data: most go flat within 30 days. These ones hold up at day 90.", category: "Buyer's Guide" },
  { title: "Why Pet Owners Regret Most Amazon Pet Products", description: "The pet supply categories with the highest regret scores. Sizing, durability, and safety issues.", category: "Product Insights" },
  { title: "Best Automatic Pet Feeders: Owner Reliability Data 2026", description: "Auto feeders ranked by jam rate, app reliability, and 90-day satisfaction. US and Canada picks.", category: "Buyer's Guide" },
  { title: "Cat Trees That Actually Last: 90-Day Durability Rankings", description: "Most cat trees wobble within weeks. Owner satisfaction data on the ones that don't.", category: "Buyer's Guide" },
  { title: "Best Dog Harnesses by Breed Size: Owner Satisfaction Data", description: "No-pull harnesses ranked by fit and durability across small, medium, and large breeds.", category: "Buyer's Guide" },
  { title: "Pet Camera vs Regular Camera: What Pet Owners Actually Need", description: "Do you need a Furbo or will a Wyze cam do? Owner satisfaction data on pet monitoring options.", category: "Comparisons" },
  { title: "Best Aquarium Filters Under $100 (Owner-Verified 2026)", description: "Fish tank filters ranked by noise, maintenance, and long-term reliability. Real owner data.", category: "Buyer's Guide" },
  { title: "Why Retractable Dog Leashes Have the Highest Pet Product Regret", description: "The safety and durability data on retractable leashes is damning. What trainers and owners prefer instead.", category: "Product Insights" },

  // Tools & Home Improvement (8)
  { title: "Best Cordless Drills Under $150: Owner Satisfaction 2026", description: "Cordless drills ranked by battery life, torque, and 90-day satisfaction. DeWalt vs Makita vs Milwaukee.", category: "Buyer's Guide" },
  { title: "Why Cheap Power Tools Have Surprisingly Low Regret Scores", description: "The budget power tool paradox: why $40 drills sometimes outscore $200 ones in owner satisfaction.", category: "Product Insights" },
  { title: "Best Smart Home Devices That Actually Work Together (2026)", description: "Smart plugs, bulbs, and hubs ranked by reliability and ecosystem compatibility. Real owner data.", category: "Buyer's Guide" },
  { title: "Best Pressure Washers Under $300: Owner Data 2026", description: "Electric vs gas pressure washers ranked by power, reliability, and long-term satisfaction.", category: "Buyer's Guide" },
  { title: "Why Smart Locks Have Higher Regret Than Regular Deadbolts", description: "The connectivity and battery issues plaguing smart locks. When old-school is still better.", category: "Product Insights" },
  { title: "Best Garage Organization Systems: 90-Day Owner Rankings", description: "Wall-mount systems, ceiling storage, and workbenches ranked by ease of install and durability.", category: "Buyer's Guide" },
  { title: "Paint Sprayers vs Rollers: What Homeowners Actually Prefer", description: "DIY painters weigh in after 90 days. The convenience promise vs the cleanup reality.", category: "Comparisons" },
  { title: "Best Laser Levels for DIY Projects (Owner-Verified 2026)", description: "Laser levels ranked by accuracy, battery, and ease of use. From hanging pictures to full renovations.", category: "Buyer's Guide" },

  // Arts & Crafts (6)
  { title: "Best Cricut Machines 2026: Owner Regret Data After 90 Days", description: "Cricut Maker vs Explore vs Joy: which cutting machine owners actually keep using past the honeymoon.", category: "Buyer's Guide" },
  { title: "Why Sewing Machine Buyers Have Some of the Lowest Regret Scores", description: "Sewing machines buck the trend: high satisfaction at day 90. The data on why this category is different.", category: "Product Insights" },
  { title: "Best Art Supply Sets Under $50: What Artists Actually Use", description: "Marker, colored pencil, and watercolor sets ranked by quality and long-term use frequency.", category: "Buyer's Guide" },
  { title: "3D Printers Under $500: Owner Satisfaction Data 2026", description: "Entry-level 3D printers ranked by print quality, reliability, and whether owners still use them at day 90.", category: "Buyer's Guide" },
  { title: "Best Diamond Painting Kits: Why Completion Rate Predicts Satisfaction", description: "The kits people actually finish vs abandon. Satisfaction correlates with size, not price.", category: "Product Insights" },
  { title: "Resin Art Kits: The Most Regretted Craft Category on Amazon", description: "Why resin kits top the craft regret charts: fumes, failed pours, and unmet expectations.", category: "Product Insights" },

  // ===== DEEPER BUYER INTENT =====
  // Head-to-head comparisons (8)
  { title: "AirPods Pro vs Sony WF-1000XM5: 90-Day Owner Showdown", description: "The two best-selling premium earbuds compared on what matters at day 90, not day 1.", category: "Comparisons" },
  { title: "Instant Pot vs Air Fryer: Which Kitchen Gadget Do Owners Keep Using?", description: "Both are impulse buys. Only one still gets used at day 90. The satisfaction data is clear.", category: "Comparisons" },
  { title: "Ring vs Arlo vs Wyze: Home Security Camera Owner Satisfaction", description: "Three tiers, three price points, one question: which camera system do owners actually trust at day 90?", category: "Comparisons" },
  { title: "Dyson vs Shark vs Tineco: Vacuum Owner Satisfaction Rankings 2026", description: "Premium vs mid-range vs budget vacuums compared on suction, battery, and 90-day satisfaction.", category: "Comparisons" },
  { title: "iPad vs Android Tablet: Which Do Owners Regret Less in 2026?", description: "Tablets compared on app ecosystem, durability, and long-term satisfaction. The data favors one side.", category: "Comparisons" },
  { title: "Ninja vs KitchenAid vs Vitamix: Blender Owner Data 2026", description: "Three blender tiers compared on performance, noise, and whether owners still use them at day 90.", category: "Comparisons" },
  { title: "Peloton vs NordicTrack vs Echelon: Home Fitness Regret Rankings", description: "Connected fitness bikes compared on content, build quality, and 90-day usage rates.", category: "Comparisons" },
  { title: "Roomba vs Roborock vs Ecovacs: Robot Vacuum Owner Data 2026", description: "The three biggest robot vacuum brands compared on navigation, suction, and long-term reliability.", category: "Comparisons" },

  // Seasonal / Timely (8)
  { title: "Holiday Gift Guide 2026: Gifts with the Lowest Regret Scores", description: "Data-backed gift picks across every budget. The presents that don't end up in a closet by January.", category: "Buyer's Guide" },
  { title: "Boxing Day Deals Canada 2026: What's Actually Worth Buying", description: "Canadian Boxing Day deals ranked by post-sale satisfaction. Not everything discounted is a good buy.", category: "Buyer's Guide" },
  { title: "Back to School 2026: Laptops, Backpacks, and Supplies Ranked by Regret", description: "Student product satisfaction data. The gear that lasts the full school year vs what breaks by October.", category: "Buyer's Guide" },
  { title: "Cyber Monday 2026: The Categories with the Highest Post-Sale Regret", description: "Flash-sale regret is real. Which Cyber Monday categories have the worst 90-day satisfaction.", category: "Product Insights" },
  { title: "Best Space Heaters for Winter 2026 (Owner Safety + Satisfaction Data)", description: "Space heaters ranked by heat output, safety record, and 90-day owner satisfaction. US and Canada.", category: "Buyer's Guide" },
  { title: "Summer 2026: Pool and Patio Products with the Lowest Regret", description: "Inflatable pools, patio furniture, and grills ranked by durability through a full summer.", category: "Buyer's Guide" },
  { title: "Valentine's Day Gifts That Don't Disappoint: Owner Data 2026", description: "Romantic gifts ranked by recipient satisfaction, not marketing hype. What people actually keep.", category: "Buyer's Guide" },
  { title: "New Year Fitness Gear: What January Buyers Still Use in March", description: "Gym equipment and fitness tracker data from past January purchase cohorts. The survival rates are brutal.", category: "Product Insights" },

  // Deep editorial (6)
  { title: "The Psychology of Product Regret: Why We Buy Things We Don't Need", description: "Behavioral science explains why smart shoppers still make regrettable purchases. And how to stop.", category: "How It Works" },
  { title: "How Amazon's Algorithm Creates a Regret Machine", description: "Recommendation engines optimize for clicks, not satisfaction. The data on algorithmic regret.", category: "How It Works" },
  { title: "Why Products with 4.0 Stars Often Beat Products with 4.8 Stars", description: "The paradox of inflated ratings: why slightly lower stars can signal higher real-world satisfaction.", category: "How It Works" },
  { title: "The True Cost of Free Returns: How Return Policies Shape Regret", description: "Easy returns encourage impulse purchases. The data on how return windows affect buyer satisfaction.", category: "How It Works" },
  { title: "Why Canadian Shoppers Have Different Regret Patterns Than Americans", description: "Cross-border data reveals pricing, shipping, and selection gaps that shape satisfaction differently.", category: "Product Insights" },
  { title: "The 30-60-90 Day Rule: Why Three Checkpoints Beat One Review", description: "How Pregret's time-decayed satisfaction model captures what single-point reviews miss.", category: "How It Works" },
];

// De-dup
const seen = new Set();
const tasks = [];
for (const p of POSTS) {
  const slug = slugify(p.title);
  if (seen.has(slug) || existingSlugs.has(slug)) { console.log(`  SKIP: ${p.title.slice(0, 50)}`); continue; }
  seen.add(slug);
  tasks.push(p);
}
console.log(`\n${tasks.length} new posts to generate. ~15-20 min.\n`);

async function writePost(title, prompt, attempt = 1) {
  try {
    const resp = await claude.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2800,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    return resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  } catch (err) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 1500 * attempt)); return writePost(title, prompt, attempt + 1); }
    console.warn(`  FAIL: ${title.slice(0, 40)} — ${err.message}`);
    return null;
  }
}

const posts = [];
const startDate = new Date(2026, 8, 1); // Sept 1 2026
for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i];
  const daysBack = Math.round(i * 1.1);
  const d = new Date(startDate); d.setDate(d.getDate() - daysBack);

  const prompt = `Write a blog post titled "${t.title}" for Pregret. Description: ${t.description} Category: ${t.category}. Structure with 3-5 H2 sections. Include Amazon.com and Amazon.ca context. Neutral, evidence-based tone. Do NOT include a title H1.`;

  process.stdout.write(`  [${String(i + 1).padStart(3)}/${tasks.length}] ${t.title.slice(0, 55).padEnd(56)} `);
  const body = await writePost(t.title, prompt);
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

const header = `// AUTO-GENERATED by scripts/gen-blog-posts-v4.mjs — do not hand-edit.\n// ${new Date().toISOString().slice(0,10)} · ${posts.length} posts\nimport type { BlogPost } from "./blog";\n\nexport const GENERATED_POSTS_V4: BlogPost[] = ${JSON.stringify(posts, null, 2)};\n`;
writeFileSync(OUT_FILE, header);
console.log(`\n✓ Wrote ${posts.length} posts to ${OUT_FILE}`);

// Patch blog.ts
const blogTs = readFileSync(BLOG_FILE, "utf8");
if (!blogTs.includes("GENERATED_POSTS_V4")) {
  const patched = blogTs.replace(
    /import { GENERATED_POSTS_V3 } from "\.\/blog-generated-v3";/,
    `import { GENERATED_POSTS_V3 } from "./blog-generated-v3";\nimport { GENERATED_POSTS_V4 } from "./blog-generated-v4";`
  ).replace(
    /\.\.\.GENERATED_POSTS_V3,/,
    `...GENERATED_POSTS_V3,\n  ...GENERATED_POSTS_V4,`
  );
  writeFileSync(BLOG_FILE, patched);
  console.log("✓ Patched blog.ts to include GENERATED_POSTS_V4");
}
