-- =============================================================================
-- MIGRATION 003: subscriptions + payments + webhook_events
-- PlayComun Pro Architecture — Phase 6, 7 & 8
-- =============================================================================

-- =============================================================================
-- PHASE 6: subscriptions
-- =============================================================================

create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired'
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  provider text check (provider in ('mercadopago', 'manual')),
  provider_subscription_id text,
  provider_plan_id text,
  provider_status text,
  status public.subscription_status not null default 'active',
  trial_start_at timestamptz,
  trial_end_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is 'User subscriptions to plans. Source of truth for Pro access.';
comment on column public.subscriptions.status is 'Internal PlayComun status for access decisions.';
comment on column public.subscriptions.provider_status is 'Raw status from MercadoPago for reference.';

alter table public.subscriptions enable row level security;

-- Users can only read their own subscriptions
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated users
-- Only service_role (backend) can modify subscriptions

create trigger on_subscription_updated
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Indexes
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_subscriptions_provider_subscription_id
  on public.subscriptions(provider_subscription_id);

-- =============================================================================
-- PHASE 7: payments
-- =============================================================================

create type public.payment_status as enum (
  'pending', 'approved', 'rejected', 'refunded', 'cancelled', 'in_process'
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text check (provider in ('mercadopago', 'manual')),
  provider_payment_id text,
  amount numeric(10, 2) not null,
  currency text not null default 'ARS',
  status public.payment_status not null default 'pending',
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.payments is 'Payment history for each user subscription.';

alter table public.payments enable row level security;

-- Users can only read their own payments
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE for authenticated users

create trigger on_payment_updated
  before update on public.payments
  for each row execute function public.handle_updated_at();

-- Indexes
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_subscription_id on public.payments(subscription_id);
create index if not exists idx_payments_provider_payment_id on public.payments(provider_payment_id);

-- =============================================================================
-- PHASE 8: webhook_events (idempotent webhook processing)
-- =============================================================================

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mercadopago')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  processed boolean not null default false,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

comment on table public.webhook_events is 'Incoming webhook events. Unique constraint prevents duplicate processing.';

alter table public.webhook_events enable row level security;

-- No policies for anon/authenticated: webhooks are server-side only
-- Only service_role can read/write

-- Indexes
create index if not exists idx_webhook_events_processed on public.webhook_events(processed)
  where not processed;
create index if not exists idx_webhook_events_provider_event_id
  on public.webhook_events(provider, event_id);
