/**
 * Build search URLs on multiple retailers for any product name. These are
 * direct outbound links (no /go proxy) so the Impact.com and Skimlinks
 * client scripts on the page can transform them into affiliate links at
 * click-time. Amazon.com/Amazon.ca links stay on the /go route because
 * Amazon uses our direct Associates tags server-side.
 */

const q = (s: string) => encodeURIComponent(s.slice(0, 120));

export type SecondaryRetailer = {
  key: string;
  label: string;
  url: string;
  network: "impact" | "skimlinks";
};

/** Build a clean search term: prepend brand ONLY if it's not already at the start of the name. */
function buildTerm(brand: string | null, name: string): string {
  const b = (brand ?? "").trim();
  const n = name.trim();
  if (!b) return n;
  // If name already starts with the brand (case-insensitive), don't duplicate it.
  if (n.toLowerCase().startsWith(b.toLowerCase() + " ") || n.toLowerCase() === b.toLowerCase()) {
    return n;
  }
  return `${b} ${n}`;
}

export function secondaryRetailerLinks(brand: string | null, name: string): SecondaryRetailer[] {
  const term = buildTerm(brand, name);
  return [
    // Impact.com network (auto-tagged by our Impact UTT script)
    { key: "bestbuy",   label: "Best Buy",   network: "impact",    url: `https://www.bestbuy.com/site/searchpage.jsp?st=${q(term)}` },
    { key: "target",    label: "Target",     network: "impact",    url: `https://www.target.com/s?searchTerm=${q(term)}` },
    { key: "homedepot", label: "Home Depot", network: "impact",    url: `https://www.homedepot.com/s/${q(term)}` },
    // Walmart uses Skimlinks (also on the page)
    { key: "walmart",   label: "Walmart",    network: "skimlinks", url: `https://www.walmart.com/search?q=${q(term)}` },
  ];
}

/**
 * Suggest a curated subset based on the product category so we don't
 * link Baby products to Home Depot. Falls back to all four.
 */
export function retailersForCategory(category: string | null, brand: string | null, name: string): SecondaryRetailer[] {
  const all = secondaryRetailerLinks(brand, name);
  const byKey = Object.fromEntries(all.map((r) => [r.key, r]));
  const pick = (keys: string[]) => keys.map((k) => byKey[k]).filter(Boolean);
  switch (category) {
    case "Electronics":     return pick(["bestbuy", "walmart", "target"]);
    case "Kitchen":         return pick(["walmart", "target", "bestbuy"]);
    case "Fitness":         return pick(["walmart", "target", "bestbuy"]);
    case "Personal Care":   return pick(["walmart", "target"]);
    case "Home & Garden":   return pick(["homedepot", "walmart", "target"]);
    case "Baby":            return pick(["walmart", "target"]);
    case "Beauty":          return pick(["target", "walmart"]);
    case "School Supplies": return pick(["target", "walmart"]);
    default:                return pick(["walmart", "target", "bestbuy"]);
  }
}
