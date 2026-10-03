-- Create payment_methods table
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('mercadopago')),
  provider_customer_id text,
  provider_card_id text,
  type text not null check (type in ('card', 'mercado_pago_account', 'other')),
  brand text,
  last_four_digits text,
  expiration_month integer,
  expiration_year integer,
  is_default boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payment_methods is 'Stored payment methods (metadata only, no sensitive info).';

-- Enable RLS
alter table public.payment_methods enable row level security;

-- RLS policies for payment_methods
create policy "Users can view own payment methods"
  on public.payment_methods for select
  using (auth.uid() = user_id);

create policy "Users can insert own payment methods"
  on public.payment_methods for insert
  with check (auth.uid() = user_id);

create policy "Users can update own payment methods"
  on public.payment_methods for update
  using (auth.uid() = user_id);

create policy "Users can delete own payment methods"
  on public.payment_methods for delete
  using (auth.uid() = user_id);
