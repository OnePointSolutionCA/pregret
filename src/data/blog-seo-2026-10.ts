// Hand-written SEO work, October 2026: two new posts, edits layered on top of the
// auto-generated posts (so re-running the generators never wipes them), and a retired
// near-duplicate. Scores and would-buy-again rates below were checked against the live
// products table on 2026-10-07; every product link points at an existing /product/ page.
import type { BlogPost } from "./blog";

export type PostPatch = {
  title?: string;
  description?: string;
  modifiedDate?: string;
  readMins?: number;
  /** Exact string replacements applied to the body first. */
  replace?: [string, string][];
  /** Markdown block inserted right after the first paragraph. */
  afterIntro?: string;
  /** Markdown appended to the end of the body. */
  append?: string;
};

const TODAY = "2026-10-07";

const BF_CANADA = "/blog/amazon-black-friday-canada-2026-deals-with-the-lowest-regret-scores";
/** Main "Black Friday 2026" / "black friday canada" page. The other Black Friday posts link here near the top. */
const BF_MAIN = "/blog/the-ultimate-2026-us-and-canada-black-friday-playbook";
const BF_WHAT_TO_BUY = "/blog/black-friday-2026-what-to-actually-buy-data-backed-guide";
const WORST_GIFTS = "/blog/worst-christmas-gifts-2026-ranked-by-regret-score";
const BOXING_DAY = "/blog/boxing-day-deals-canada-2026-what-s-actually-worth-buying";

/** Posts merged into another post. Each one has a 301 in next.config.ts. */
export const RETIRED_SLUGS = new Set<string>([
  "mirror-by-lululemon-vs-concept2-rowerg-which-has-lower-long-term-regret",
]);

export const NEW_POSTS: BlogPost[] = [
  {
    slug: "amazon-black-friday-canada-2026-deals-with-the-lowest-regret-scores",
    title: "Amazon Black Friday Canada 2026: Deals With the Lowest Regret Scores",
    description:
      "Amazon.ca Black Friday 2026 guide for Canadians: how to spot a real deal, avoid regret buys, and which popular products have the lowest Regret Scores.",
    publishedDate: TODAY,
    category: "Seasonal Guides",
    readMins: 6,
    body: `Black Friday 2026 lands on Friday, November 27, with Cyber Monday on November 30. On Amazon.ca the sale usually starts days earlier and runs through the weekend, so there is plenty of time to shop slowly. This guide does not list prices, because Black Friday prices change by the hour. Instead it gives you a simple way to judge any Amazon.ca deal, plus a list of popular products that score low for regret on Pregret, so you know what is worth watching when the discounts drop.

Planning beyond Amazon? Our main [Black Friday Canada 2026 guide](${BF_MAIN}) covers the sale dates, Canadian and US retailers, cross border traps and a full shopping plan. This page sticks to Amazon.ca.

## What a Regret Score tells you on Black Friday

Every product on Pregret has a Regret Score from 0 to 100. Under 30 means owners are still happy months later. 31 to 60 is mixed. Over 60 means most owners wish they had passed. A discount changes the price, not the product. A deal on something with a high Regret Score is still a regret, just a cheaper one.

## Five rules for Amazon.ca Black Friday

- **Make your list before the sale.** Write down what you already planned to buy. If an item was not on the list on November 1, give it 48 hours before you buy it.
- **Check the price history.** Keepa and the Canadian version of camelcamelcamel both track Amazon.ca prices. If the "deal" price matches what the item sold for in the summer, it is not a Black Friday deal.
- **Look at who sells it.** "Ships from and sold by Amazon.ca" is the easiest return. Third party sellers set their own return rules, and some ship from outside Canada, which can mean longer waits.
- **Read the return window before you pay.** Amazon.ca usually extends returns for holiday purchases, but the exact dates change each year. Check the returns page, then set a reminder a week before the window closes.
- **Check the Regret Score last.** Once a deal passes the first four rules, look up the product on Pregret. A low score is your sign that people keep using it after the novelty wears off.

## Popular products with the lowest Regret Scores

These are well known products from our catalogue with Regret Scores of 10 or lower. All of them are the kind of thing that tends to show up in Amazon.ca Black Friday sales. Tap any name to see the full score, the would buy again rate and the Amazon.ca link.

| Product | Category | Regret Score | Would buy again |
|---|---|---|---|
| Nintendo Switch Lite (Yellow) | Electronics | 8 | 95% |
| Nintendo Switch with Neon Joy-Con | Electronics | 10 | 95% |
| PlayStation DualSense Controller (Midnight Black) | Gaming | 9 | 95% |
| Sony WH1000XM3 Noise Cancelling Headphones | Electronics | 8 | 90% |
| Apple AirPods with Charging Case | Electronics | 8 | 90% |
| NOCO Boost Plus GB40 Jump Starter | Automotive | 8 | 93% |
| Philips Hue A19 Colour Bulbs | Home & Garden | 8 | 90% |
| LEGO Super Mario Starter Course 71360 | Toys & Games | 9 | 95% |
| DEWALT 20V MAX XR 1/2" Impact Wrench | Automotive | 9 | 95% |
| Graco Extend2Fit Convertible Car Seat | Baby | 10 | 95% |

## Gaming: the safest Black Friday category

Consoles and controllers are some of the most reliable Black Friday buys because you know exactly what you are getting. The [Nintendo Switch Lite](/product/nintendo-switch-lite-yellow) scores 8 and the [Nintendo Switch with Neon Joy-Con](/product/nintendo-switch-with-neon-blue-and-neon-red-joy-con) scores 10, both with 95% of owners saying they would buy again. The [PlayStation DualSense controller](/product/playstation-dualsense-wireless-controller-midnight-black) scores 9. If someone in your house already games, a second controller is about as low risk as a purchase gets.

## Headphones: buy the proven model, not the newest one

Black Friday often discounts the previous generation of a popular product, and that is usually a good thing. The [Sony WH1000XM3](/product/sony-wh1000xm3-noise-cancelling-headphones-wireless-bluetooth-over-the-ear-heads) and [Apple AirPods with Charging Case](/product/apple-airpods-with-charging-case-previous-model) both score 8, and the wired [Audio-Technica ATH-M20X](/product/audio-technica-ath-m20x-professional-studio-monitor-headphones-black) also scores 8. Older models with years of owner history behind them carry less risk than a launch that only has a few weeks of reviews.

## Car and garage: practical buys that stay useful

Winter in Canada makes a jump starter one of the most useful things you can keep in the car. The [NOCO Boost Plus GB40](/product/noco-boost-plus-gb40-1000a-ultrasafe-car-battery-jump-starter-12v-jump-starter-b) has a Regret Score of 8 and a 93% would buy again rate. For the garage, the [DEWALT 20V MAX XR impact wrench](/product/dewalt-20v-max-xr-1-2-high-torque-impact-wrench-cordless-detent-anvil-tool-only-) and the [CRAFTSMAN 216 piece mechanics tool kit](/product/craftsman-mechanics-tools-kit-with-3-drawer-box-216-piece-cmmt99206) both score 9. Tools tend to score well because people buy them for a job they already have.

## Home, toys and baby

The [Philips Hue A19 colour bulbs](/product/philips-hue-9-5w-a19-white-and-color-ambiance-led-smart-rgb-color-changing-bulbs) score 8. The [LEGO Super Mario Adventures Starter Course](/product/lego-super-mario-adventures-starter-course-set-71360-buildable-toy-game-birthday) scores 9, which makes it a safe pick if you are shopping for Christmas at the same time. The [Graco Extend2Fit convertible car seat](/product/graco-extend2fit-convertible-car-seat-ride-rear-facing-longer-with-extend2fit-go) scores 10 with 95% would buy again. A car seat is a purchase you were going to make anyway, which is exactly when a Black Friday discount makes sense.

## What to skip, even at a big discount

High Regret Scores cluster in a few places: novelty gadgets, no name smart home gear, cheap smartwatches and beauty tools that promise salon results at home. These are the items that look like a steal at 60% off and end up in a drawer by January. Our [Cyber Monday regret breakdown](/blog/cyber-monday-2026-the-categories-with-the-highest-post-sale-regret) covers the worst categories in detail, and our [worst Christmas gifts ranking](${WORST_GIFTS}) names specific products to avoid.

## Missed Black Friday?

You get a second chance on December 26. Our [Boxing Day Deals Canada 2026 guide](${BOXING_DAY}) covers what is worth buying in the Canadian Boxing Day sales. For a wider plan that covers more than Amazon.ca, read our [Black Friday Canada 2026 guide](${BF_MAIN}) and our breakdown of [what to buy on Black Friday 2026, category by category](${BF_WHAT_TO_BUY}).

## The bottom line

The best Amazon.ca Black Friday deal is a product you already wanted, at a price that beats its real history, with a Regret Score that says owners keep using it. Make the list now, check scores on [Pregret](/search) as deals go live, and let everything else go.`,
  },
  {
    slug: "worst-christmas-gifts-2026-ranked-by-regret-score",
    title: "Worst Christmas Gifts 2026, Ranked by Regret Score",
    description:
      "The worst Christmas gifts of 2026, ranked by real Regret Scores. Popular products owners regret most, plus what to give instead this holiday season.",
    publishedDate: TODAY,
    category: "Seasonal Guides",
    readMins: 6,
    body: `Every year people spend real money on gifts that end up in a closet by February. We ranked popular, giftable products from the Pregret catalogue by their Regret Score, the 0 to 100 measure of how much owners regret buying something. Higher is worse. These are not obscure items. Each one has thousands of Amazon reviews, which is exactly why they keep getting bought as gifts.

## The ranking

| Rank | Gift | Regret Score | Would buy again |
|---|---|---|---|
| 1 | Wink Hub 2 Smart Home Hub | 96 | 35% |
| 2 | VASSOUL Dual Magnetic Eyelashes | 95 | 48% |
| 3 | Crayola Bathtub Markers | 93 | 32% |
| 4 | Amariver Eyebrow Stencil Kit | 89 | 48% |
| 5 | IntroWizard Bloody Bath Mat | 81 | 55% |
| 6 | TEMI Kids Race Track Toy | 81 | 53% |
| 7 | Padgene DZ09 Bluetooth Smartwatch | 79 | 57% |
| 8 | Rhode Island Novelty Water Squirters | 77 | 55% |
| 9 | Conair Touch-n-Tone Handheld Massager | 74 | 50% |
| 10 | GeoSafari Jr. My First Kids Telescope | 73 | 57% |
| 11 | Skullcandy Indy True Wireless Earbuds | 72 | 68% |
| 12 | Sony LinkBuds Open Ring Earbuds | 71 | 65% |

## 1. Wink Hub 2: Regret Score 96

The [Wink Hub 2](/product/wink-wnkhub-2us-2-smart-home-hub-white) has the highest Regret Score on this list, and the original [Wink Connected Home Hub](/product/wink-connected-home-hub) is right behind it at 95. Smart home hubs depend on the company behind them. Wink moved its service to a paid subscription in 2020, and a hub that needs a monthly fee to keep working is a hard gift to love. Smart home gear is best left to the person who will live with it.

## 2. Magnetic eyelashes and brow stencils: 95 and 89

[VASSOUL Dual Magnetic Eyelashes](/product/vassoul-dual-magnetic-eyelashes-0-2mm-ultra-thin-magnet-light-weight-and-easy-to) score 95 and the [Amariver Eyebrow Stencil Kit](/product/amariver-eyebrow-stencils-eyebrow-template-eyebrow-shaping-kit-8-styles-reusable) scores 89. Beauty tools that promise a salon result at home are a classic stocking stuffer, and they are a classic regret. If someone has a beauty routine they love, a gift card for the brand they already use is the safer move.

## 3. Crayola Bathtub Markers: 93

The [Crayola Bathtub Markers](/product/crayola-bathtub-markers-assorted-colors-5-each) score 93 with only 32% of owners saying they would buy them again, the lowest would buy again rate on this list. A trusted brand does not guarantee a good product. Check the score, not just the logo.

## 4. Gag gifts: the Bloody Bath Mat and water squirters

The [IntroWizard Bloody Bath Mat](/product/introwizard-bloody-bath-mat-combo-set-of-2-mats-that-turn-red-when-wet-one-large) scores 81 and the [Rhode Island Novelty water squirters](/product/rhode-island-novelty-6-inch-water-squirter-two-per-order) score 77. Gag gifts get one laugh on Christmas morning, and then someone has to find a place for them. If you want a funny gift, pick something people can eat or use up.

## 5. Kids toys that do not last: TEMI race track and a first telescope

The [TEMI Kids Race Track](/product/temi-kids-race-track-toys-for-boy-car-adventure-toy-for-3-4-5-6-7-years-old-boys) scores 81, and the [TEMI die cast construction truck set](/product/temi-toddler-toys-for-3-4-5-6-years-old-boys-die-cast-construction-toys-car-carr) scores 80. The [GeoSafari Jr. My First Kids Telescope](/product/educational-insights-geosafari-jr-my-first-kids-telescope-stem-toy-gift-for-kids) scores 73. Toys with lots of small plastic parts are the gifts parents regret most, because the fun wears off faster than the clutter does. Compare that with the [LEGO Super Mario Starter Course](/product/lego-super-mario-adventures-starter-course-set-71360-buildable-toy-game-birthday), which scores just 9.

## 6. Cheap smartwatches: Padgene DZ09

The [Padgene DZ09 Bluetooth Smartwatch](/product/padgene-dz09-bluetooth-smartwatch-touchscreen-wrist-smart-phone-watch-sports-fit) scores 79. A budget smartwatch looks like a great value gift, but a watch that does not pair well with a phone gets taken off and never put back on.

## 7. Massagers: Conair and Wahl

The [Conair Touch-n-Tone Handheld Massager](/product/conair-touch-n-tone-handheld-massager-with-attachments-face-and-body-massage-wan) scores 74 with a 50% would buy again rate, and the [Wahl All Body Massager](/product/wahl-all-body-corded-light-soothing-vibratory-massager-with-4-attachment-heads-2) scores 71. Small massagers are an easy gift to grab, which is part of the problem.

## 8. Earbuds people stop wearing: Skullcandy Indy and Sony LinkBuds

The [Skullcandy Indy](/product/skullcandy-indy-true-wireless-in-ear-earbuds-black) scores 72 and the [Sony LinkBuds](/product/sony-linkbuds-truly-wireless-earbud-headphones-with-an-open-ring-design-for-ambi) score 71. Even a big brand can miss. If you want to give audio, the [Apple AirPods with Charging Case](/product/apple-airpods-with-charging-case-previous-model) and the [Sony WH1000XM3](/product/sony-wh1000xm3-noise-cancelling-headphones-wireless-bluetooth-over-the-ear-heads) both score 8.

## How to avoid giving a regret

- **Buy for a habit they already have.** Gifts that upgrade something a person does every week get used. Gifts that ask them to start a new hobby usually do not.
- **Avoid anything that needs a subscription.** If the gift stops working when the payments stop, you gave them a bill.
- **Check the Regret Score before you check out.** Search any product on [Pregret](/search). Under 30 is a safe gift. Over 60 is a gamble.
- **Include a gift receipt.** Even a good gift can be the wrong one.

## Better gift ideas

For gifts that people keep using, start with our [Holiday Gift Guide 2026: Gifts with the Lowest Regret Scores](/blog/holiday-gift-guide-2026-gifts-with-the-lowest-regret-scores). Shopping on a budget? See [low regret gifts under $50](/blog/holiday-gift-guide-2026-low-regret-gifts-under-50) and [low regret gifts under $100](/blog/holiday-gift-guide-2026-low-regret-gifts-under-100). Buying gifts in the Amazon.ca Black Friday sale? Our [Amazon Black Friday Canada 2026 guide](${BF_CANADA}) lists popular products with the lowest Regret Scores.`,
  },
];

export const PATCHES: Record<string, PostPatch> = {
  // Task: link the new Amazon.ca post from both existing Black Friday posts.
  // Task (2026-10-07): three Black Friday posts competed for "black friday 2026" / "black friday canada".
  // The playbook is now the main page; this one is retitled to the "what to buy" category angle.
  "black-friday-2026-what-to-actually-buy-data-backed-guide": {
    title: "What to Buy on Black Friday 2026: Categories Worth It and Ones to Skip",
    description:
      "What to buy on Black Friday 2026, category by category: where electronics, appliances and tools pay off, and where clothing and beauty buys turn to regret.",
    modifiedDate: TODAY,
    afterIntro: `**Planning your Black Friday?** Start with our main [Black Friday Canada 2026 guide](${BF_MAIN}) for the sale dates, Canadian and US retailers and a step by step shopping plan. This page goes category by category.

**Shopping on Amazon.ca?** Our [Amazon Black Friday Canada 2026 guide](${BF_CANADA}) lists popular products with the lowest Regret Scores, with links to each score.`,
    append: `## More Black Friday reading

- **[Amazon Black Friday Canada 2026: Deals With the Lowest Regret Scores](${BF_CANADA})** for Canadian shoppers on Amazon.ca.
- **[Black Friday Canada 2026: Dates, Deals and How to Avoid Regret](${BF_MAIN})** for planning your list before the sale.
- **[Boxing Day Deals Canada 2026](${BOXING_DAY})** if you would rather wait for December 26.`,
  },
  "the-ultimate-2026-us-and-canada-black-friday-playbook": {
    title: "Black Friday Canada 2026: Dates, Deals and How to Avoid Regret",
    description:
      "Black Friday 2026 is Friday, November 27. Our Black Friday Canada guide covers sale dates, Amazon.ca vs US deals, cross border traps and regret buys to skip.",
    modifiedDate: TODAY,
    afterIntro: `**Black Friday 2026 dates:** Black Friday is Friday, November 27, 2026, the day after US Thanksgiving, in both Canada and the US. Cyber Monday follows on Monday, November 30.

**Canadian shopper?** See [Amazon Black Friday Canada 2026: Deals With the Lowest Regret Scores](${BF_CANADA}) for Amazon.ca tips and the popular products owners regret least.`,
    append: `## More Black Friday reading

- **[Amazon Black Friday Canada 2026](${BF_CANADA})** with low regret picks you can check on Amazon.ca.
- **[What to Buy on Black Friday 2026](${BF_WHAT_TO_BUY})** for the categories worth buying on sale, and the ones to skip.
- **[Boxing Day Deals Canada 2026](${BOXING_DAY})** for the December 26 sales in Canada.`,
  },

  // Task: this post ranks for "boxing day deals canada"; send that intent to the real guide.
  "labor-day-vs-boxing-day-deals-us-vs-canada-shopping-guide": {
    modifiedDate: TODAY,
    replace: [
      ["# Labor Day vs Boxing Day Deals: US vs Canada Shopping Guide\n\n", ""],
      ["falls on the first Monday in September\u2014this year on September 2, 2024.", "falls on the first Monday in September, which was September 7 in 2026."],
    ],
    afterIntro: `**Looking for Boxing Day deals in Canada?** Read our full guide: **[Boxing Day Deals Canada 2026: What's Actually Worth Buying](${BOXING_DAY})**. It ranks Canadian Boxing Day categories by how happy buyers are months later.`,
    append: `## Related guides

- **[Boxing Day Deals Canada 2026: What's Actually Worth Buying](${BOXING_DAY})**
- **[Amazon Black Friday Canada 2026: Deals With the Lowest Regret Scores](${BF_CANADA})**`,
  },
  "boxing-day-deals-canada-2026-what-s-actually-worth-buying": {
    modifiedDate: TODAY,
    append: `## Shopping before Boxing Day?

Amazon.ca Black Friday comes first. Our [Amazon Black Friday Canada 2026 guide](${BF_CANADA}) lists popular products with the lowest Regret Scores, and our [worst Christmas gifts ranking](${WORST_GIFTS}) shows what to skip.`,
  },

  // Task: retitle toward "best air fryer canada" (position ~21). No prices added.
  "best-air-fryer-under-200-for-2026-us-and-canada": {
    title: "Best Air Fryer in Canada 2026: Which Types Owners Keep Using",
    description:
      "Best air fryer in Canada for 2026: the air fryer types Canadian owners keep using past year one, and how to shop Amazon.ca for one without regret.",
    modifiedDate: TODAY,
    replace: [["### 1. ", "## 1. "], ["### 2. ", "## 2. "], ["### 3. ", "## 3. "], ["### 4. ", "## 4. "], ["### 5. ", "## 5. "]],
    afterIntro: `Looking for the best air fryer in Canada in 2026? The answer depends less on the brand and more on the type and size that fits how you cook. Below are the five air fryer types worth considering, then what Canadian shoppers should check before buying on Amazon.ca.`,
    append: `## Buying an air fryer in Canada: what to check

- **Look for a Canadian certification mark.** Appliances sold in Canada should carry a mark from an accredited body such as CSA, cUL or cETL. A listing that does not mention one may be an import meant for another market.
- **Confirm the warranty covers Canada.** Some brands only honour the warranty in the country of sale. If you buy from a US listing or a third party seller, check this first.
- **Buy from a seller with easy returns.** "Ships from and sold by Amazon.ca" makes a return simple. Test the air fryer in the first week so you are well inside the return window.
- **Pick the size for your household, not the biggest box.** A basket that is too large for one or two people wastes counter space, and that is one of the most common reasons small appliances stop getting used.
- **Wait for a sale if you can.** Air fryers are often discounted in the Amazon.ca Black Friday and Boxing Day sales. See our [Amazon Black Friday Canada 2026 guide](${BF_CANADA}) and [Boxing Day Deals Canada 2026](${BOXING_DAY}).

Still deciding if you need one at all? Read [Instant Pot vs Air Fryer: Which Kitchen Gadget Do Owners Keep Using](/blog/instant-pot-vs-air-fryer-which-kitchen-gadget-do-owners-keep-using), or browse Regret Scores in our [Kitchen category](/category/kitchen).`,
  },

  // Task: merge the two near-duplicate Mirror vs Concept2 posts into this one.
  "lululemon-studio-mirror-vs-concept2-rowerg-which-has-lower-long-term-regret": {
    title: "Lululemon Studio Mirror vs Concept2 RowErg: Which Has Lower Long-Term Regret?",
    description:
      "Lululemon Studio Mirror (85/100 regret) vs Concept2 RowErg (6/100). Which home fitness buy owners regret less, with notes for US and Canadian shoppers.",
    modifiedDate: TODAY,
    readMins: 5,
    afterIntro: `This guide covers both versions of the Mirror. The current Lululemon Studio Mirror has a Regret Score of 85. The original Mirror, sold before Lululemon rebranded it, scores 82. Either way, the gap to the Concept2 RowErg is huge.`,
    append: `## Living with each one: details that matter after month three

**The RowErg monitor does more than it looks.** The Concept2 PM5 monitor tracks distance, splits and workout history, and it can pair with a heart rate monitor. Many owners log workouts to the free Concept2 online logbook and compare their times with other rowers, which gives the machine a built in reason to keep using it.

**The RowErg needs a little care and some space.** Plan for occasional cleaning and oiling of the chain, and expect some fan noise, which matters in apartments and shared housing. It also needs a clear floor area roughly 7 feet long, while the Mirror only needs a wall plus room to move in front of it.

**The RowErg is built to last.** Concept2 backs the frame with a 5 year warranty and the monitor with a 2 year warranty. Check current terms with the seller, since warranty can differ by where you buy.

**The Mirror depends on motivation and a subscription.** Owners who stick with the Mirror tend to be people who already had a class habit, or households where more than one person uses it. Solo buyers hoping the screen will create a habit are the ones who regret it most.

**Moving and reselling.** A wall mounted Mirror is harder to move and resell than a rower, and used Concept2 machines are easy to sell on local marketplaces.

## Read more

- **[Should You Buy the Lululemon Studio Mirror in 2026?](/blog/should-you-buy-the-lululemon-studio-mirror-in-2026-us-and-canada-guide)**
- **[Should You Buy the Mirror (by Lululemon) in 2026?](/blog/should-you-buy-the-mirror-by-lululemon-in-2026-us-and-canada-guide)**
- **[Should You Buy the Concept2 RowErg in 2026?](/blog/should-you-buy-the-concept2-rowerg-in-2026-us-and-canada-guide)**
- **[The 5 Most Regretted Fitness Products in 2026](/blog/most-regretted-fitness-products-2026)**`,
  },

  // Point the main gift guide at the new "worst gifts" post.
  "holiday-gift-guide-2026-gifts-with-the-lowest-regret-scores": {
    modifiedDate: TODAY,
    append: `## What not to give

The flip side of this guide is our [Worst Christmas Gifts 2026, Ranked by Regret Score](${WORST_GIFTS}), a list of popular gifts owners regret the most.`,
  },
};

export function applyPatch(post: BlogPost): BlogPost {
  const patch = PATCHES[post.slug];
  if (!patch) return post;
  let body = post.body;
  for (const [from, to] of patch.replace ?? []) body = body.split(from).join(to);
  if (patch.afterIntro) {
    const blocks = body.split("\n\n");
    blocks.splice(1, 0, patch.afterIntro);
    body = blocks.join("\n\n");
  }
  if (patch.append) body = `${body.trimEnd()}\n\n${patch.append}`;
  return {
    ...post,
    title: patch.title ?? post.title,
    description: patch.description ?? post.description,
    modifiedDate: patch.modifiedDate ?? post.modifiedDate,
    readMins: patch.readMins ?? post.readMins,
    body,
  };
}
