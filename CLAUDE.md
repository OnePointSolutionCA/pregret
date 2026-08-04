# CLAUDE.md

## Project Overview

**Pregret** — "Know Before You Regret." A product satisfaction platform that tracks how owners feel about purchases at 30, 60, and 90 days. Every product gets a Regret Score (0–100) built from real time-decayed satisfaction data, not honeymoon-phase launch reviews.

**Revenue model:** Affiliate links on suggested alternatives when a product has a high regret score.

**Domain:** pregret.ca  
**Stack:** Next.js 16 + React 19 + Supabase + Tailwind 4 + Recharts

---

## Commands

```bash
cd ~/pregret
npm run dev        # dev server (usually localhost:3000)
npm run build      # production build
npm run start      # start production server

# Seed the database (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
node scripts/seed.mjs
```

---

## Architecture

### Data Flow

Products live in Supabase (Postgres). When Supabase isn't configured (no `.env.local`), the app falls back to 6 hardcoded demo products on the homepage. All other pages (search, category, product detail) show empty states.

Users sign up → add a product they own → get pinged at day 30/60/90 → tap a satisfaction rating → the `recompute_product_regret()` trigger recalculates the product's aggregate regret score.

AI-estimated scores (via Claude API) fill in until enough real ratings arrive. The `is_ai_estimated` flag marks these.

### Design System (ported from Madina Printing architecture)

All animation and visual effects are in `globals.css` under the `.rd` namespace:

- **Aurora glow** — 3 blurred circles behind hero, CSS-animated drift
- **Scroll reveals** — `data-rr` (fade-up), `data-rr-l` (from left), `data-rr-r` (from right), `data-rr-d="N"` (stagger delay). IntersectionObserver in layout.tsx
- **Marquee** — infinite horizontal scroll strip, scroll-velocity-reactive
- **Scroll progress bar** — `.rd-progress`, fixed top, coral gradient
- **Animated counters** — `data-count` + `data-suffix`, cubic-ease count-up on scroll
- **Magnetic elements** — `data-magnetic`, pointer-tracking translate on hover
- **Logo animation** — `.plogo` namespace: mark spins in → wordmark wipes → shine sweeps (15s loop)
- **Hero line reveal** — `.rd-line` / `.rd-line__in`, translateY slide-up on `.is-ready`
- **Outline text glow** — `.rd-outline` / `data-outline`, text-stroke → fill transition
- **Reduced motion** — all animations respect `prefers-reduced-motion: reduce`

### Brand Tokens

```css
--brand-navy:   #0C3A5E    --brand-coral:  #FF6B57
--brand-navy-2: #0A2E4A    --brand-coral-2:#E85A47
--brand-cream:  #FBF7F1    --brand-cream-2:#F5EFE5
--regret-red:   #E85A47    --regret-amber: #F2A93A    --keep-green: #2FA96A
```

**Fonts:** Fraunces (display/serif), Plus Jakarta Sans (body), Poppins (wordmark/logo)

### Regret Score Tiers

| Score   | Tier   | Color     | Meaning                   |
|---------|--------|-----------|---------------------------|
| 0–30    | Low    | Green     | Safe buy — owners happy   |
| 31–60   | Medium | Amber     | Mixed — read the reasons  |
| 61–100  | High   | Red       | Most owners regret it     |

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, nav, footer, all animation JS
│   ├── page.tsx                # Homepage: hero, marquee, score explainer, stats, featured, how-it-works
│   ├── globals.css             # Full design system (brand tokens, animations, components)
│   ├── about/page.tsx          # Static about page
│   ├── privacy/page.tsx        # Privacy policy
│   ├── terms/page.tsx          # Terms of service
│   ├── login/page.tsx          # Auth (email/password + Google OAuth)
│   ├── search/page.tsx         # Product search (Supabase ilike)
│   ├── category/[slug]/page.tsx  # Category browse
│   ├── product/[slug]/page.tsx   # Product detail: score, decay curve, alternatives
│   ├── dashboard/page.tsx        # User's tracked products + check-in links
│   ├── dashboard/check-in/[id]/page.tsx  # Day 30/60/90 satisfaction input
│   ├── go/[productId]/route.ts   # Affiliate redirect + click tracking
│   └── api/extension/
│       ├── lookup/route.ts     # Browser extension: match product by title/ASIN
│       ├── click/route.ts      # Extension: log affiliate click
│       ├── dismiss/route.ts    # Extension: dismiss tooltip
│       └── impression/route.ts # Extension: log popup impression
├── components/
│   ├── Navbar.tsx              # Sticky header (cream + blur)
│   ├── NavLogo.tsx             # Animated logo (spin + wipe + shine)
│   ├── Footer.tsx              # Footer with nav links
│   ├── SearchBar.tsx           # Search form (client component)
│   ├── ProductCard.tsx         # Product card with regret circle
│   ├── RegretScore.tsx         # Regret score circle (sm/md/lg)
│   ├── DecayCurve.tsx          # Recharts satisfaction line chart
│   ├── AlternativeCard.tsx     # Suggested alternative with affiliate CTA
│   └── CheckInPrompt.tsx       # Satisfaction input UI
├── lib/
│   ├── types.ts                # Product, UserProduct, Alternative, RegretTier
│   ├── supabase.ts             # Server-side Supabase client (SSR cookies)
│   ├── supabase-browser.ts     # Browser-side Supabase client
│   ├── regretScore.ts          # tierFor(), tierCopy, tierAdvice()
│   ├── affiliates.ts           # Affiliate tag injection + /go URL builder
│   ├── ai.ts                   # Claude API for AI-estimated scores
│   └── slug.ts                 # Slug generation helpers
└── styles/ (empty — all CSS in globals.css)

public/
├── logo.png                    # Full logo (mark + wordmark)
├── logo-white.png              # White variant for dark backgrounds

supabase/migrations/
└── 0001_initial_schema.sql     # products, user_products, product_alternatives, affiliate_clicks + RLS + trigger

scripts/
└── seed.mjs                    # Product seeding script (50 products, 3 categories)
```

---

## Database Schema

**products** — the catalog. `regret_score` (0–100), `would_buy_again_pct` (0–100), satisfaction at day 30/60/90, `top_regret_reasons` (JSONB array), `external_ids` (JSONB, stores ASIN etc). Indexed on category, regret_score, and name (trigram for fuzzy search).

**user_products** — one row per user×product. Tracks purchase date, satisfaction at each checkpoint, would_buy_again, regret_reason. A trigger recalculates the product's aggregate scores on every change.

**product_alternatives** — links products to their recommended alternatives with switch_count and source (ai_suggested or user_reported).

**affiliate_clicks** — logs every /go redirect with product_id, user_id, session_id, destination URL, affiliate program.

---

## Environment Variables

Copy `.env.local.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role key (server-side only)

ANTHROPIC_API_KEY=              # For AI-estimated regret scores
RESEND_API_KEY=                 # For check-in reminder emails
RESEND_FROM_EMAIL="Pregret <hello@pregret.ca>"

AMAZON_AFFILIATE_TAG_CA=        # Amazon.ca affiliate tag
AMAZON_AFFILIATE_TAG_US=        # Amazon.com affiliate tag

NEXT_PUBLIC_SITE_URL=https://pregret.ca
```

---

## Categories

Current: Electronics, Kitchen, Fitness, Personal Care

Expansion plan: Home & Garden, Baby Products, Beauty, Fashion, Automotive

---

## Browser Extension API

The `/api/extension/` endpoints support a future browser extension that shows regret scores inline on Amazon product pages:

- `GET /api/extension/lookup?title=X&brand=Y&asin=Z` — returns regret score + best alternative
- `POST /api/extension/impression` — logs tooltip shown
- `POST /api/extension/click` — logs user clicking "see alternative"
- `POST /api/extension/dismiss` — logs user dismissing tooltip

All endpoints return CORS headers for cross-origin extension requests.

---

## Product Seeding Pipeline

See `scripts/seed.mjs`. Seed flow:

1. Define products with name, brand, category, regret_score, would_buy_again_pct, satisfaction decay, top regret reasons
2. Insert into Supabase via service role key
3. Link alternatives (product_alternatives table)

For AI-generated scores at scale, see the sourcing guide in the project docs.
