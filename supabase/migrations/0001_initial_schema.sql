-- PreGret initial schema

create extension if not exists "pgcrypto";
create extension if not exists pg_trgm;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  brand text,
  category text,
  image_url text,
  amazon_url text,
  regret_score integer not null default 0 check (regret_score between 0 and 100),
  would_buy_again_pct integer not null default 0 check (would_buy_again_pct between 0 and 100),
  is_ai_estimated boolean not null default true,
  total_ratings integer not null default 0,
  avg_satisfaction_day30 numeric(3,2),
  avg_satisfaction_day60 numeric(3,2),
  avg_satisfaction_day90 numeric(3,2),
  top_regret_reasons jsonb,
  external_ids jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_regret_score_idx on public.products (regret_score);


create table if not exists public.user_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  product_id uuid not null references public.products on delete cascade,
  purchase_date date,
  added_at timestamptz not null default now(),
  satisfaction_day30 integer check (satisfaction_day30 between 1 and 5),
  satisfaction_day60 integer check (satisfaction_day60 between 1 and 5),
  satisfaction_day90 integer check (satisfaction_day90 between 1 and 5),
  would_buy_again boolean,
  regret_reason text,
  check_in_30_sent boolean not null default false,
  check_in_60_sent boolean not null default false,
  check_in_90_sent boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists user_products_user_idx on public.user_products (user_id);

create table if not exists public.product_alternatives (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  alternative_product_id uuid not null references public.products on delete cascade,
  switch_count integer not null default 0,
  source text not null default 'ai_suggested',
  created_at timestamptz not null default now(),
  unique (product_id, alternative_product_id),
  check (product_id <> alternative_product_id)
);

create index if not exists alternatives_product_idx on public.product_alternatives (product_id);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  source_product_id uuid references public.products on delete set null,
  user_id uuid references auth.users on delete set null,
  session_id text,
  clicked_at timestamptz not null default now(),
  destination_url text not null,
  affiliate_program text,
  source text
);

create index if not exists clicks_product_idx on public.affiliate_clicks (product_id);
create index if not exists clicks_time_idx on public.affiliate_clicks (clicked_at desc);

-- RLS
alter table public.products enable row level security;
alter table public.user_products enable row level security;
alter table public.product_alternatives enable row level security;
alter table public.affiliate_clicks enable row level security;

-- Products + alternatives: world-readable, writes restricted to service role.
create policy "products read" on public.products for select using (true);
create policy "alternatives read" on public.product_alternatives for select using (true);

-- Each user manages only their own rows.
create policy "own user_products read" on public.user_products
  for select using (auth.uid() = user_id);
create policy "own user_products insert" on public.user_products
  for insert with check (auth.uid() = user_id);
create policy "own user_products update" on public.user_products
  for update using (auth.uid() = user_id);
create policy "own user_products delete" on public.user_products
  for delete using (auth.uid() = user_id);

-- Affiliate click inserts allowed for anyone (logged in or anon); reads restricted to service role.
create policy "clicks insert" on public.affiliate_clicks for insert with check (true);

-- Recompute product aggregates whenever a user_products row changes.
create or replace function public.recompute_product_regret(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_regret_weighted numeric;
  v_total_weighted numeric;
  v_would_pct integer;
  v_avg30 numeric;
  v_avg60 numeric;
  v_avg90 numeric;
begin
  select
    count(*) filter (where satisfaction_day30 is not null
                         or satisfaction_day60 is not null
                         or satisfaction_day90 is not null),
    coalesce(sum(
      case when satisfaction_day30 is not null and satisfaction_day30 <= 2 then 1 else 0 end * 1
      + case when satisfaction_day60 is not null and satisfaction_day60 <= 2 then 1 else 0 end * 2
      + case when satisfaction_day90 is not null and satisfaction_day90 <= 2 then 1 else 0 end * 3
    ), 0),
    coalesce(sum(
      case when satisfaction_day30 is not null then 1 else 0 end * 1
      + case when satisfaction_day60 is not null then 1 else 0 end * 2
      + case when satisfaction_day90 is not null then 1 else 0 end * 3
    ), 0),
    round(100.0 * avg(case when would_buy_again then 1 else 0 end))::int,
    avg(satisfaction_day30),
    avg(satisfaction_day60),
    avg(satisfaction_day90)
  into v_total, v_regret_weighted, v_total_weighted, v_would_pct, v_avg30, v_avg60, v_avg90
  from public.user_products
  where product_id = p_id;

  if v_total_weighted = 0 then
    return;
  end if;

  update public.products
  set
    regret_score = greatest(0, least(100, round(100.0 * v_regret_weighted / v_total_weighted)::int)),
    would_buy_again_pct = coalesce(v_would_pct, 0),
    total_ratings = v_total,
    avg_satisfaction_day30 = v_avg30,
    avg_satisfaction_day60 = v_avg60,
    avg_satisfaction_day90 = v_avg90,
    is_ai_estimated = false,
    updated_at = now()
  where id = p_id;
end;
$$;

create or replace function public.on_user_products_change()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_product_regret(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists user_products_recompute on public.user_products;
create trigger user_products_recompute
after insert or update or delete on public.user_products
for each row execute function public.on_user_products_change();
