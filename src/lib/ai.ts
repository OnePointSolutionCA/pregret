import Anthropic from "@anthropic-ai/sdk";

export type SeedEstimate = {
  regret_score: number;
  would_buy_again_pct: number;
  top_regret_reasons: { reason: string }[];
  suggested_alternatives: { name: string; brand?: string; why_better: string }[];
  confidence: "low" | "medium" | "high";
};

const SEED_SYSTEM = `You estimate long-term buyer regret for consumer products.
Return ONLY a JSON object matching this shape:
{
  "regret_score": integer 0-100,
  "would_buy_again_pct": integer 0-100,
  "top_regret_reasons": [{"reason": string} up to 3],
  "suggested_alternatives": [{"name": string, "brand": string, "why_better": string} up to 3],
  "confidence": "low" | "medium" | "high"
}
Base your estimate on publicly known review sentiment (Amazon 1-3 star themes, Reddit threads, expert reviews).
Weight late-term satisfaction heavily: what do owners say months in, not on day 1.
Do not fabricate — if uncertain, say confidence "low" and lean toward middle scores.`;

export async function estimateFromAI(productName: string, brand?: string, category?: string): Promise<SeedEstimate | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const client = new Anthropic({ apiKey: key });
  const prompt = `Product: ${productName}${brand ? ` (brand: ${brand})` : ""}${category ? ` — category: ${category}` : ""}.\nReturn the JSON only.`;

  const resp = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 700,
    system: SEED_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = resp.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;

  try {
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as SeedEstimate;
  } catch {
    return null;
  }
}
