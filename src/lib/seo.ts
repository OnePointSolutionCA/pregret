import type { Metadata } from "next";

// Shared title, description and social tag helpers. Every indexable page builds its metadata
// through pageMeta() so og:url always matches the canonical, and titles and descriptions stay
// inside what search results show (about 60 characters and 150 to 160 characters).

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pregret.ca";
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const BRAND_SUFFIX = " | Pregret";
export const TITLE_MAX = 60;
export const DESC_MIN = 150;
export const DESC_MAX = 160;

const DEFAULT_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Pregret. The Regret Score for anything before you buy it.",
};

// Words a cut title or name should not end on.
const DANGLING = new Set([
  "a", "an", "and", "the", "of", "for", "with", "in", "on", "to", "by", "or", "from", "at",
  "vs", "vs.", "is", "are", "be", "do", "does", "than", "that", "your", "our", "its", "after",
  "before", "without", "between", "into", "over", "under", "about", "when", "how", "why",
  "what", "which", "who", "&", "+", "|",
]);

/** Dashes used as punctuation become commas. Hyphenated words (Long-Term, 2-in-1) are kept. */
export function undash(s: string): string {
  return s
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+-\s+/g, ", ")
    .replace(/,(?=\S)/g, ", ")
    .replace(/\s+,/g, ",")
    .replace(/(,\s*){2,}/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

function tidyEnd(s: string): string {
  let out = s.trim();
  for (let i = 0; i < 6; i++) {
    const before = out;
    out = out.replace(/[\s,;:/(\[|&]+$/, "").trim();
    const words = out.split(" ");
    if (words.length > 1 && DANGLING.has(words[words.length - 1].toLowerCase())) {
      words.pop();
      out = words.join(" ");
    }
    if (out === before) break;
  }
  // Drop an unclosed "(" and whatever follows it.
  const open = out.lastIndexOf("(");
  if (open > 0 && out.indexOf(")", open) === -1) out = out.slice(0, open).trim();
  return out.replace(/[\s,;:]+$/, "");
}

/** Cut at a word boundary so the result is at most `max` characters. */
export function cutWords(s: string, max: number): string {
  if (s.length <= max) return s;
  const slice = s.slice(0, max + 1);
  const space = slice.lastIndexOf(" ");
  const cut = space > 0 ? slice.slice(0, space) : s.slice(0, max);
  return tidyEnd(cut);
}

/**
 * Shorten a long retail product name to `max` characters, preferring a natural break
 * ("Brand Product, 11 Buttons, 2500 DPI" becomes "Brand Product") over a word cut.
 */
export function shortName(name: string, max: number): string {
  const clean = undash(name);
  if (clean.length <= max) return clean;
  const minUseful = Math.min(12, Math.floor(max * 0.5));
  let best = "";
  const re = /,\s|\s\|\s|\s\(|:\s|\s(?:with|for|featuring)\s/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const prefix = tidyEnd(clean.slice(0, m.index));
    if (prefix.length > max) break;
    if (prefix.length >= minUseful) best = prefix;
  }
  return best || cutWords(clean, max);
}

/** Add the brand suffix when it fits; otherwise the bare title, cut to TITLE_MAX if needed. */
export function withSuffix(title: string): string {
  if ((title + BRAND_SUFFIX).length <= TITLE_MAX) return title + BRAND_SUFFIX;
  return cutWords(title, TITLE_MAX);
}

// ---------- Products ----------

export function productTitle(name: string, score: number): string {
  const clean = undash(name);
  const long = `: Regret Score ${score}/100`;
  if ((clean + long + BRAND_SUFFIX).length <= TITLE_MAX) return clean + long + BRAND_SUFFIX;
  if ((clean + long).length <= TITLE_MAX) return clean + long;
  // Long retail names: keep as much of the name as possible with the shorter score tail.
  const short = `: Regret ${score}/100`;
  return shortName(clean, TITLE_MAX - short.length) + short;
}

export function productDescription(name: string, score: number, wouldBuyAgain: number): string {
  // Small optional pieces (all true for every product page) let the same name land in 150 to 160.
  const build = (n: string, o: { again?: boolean; the?: boolean; free?: "" | "short" | "long" }) =>
    `${n}: Regret Score ${score}/100${o.again ? `, and ${wouldBuyAgain}% would buy again` : ""}.` +
    ` See how satisfaction holds up at day 30, 60, and 90, and compare ${o.the ? "the " : ""}alternatives before you buy.` +
    (o.free === "short" ? " Free to check." : o.free === "long" ? " Free to check, no account needed." : "");
  const n = shortName(undash(name), DESC_MAX - build("", {}).length);
  const combos: { again?: boolean; the?: boolean; free?: "" | "short" | "long" }[] = [
    {}, { the: true }, { free: "short" }, { the: true, free: "short" }, { again: true },
    { again: true, the: true }, { free: "long" }, { the: true, free: "long" },
    { again: true, free: "short" }, { again: true, the: true, free: "short" },
    { again: true, free: "long" }, { again: true, the: true, free: "long" },
  ];
  let best = build(n, {});
  for (const c of combos) {
    const o = build(n, c);
    if (o.length > DESC_MAX) continue;
    if (o.length >= DESC_MIN) return o;
    if (o.length > best.length) best = o;
  }
  return best;
}

// ---------- Blog ----------

// Fill a pattern's {N} slot with a product name shortened so the whole title fits TITLE_MAX.
function slot(pattern: string, name: string): string | null {
  const budget = TITLE_MAX - pattern.replace("{N}", "").length;
  if (budget < 12) return null;
  return pattern.replace("{N}", shortName(name, budget));
}

function slot2(pattern: string, a: string, b: string): string | null {
  const budget = TITLE_MAX - pattern.replace("{A}", "").replace("{B}", "").length;
  if (budget < 20) return null;
  const ua = undash(a), ub = undash(b);
  const aMax = Math.max(Math.floor(budget / 2), budget - ub.length);
  const sa = shortName(ua, aMax);
  return pattern.replace("{A}", sa).replace("{B}", shortName(ub, budget - sa.length));
}

// Long post titles built from a template around a product name. Each entry lists the
// patterns to try with the full name first (most preferred first), then the pattern used
// when the name itself has to be shortened.
type NamedRule = { re: RegExp; full: string[]; short: string };
const NAMED_RULES: NamedRule[] = [
  {
    re: /^Should You Buy the (.+) in (\d{4})\? \(US & Canada Guide\)$/,
    full: ["Should You Buy the {N} in {Y}?", "Should You Buy the {N}?"],
    short: "Should You Buy the {N} in {Y}?",
  },
  {
    re: /^Is the (.+) Worth It in (\d{4})\? \(Honest Answer\)$/,
    full: ["Is the {N} Worth It in {Y}?", "Is the {N} Worth It?"],
    short: "Is the {N} Worth It in {Y}?",
  },
  {
    re: /^Why People Regret Buying the (.+) \(Data \+ Reasons\)$/,
    full: ["Why People Regret Buying the {N}", "Why People Regret the {N}", "Why People Regret {N}"],
    short: "Why People Regret the {N}",
  },
  {
    re: /^(.+) Alternatives: Better Options for (\d{4})$/,
    full: ["{N} Alternatives for {Y}", "{N} Alternatives"],
    short: "{N} Alternatives for {Y}",
  },
  {
    re: /^(.+) Real Reviews from Long-Term Owners$/,
    full: ["{N}: Long-Term Owner Reviews", "{N} Owner Reviews"],
    short: "{N}: Long-Term Owner Reviews",
  },
];

function namedRule(t: string): string | null {
  for (const r of NAMED_RULES) {
    const m = t.match(r.re);
    if (!m) continue;
    const name = undash(m[1]);
    const year = m[2] ?? "";
    for (const f of r.full) {
      const c = f.replace("{N}", name).replace("{Y}", year);
      if (c.length <= TITLE_MAX) return c;
    }
    return slot(r.short.replace("{Y}", year), name);
  }
  const vs = t.match(/^(.+) vs (.+): Which Has Lower Long-Term Regret\?$/);
  if (vs) {
    for (const f of ["{A} vs {B}: Which Has Lower Regret?", "{A} vs {B}: Which Has Less Regret?", "{A} vs {B}: Regret Compared"]) {
      const c = f.replace("{A}", undash(vs[1])).replace("{B}", undash(vs[2]));
      if (c.length <= TITLE_MAX) return c;
    }
    return slot2("{A} vs {B}: Regret Compared", vs[1], vs[2]);
  }
  return null;
}

// Filler that can go from a title without changing what it says, removed one step at a time.
const FILLERS: [RegExp, string][] = [
  [/\s(?:Actually|Really|Very|Just|Common)\s/g, " "],
  [/(\s)(?:the|The|Their|Your)\s/g, "$1"],
  [/,?\sand\s/g, " & "],
  [/\sa\s/g, " "],
];

/**
 * Title tag for a blog post. Titles that already fit keep the brand suffix. Longer ones drop
 * the suffix, then a known long pattern is shortened, then filler words go, then the title is
 * cut at its colon or at a word. The on-page H1 always shows the full title.
 */
export function blogTitle(title: string): string {
  const t = undash(title);
  if ((t + BRAND_SUFFIX).length <= TITLE_MAX) return t + BRAND_SUFFIX;
  if (t.length <= TITLE_MAX) return t;

  const named = namedRule(t);
  if (named && named.length <= TITLE_MAX) return withSuffix(named);

  // A trailing aside in parentheses is the least important part of a title.
  const aside = t.match(/^(.{20,}?)\s*\([^()]*\)$/);
  if (aside && aside[1].length <= TITLE_MAX) return withSuffix(aside[1]);

  let lean = t;
  for (const [re, to] of FILLERS) {
    lean = lean.replace(re, to).replace(/\s{2,}/g, " ");
    if (lean.length <= TITLE_MAX) return withSuffix(lean);
  }

  const colon = lean.indexOf(": ");
  if (colon >= 28 && colon <= TITLE_MAX) return withSuffix(lean.slice(0, colon));
  return cutWords(lean, TITLE_MAX);
}

// Short, always true sentences used to bring a short description up to 150 characters.
const PADS = {
  about: " From Pregret, which tracks how owners feel at day 30, 60, and 90.",
  brand: " From Pregret, the product regret tracker.",
  region: " For shoppers in the US and Canada.",
  read: " Read this before you buy.",
  free: " Free to read.",
};
const PAD_SETS: string[][] = [
  [PADS.free], [PADS.read], [PADS.region], [PADS.brand],
  [PADS.region, PADS.free], [PADS.region, PADS.read], [PADS.brand, PADS.free], [PADS.about],
  [PADS.brand, PADS.read], [PADS.brand, PADS.region], [PADS.about, PADS.free], [PADS.about, PADS.read],
  [PADS.brand, PADS.region, PADS.free], [PADS.brand, PADS.region, PADS.read], [PADS.about, PADS.region],
  [PADS.about, PADS.region, PADS.free], [PADS.about, PADS.region, PADS.read],
];

/** Meta description for blog posts and other hand written copy: 150 to 160 characters. */
export function fitDescription(desc: string): string {
  let d = undash(desc).replace(/\s+/g, " ").trim();
  if (d.length > DESC_MAX) {
    const head = d.slice(0, DESC_MAX);
    const end = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "));
    d = end >= 110 ? head.slice(0, end + 1) : `${cutWords(d, DESC_MAX - 1)}…`;
    if (d.length >= DESC_MIN) return d;
  }
  if (d.length >= DESC_MIN) return d;
  if (!/[.!?]$/.test(d)) d += ".";
  let best = d;
  for (const set of PAD_SETS) {
    const c = d + set.join("");
    if (c.length > DESC_MAX) continue;
    if (c.length >= DESC_MIN) return c;
    if (c.length > best.length) best = c;
  }
  return best;
}

// ---------- Metadata ----------

type PageMetaInput = {
  /** Site relative canonical path, e.g. "/about". */
  path: string;
  /** Final title tag text (already fitted, brand suffix included when wanted). */
  title: string;
  description: string;
  type?: "website" | "article";
  /** Absolute or site relative image for link previews. */
  image?: string | null;
  imageAlt?: string;
  robots?: Metadata["robots"];
  article?: { publishedTime?: string; modifiedTime?: string; section?: string };
};

export function pageMeta(o: PageMetaInput): Metadata {
  const image = o.image ? { url: o.image, alt: o.imageAlt ?? o.title } : DEFAULT_IMAGE;
  return {
    title: { absolute: o.title },
    description: o.description,
    alternates: { canonical: o.path },
    ...(o.robots ? { robots: o.robots } : {}),
    openGraph: {
      type: o.type ?? "website",
      siteName: "Pregret",
      url: o.path,
      title: o.title,
      description: o.description,
      images: [image],
      ...(o.type === "article" && o.article ? o.article : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: o.title,
      description: o.description,
      images: [typeof image.url === "string" ? image.url : DEFAULT_IMAGE.url],
    },
  };
}
