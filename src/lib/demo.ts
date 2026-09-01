import type { Product } from "./types";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-1", slug: "peloton-bike-plus", name: "Peloton Bike+", brand: "Peloton",
    category: "Fitness", image_url: null, amazon_url: null, regret_score: 78,
    would_buy_again_pct: 24, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: 4.2, avg_satisfaction_day60: 3.1, avg_satisfaction_day90: 2.4,
    top_regret_reasons: [
      { reason: "Subscription fees keep climbing" },
      { reason: "Used it hard for 2 months, now a $2,400 clothes rack" },
      { reason: "Content lock-in — can't use it without a membership" },
    ],
    external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-2", slug: "instant-pot-duo", name: "Instant Pot Duo 7-in-1", brand: "Instant Pot",
    category: "Kitchen", image_url: null, amazon_url: null, regret_score: 14,
    would_buy_again_pct: 92, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: 4.7, avg_satisfaction_day60: 4.6, avg_satisfaction_day90: 4.5,
    top_regret_reasons: [
      { reason: "Takes up counter space" },
      { reason: "Sealing ring holds smells" },
    ],
    external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-3", slug: "dyson-airwrap", name: "Dyson Airwrap Complete", brand: "Dyson",
    category: "Personal Care", image_url: null, amazon_url: null, regret_score: 52,
    would_buy_again_pct: 61, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: 4.3, avg_satisfaction_day60: 3.6, avg_satisfaction_day90: 3.1,
    top_regret_reasons: [
      { reason: "Learning curve is real, most owners give up" },
      { reason: "Attachments loosen after a few months" },
      { reason: "$600 for something a $40 tool does 80% as well" },
    ],
    external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-4", slug: "theragun-elite", name: "Theragun Elite", brand: "Therabody",
    category: "Fitness", image_url: null, amazon_url: null, regret_score: 63,
    would_buy_again_pct: 41, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: 4.0, avg_satisfaction_day60: 3.2, avg_satisfaction_day90: 2.6,
    top_regret_reasons: [
      { reason: "Novelty wears off in weeks" },
      { reason: "Battery degrades noticeably by month 6" },
      { reason: "A $40 percussion massager does the same job" },
    ],
    external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-5", slug: "sodastream-art", name: "SodaStream Art", brand: "SodaStream",
    category: "Kitchen", image_url: null, amazon_url: null, regret_score: 44,
    would_buy_again_pct: 58, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: 4.1, avg_satisfaction_day60: 3.7, avg_satisfaction_day90: 3.3,
    top_regret_reasons: [
      { reason: "CO2 refills are pricier than expected" },
      { reason: "Bottles need replacing every 2 years" },
    ],
    external_ids: null, created_at: "", updated_at: "",
  },
  {
    id: "demo-6", slug: "vitamix-a3500", name: "Vitamix A3500", brand: "Vitamix",
    category: "Kitchen", image_url: null, amazon_url: null, regret_score: 9,
    would_buy_again_pct: 96, is_ai_estimated: true, total_ratings: 0,
    avg_satisfaction_day30: 4.9, avg_satisfaction_day60: 4.9, avg_satisfaction_day90: 4.8,
    top_regret_reasons: [{ reason: "Loud — you know when it's on" }],
    external_ids: null, created_at: "", updated_at: "",
  },
];

export function demoBySlug(slug: string): Product | null {
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export const DEMO_ALTS: Record<string, string[]> = {
  "peloton-bike-plus": ["vitamix-a3500"],
  "theragun-elite": ["instant-pot-duo"],
  "dyson-airwrap": ["vitamix-a3500"],
};
