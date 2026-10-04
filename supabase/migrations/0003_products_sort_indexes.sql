-- Every ORDER BY the site runs over the 283k-row catalog needs an index, otherwise the
-- anon role's statement timeout cancels the query (homepage snapshot, category sorts, sitemap).
create index if not exists products_category_regret_idx on public.products (category, regret_score);
create index if not exists products_category_loved_idx on public.products (category, would_buy_again_pct);
create index if not exists products_category_name_idx on public.products (category, name);
create index if not exists products_loved_idx on public.products (would_buy_again_pct);
create index if not exists products_created_idx on public.products (created_at desc);
-- Superseded by products_category_regret_idx (same leading column).
drop index if exists public.products_category_idx;
analyze public.products;
