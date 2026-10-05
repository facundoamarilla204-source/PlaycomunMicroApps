-- =============================================================================
-- MIGRATION 006: qr_codes table
-- =============================================================================

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null,
  public_token text not null unique,
  status text not null check (status in ('unconfigured', 'active', 'paused', 'archived')) default 'unconfigured',
  destination_url text,
  destination_type text not null default 'url',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz
);

-- Index for public route fast lookups
create index if not exists idx_qr_codes_public_token on public.qr_codes(public_token);

-- Index for user's dashboard lookups
create index if not exists idx_qr_codes_user_id on public.qr_codes(user_id);

-- Enable RLS
alter table public.qr_codes enable row level security;

-- RLS policies
create policy "Users can view their own qr codes"
  on public.qr_codes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own qr codes"
  on public.qr_codes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own qr codes"
  on public.qr_codes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger for updated_at
create trigger on_qr_codes_updated
  before update on public.qr_codes
  for each row execute function public.handle_updated_at();

-- Public policy for viewing active QR destinations? 
-- Wait, we will resolve the QR via backend using service role, or a public view policy. 
-- The prompt says "El sistema público solamente necesita saber: public_token, status, destination_url".
-- So we can create a public read policy for specific fields, or just use the Supabase service role from Next.js server actions. 
-- Using Next.js Server Components with service role or admin privileges is safer. We'll leave it without a public policy to prevent people from scraping all tokens easily, or we can add a policy but it's not strictly necessary if resolved server-side.
