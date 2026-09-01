export type RegretReason = {
  reason: string;
  count?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  amazon_url: string | null;
  regret_score: number;
  would_buy_again_pct: number;
  is_ai_estimated: boolean;
  total_ratings: number;
  avg_satisfaction_day30: number | null;
  avg_satisfaction_day60: number | null;
  avg_satisfaction_day90: number | null;
  top_regret_reasons: RegretReason[] | null;
  external_ids: (Record<string, string> & { description?: string }) | null;
  created_at: string;
  updated_at: string;
};

export type UserProduct = {
  id: string;
  user_id: string;
  product_id: string;
  purchase_date: string | null;
  added_at: string;
  satisfaction_day30: number | null;
  satisfaction_day60: number | null;
  satisfaction_day90: number | null;
  would_buy_again: boolean | null;
  regret_reason: string | null;
  check_in_30_sent: boolean;
  check_in_60_sent: boolean;
  check_in_90_sent: boolean;
  created_at: string;
};

export type Alternative = {
  id: string;
  product_id: string;
  alternative_product_id: string;
  switch_count: number;
  source: "ai_suggested" | "user_reported";
  alternative: Product;
};

export type RegretTier = "low" | "medium" | "high";
