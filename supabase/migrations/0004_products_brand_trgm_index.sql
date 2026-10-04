-- Search filters `name ILIKE ... OR brand ILIKE ...`; without a trigram index on brand the OR
-- forces a full scan, and rare terms ("dyson") hit the anon statement timeout.
create index if not exists products_brand_trgm_idx on public.products using gin (brand gin_trgm_ops);
analyze public.products;
