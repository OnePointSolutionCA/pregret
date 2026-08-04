# Pregret

Free crowdsourced Regret Score for any product. Time-decayed satisfaction data at 30, 60, and 90 days.

Stack: Next.js 16 (App Router) + Tailwind v4 + Supabase (Postgres/Auth) + Resend + Anthropic API.

## Getting started

```bash
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Insert affiliate clicks + run seed jobs |
| `ANTHROPIC_API_KEY` | Seed Regret Scores via Claude sentiment analysis |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Day 30/60/90 check-in emails |
| `AMAZON_AFFILIATE_TAG_CA` / `AMAZON_AFFILIATE_TAG_US` | Appended to `/go` redirect URLs |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (SEO, extension callbacks) |

Without Supabase env vars the site runs in demo mode (homepage renders with fixture data).

## Database

Run `supabase/migrations/0001_initial_schema.sql` against your project. It creates:

- `products` — canonical product data + aggregated Regret Score
- `user_products` — per-user ownership + day 30/60/90 ratings
- `product_alternatives` — "people switched to" recommendations
- `affiliate_clicks` — outbound click log
- `recompute_product_regret()` — trigger-driven rollup with day-90 weighted 3×, day-60 2×, day-30 1×

RLS is on for all four tables. Users see only their own `user_products` rows; `products` and `product_alternatives` are world-readable.

## Key routes

- `/` — hero + featured
- `/search?q=` — full-text-ish match on name + brand
- `/product/[slug]` — Regret Score, decay curve, alternatives, JSON-LD
- `/category/[slug]` — electronics / kitchen / fitness / personal-care
- `/dashboard` — signed-in user's tracked products + pending check-ins
- `/dashboard/check-in/[id]` — one-tap 30/60/90 day rating
- `/go/[productId]?ref=` — affiliate redirect + click log
- `/api/extension/{lookup,impression,click,dismiss}` — Chrome extension endpoints (Phase 2)

## Deployment

Push to Vercel. Point `pregret.ca` DNS at Vercel via Cloudflare. Run the migration in Supabase before first deploy.
