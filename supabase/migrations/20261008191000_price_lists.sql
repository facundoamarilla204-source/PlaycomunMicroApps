-- =============================================================================
-- MIGRATION: Price Lists (Generador de Listas de Precios)
-- =============================================================================

create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  business_name text,
  contact_info text,
  description text,
  updated_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.price_lists is 'User created price lists';

create table if not exists public.price_list_products (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.price_lists(id) on delete cascade,
  name text not null,
  price numeric(12, 2) not null,
  category text,
  code text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.price_list_products is 'Products belonging to a price list';

-- Create indexes
create index if not exists idx_price_lists_user_id on public.price_lists(user_id);
create index if not exists idx_price_list_products_list_id on public.price_list_products(list_id);

-- Enable RLS
alter table public.price_lists enable row level security;
alter table public.price_list_products enable row level security;

-- Policies for price_lists
create policy "Users can view their own price lists"
  on public.price_lists for select
  using (auth.uid() = user_id);

create policy "Users can insert their own price lists"
  on public.price_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own price lists"
  on public.price_lists for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own price lists"
  on public.price_lists for delete
  using (auth.uid() = user_id);

-- Policies for price_list_products
create policy "Users can view products of their price lists"
  on public.price_list_products for select
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_products.list_id
      and pl.user_id = auth.uid()
    )
  );

create policy "Users can insert products to their price lists"
  on public.price_list_products for insert
  with check (
    exists (
      select 1 from public.price_lists pl
      where pl.id = list_id
      and pl.user_id = auth.uid()
    )
  );

create policy "Users can update products of their price lists"
  on public.price_list_products for update
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_products.list_id
      and pl.user_id = auth.uid()
    )
  );

create policy "Users can delete products of their price lists"
  on public.price_list_products for delete
  using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_products.list_id
      and pl.user_id = auth.uid()
    )
  );

-- Triggers for updated_at
create trigger on_price_lists_updated
  before update on public.price_lists
  for each row execute function public.handle_updated_at();

create trigger on_price_list_products_updated
  before update on public.price_list_products
  for each row execute function public.handle_updated_at();
