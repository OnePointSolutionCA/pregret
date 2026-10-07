export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedDate: string;
  /** Set when an existing post is meaningfully edited; feeds schema dateModified and the sitemap. */
  modifiedDate?: string;
  category: string;
  readMins: number;
  body: string;
};

import { GENERATED_POSTS } from "./blog-generated";
import { GENERATED_POSTS_V2 } from "./blog-generated-v2";
import { GENERATED_POSTS_V3 } from "./blog-generated-v3";
import { GENERATED_POSTS_V4 } from "./blog-generated-v4";
import { NEW_POSTS, RETIRED_SLUGS, applyPatch } from "./blog-seo-2026-10";

const BASE_POSTS: BlogPost[] = [
  ...NEW_POSTS,
  ...GENERATED_POSTS,
  ...GENERATED_POSTS_V2,
  ...GENERATED_POSTS_V3,
  ...GENERATED_POSTS_V4,

  {
    slug: "why-day-90-matters",
    title: "Why Day 90 Matters More Than Launch Day Reviews",
    description: "Most product reviews are written in the first week. Here's why the real story starts three months later.",
    publishedDate: "2026-08-01",
    category: "How It Works",
    readMins: 4,
    body: `Whether you shop on Amazon.com or Amazon.ca, Best Buy US or Best Buy Canada, the same review problem exists on both sides of the border. Every review site has the same blind spot. The five-star reviews flooding Amazon on launch week come from people still riding the dopamine hit of unboxing something new. Nobody asks them how they feel three months later — after the return window closes, the subscription bills stack up, and the battery starts degrading.

That's the gap Pregret fills.

## The honeymoon bias

Research from the Journal of Consumer Psychology shows that satisfaction with purchases peaks in the first 48 hours and drops steadily over the following 90 days. By day 90, roughly 40% of buyers report some level of regret — but by that point, their glowing five-star review is already cemented in the product's rating.

This creates a feedback loop: high early ratings drive more purchases, which generate more honeymoon reviews, which inflate ratings further. The real signal — the 90-day signal — gets buried.

## How Pregret breaks the cycle

We ask owners one simple question at three checkpoints:

- **Day 30** — The novelty has worn off. Are you still using it?
- **Day 60** — The first issues surface. Batteries degrade, coatings chip, subscriptions feel expensive.
- **Day 90** — The truth. Would you buy this again knowing what you know now?

Each response carries more weight than the last. A Day 90 rating counts three times as much as a Day 30 rating in our Regret Score formula. Because if someone is still happy at 90 days, that product earned its price.

## What a Regret Score actually tells you

- **0–30 (green):** Owners are still happy months in. Safe to buy.
- **31–60 (amber):** Mixed feelings. Read the specific regret reasons before you commit.
- **61–100 (red):** Most owners wish they hadn't bought it. We'll show you what they switched to instead.

The score isn't a review. It's a data point — built from real owners over real time, not marketing copy disguised as user feedback.

## The bottom line

A product that scores well on Day 1 and poorly on Day 90 isn't a good product. It's a good marketing campaign. Pregret exists so you can tell the difference before your money is gone.`,
  },
  {
    slug: "most-regretted-fitness-products-2026",
    title: "The 5 Most Regretted Fitness Products in 2026",
    description: "Smart treadmills, subscription trackers, and one very expensive mirror. Here's what owners actually think after 90 days.",
    publishedDate: "2026-07-28",
    category: "Product Insights",
    readMins: 5,
    body: `These regret rankings come from Pregret owners in the United States and Canada — cross-border shopping data on the fitness products marketed heavily on both Amazon.com and Amazon.ca. Every January, fitness equipment sales spike. By April, most of it is gathering dust. We looked at the fitness products with the highest Regret Scores on Pregret — and the pattern is clear: subscription-locked hardware is where buyer's remorse goes to thrive.

## 1. Lululemon Studio Mirror — Regret Score: 85

The poster child for subscription hardware failure. Lululemon acquired Mirror, raised the subscription price, then killed the service entirely. Owners were left with a $1,500 piece of reflective glass and no refund. The lesson: when a product needs a subscription to function, you're renting, not buying.

## 2. Peloton Bike+ — Regret Score: 78

The hardware is solid. The problem is the $44/month subscription that makes it feel like a lease payment on a bicycle that goes nowhere. Owners report the screen wobbles during hard sprints, and resale value has cratered. Day 30 satisfaction is high (4.2/5), but by Day 90 it's dropped to 1.9/5.

## 3. Tempo Studio — Regret Score: 76

Another subscription hardware casualty. The 3D body-tracking sensor was impressive in demos but gimmicky in practice. Then the company folded. Resale value: zero.

## 4. NordicTrack Commercial 1750 — Regret Score: 68

iFIT locked basic features behind a subscription wall. Owners report that without the subscription, the treadmill loses most of its smart features. Service and replacement parts are described as "nearly impossible to get."

## 5. Hydrow Rower — Regret Score: 71

Mandates a $44/month subscription with no offline workouts. Owners consistently mention that a Concept2 RowErg (Regret Score: 6) costs half as much, lasts decades, and works without WiFi.

## The pattern

Four of the five most-regretted fitness products share the same failure mode: mandatory subscriptions. The products work fine — until they don't, or until the company decides to change the terms. The lowest-regret alternatives (Concept2, TRX, REP Fitness) are all subscription-free, built to last, and hold their resale value.

Before you buy fitness equipment, ask yourself: if this company shut down tomorrow, would I still have a functional product?`,
  },
  {
    slug: "how-regret-score-is-calculated",
    title: "How the Regret Score Is Calculated",
    description: "A transparent breakdown of the formula behind every Pregret score — time-weighted satisfaction, no black boxes.",
    publishedDate: "2026-07-20",
    category: "How It Works",
    readMins: 3,
    body: `This formula is applied identically to every product on Pregret, whether it was purchased in the United States or Canada. We think product scores should be transparent. Here's exactly how a Regret Score is calculated.

## The inputs

Every owner who tracks a product on Pregret answers a satisfaction question at three checkpoints:

- **Day 30** — rate 1 to 5
- **Day 60** — rate 1 to 5
- **Day 90** — rate 1 to 5

They also answer: **Would you buy this again?** (yes/no)

## The weights

Not all checkpoints are equal. Day 90 matters most because it's the truest signal:

| Checkpoint | Weight |
|-----------|--------|
| Day 30    | 1×     |
| Day 60    | 2×     |
| Day 90    | 3×     |

A product that scores 5/5 at Day 30 but 1/5 at Day 90 will have a high Regret Score. A product that scores 3/5 at Day 30 but 4/5 at Day 90 will have a low one. The formula rewards products that get better with time and penalizes products that disappoint after the return window closes.

## The formula

The Regret Score (0–100) is the weighted percentage of low ratings (1 or 2 out of 5) across all checkpoints:

1. Count low ratings at each checkpoint, multiply by the weight
2. Count total ratings at each checkpoint, multiply by the weight
3. Divide weighted low ratings by weighted total ratings
4. Multiply by 100

A score of 0 means nobody rated it below 3 at any checkpoint. A score of 100 means everyone gave it a 1 or 2 at every checkpoint.

## AI estimates

When a product is new to Pregret and doesn't have enough real owner data, we generate an AI estimate based on patterns in public reviews. These are clearly labeled with an "AI estimated" badge. As real owners check in, the AI estimate gets replaced with real data.

## Why not just use star ratings?

Star ratings are broken for three reasons:

1. **Timing bias** — most reviews are written on Day 1
2. **Selection bias** — people with extreme opinions review more
3. **Incentive bias** — sellers offer discounts for positive reviews

Pregret's structured, time-gated approach eliminates all three. You can't leave a Day 90 review on Day 1. You can't skip ahead. And nobody is offering you a coupon to inflate your check-in score.`,
  },
  {
    slug: "subscription-hardware-trap",
    title: "The Subscription Hardware Trap: Why Your Gadget Becomes E-Waste",
    description: "When a product needs a monthly subscription to function, you don't own it. You're renting it until the company decides otherwise.",
    publishedDate: "2026-07-15",
    category: "Consumer Trends",
    readMins: 4,
    body: `This pattern hits shoppers in both the United States and Canada — the failed products cited below shipped to buyers on both sides of the border. There's a new category of product failure that didn't exist ten years ago: perfectly functional hardware that becomes useless because a company killed the subscription service it depends on.

## The pattern

1. Company launches impressive hardware at a subsidized price
2. Hardware requires a monthly subscription for basic features
3. Company raises subscription prices or changes terms
4. Company gets acquired, pivots, or shuts down
5. Hardware becomes e-waste

This isn't hypothetical. It's already happened to:

- **Lululemon Mirror** — service killed, hardware bricked
- **Tempo Studio** — company folded, no more content
- **Juicero** — company shut down, $400 juicer became a paperweight
- **Revolv smart home hub** — Google acquired Nest, killed Revolv, bricked every device

## The Pregret data

Products with mandatory subscriptions average a Regret Score of 64 — more than double the average for subscription-free products (28). The satisfaction decay is steep: owners rate these products 4.2/5 at Day 30 but just 2.1/5 at Day 90.

The "would buy again" percentage tells the story even more clearly:

| Product type | Would buy again |
|-------------|----------------|
| Subscription-required | 34% |
| Subscription-optional | 61% |
| No subscription | 82% |

## How to protect yourself

Before buying any connected product, ask:

1. **Does it work without WiFi?** If the answer is no, you're renting.
2. **What happens if the company shuts down?** If the answer is "the product stops working," walk away.
3. **Can I use it without the subscription?** If basic features are locked behind a paywall, the hardware price isn't the real price.

The products with the lowest Regret Scores on Pregret share a common trait: they work independently. A Lodge cast iron skillet (Regret Score: 5) doesn't need a subscription. A Concept2 rower (Regret Score: 6) works without WiFi. A KitchenAid stand mixer (Regret Score: 11) will outlast the company that made it.

Buy things that work on their own. Your future self will thank you.`,
  },
  {
    slug: "kitchen-gadgets-worth-keeping",
    title: "7 Kitchen Gadgets With Almost Zero Regret",
    description: "Not everything in your kitchen is a waste of money. These products score under 20 on the Regret Scale.",
    publishedDate: "2026-07-10",
    category: "Product Insights",
    readMins: 4,
    body: `Prices below are approximate — Amazon.com and Amazon.ca show slightly different pricing due to exchange rates, but Regret Scores are consistent across US and Canadian owners. For every Ninja Creami gathering dust in someone's pantry, there's a Lodge skillet that gets used every single day. Here are the kitchen products with the lowest Regret Scores on Pregret — the ones owners are still happy with at Day 90.

## 1. Lodge Cast Iron Skillet 12" — Regret Score: 5

The lowest regret kitchen product in our database. The only complaint: it's heavy. That's it. Owners rate it 4.9/5 at Day 90 — actually higher than Day 30 (4.8/5), because cast iron gets better with use. At under $40, it might be the best value in any kitchen.

## 2. Yeti Rambler 30oz Tumbler — Regret Score: 7

Keeps drinks cold for a full day, hot for half a day. The one complaint — doesn't fit most cup holders — hasn't stopped 95% of owners from saying they'd buy it again.

## 3. Vitamix A3500 — Regret Score: 9

Expensive upfront, but owners report zero decline in satisfaction over 90 days. It's loud, but it works flawlessly and lasts for years. The 96% "would buy again" rate is the highest in the Kitchen category.

## 4. KitchenAid Artisan Stand Mixer — Regret Score: 11

Another "buy it for life" product. The only regret reason: it's heavy and hard to move. But nobody moves it — it lives on the counter permanently, and that's fine.

## 5. Instant Pot Duo 7-in-1 — Regret Score: 14

The sealing ring absorbs smells (buy an extra), and there's a learning curve for pressure cooking. But at Day 90, owners rate it 4.5/5 with 92% saying they'd buy it again.

## 6. Anker 737 Power Bank — Regret Score: 15

Not strictly a kitchen gadget, but it lives in enough kitchen junk drawers to count. Heavy for travel, but charges everything fast and holds up over time.

## 7. Cuisinart Food Processor 14-Cup — Regret Score: 16

Lots of parts to wash, takes up counter space. But at Day 90, owners still rate it 4.3/5. It does one thing well and does it forever.

## The pattern

Every product on this list shares three traits:

1. **No subscription required** — they work out of the box, forever
2. **Simple mechanics** — fewer things to break
3. **Built to last** — quality materials that improve or hold steady with use

The kitchen gadgets people regret most are the ones that promise to change your life with technology. The ones they keep are the ones that just work.`,
  },
];

// Retired posts are merged elsewhere and 301 in next.config.ts; patches layer hand edits
// over the auto-generated posts.
export const POSTS: BlogPost[] = BASE_POSTS.filter((p) => !RETIRED_SLUGS.has(p.slug)).map(applyPatch);

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort(
    (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
  );
}
