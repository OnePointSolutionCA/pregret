import type { RegretTier } from "./types";

export function tierFor(score: number): RegretTier {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  return "high";
}

export const tierCopy: Record<RegretTier, { label: string; hex: string; bg: string; text: string }> = {
  low: {
    label: "Low regret",
    hex: "#22C55E",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
  },
  medium: {
    label: "Some regret",
    hex: "#F59E0B",
    bg: "bg-amber-500",
    text: "text-amber-600",
  },
  high: {
    label: "High regret",
    hex: "#EF4444",
    bg: "bg-red-500",
    text: "text-red-600",
  },
};

export function tierAdvice(tier: RegretTier): string {
  switch (tier) {
    case "low":
      return "Owners are happy months in. Safe to buy.";
    case "medium":
      return "Mixed long-term reviews. Read the reasons below before you commit.";
    case "high":
      return "A lot of owners regret this. Think twice — see the alternatives below.";
  }
}
