-- Built after bulk loads: maintaining a GIN trigram index row-by-row makes big inserts crawl.
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
