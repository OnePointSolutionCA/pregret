-- Subcategory pages filter on external_ids->>'sub' and sort by regret_score. Without this the
-- query walks the whole category (1.9s for Fitness/skate, Fashion/luggage brands hit the 3s
-- anon timeout) and crawler traffic on 2026-11-03 exhausted the connection pool.
create index if not exists products_category_sub_regret_idx
  on public.products (category, (external_ids->>'sub'), regret_score);
-- /browse and the sitemap order by created_at, id (listed-products.ts). Serves the desc order too.
create index if not exists products_created_id_idx on public.products (created_at, id);
drop index if exists public.products_created_idx;
analyze public.products;
