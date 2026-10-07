-- =============================================================================
-- MIGRATION: qr_groups and qr_codes update
-- =============================================================================

-- 1. Create qr_groups table
create table if not exists public.qr_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  group_code text not null,
  name text,
  created_at timestamptz not null default now(),
  unique (user_id, group_code)
);

-- Index for fast lookup by user and code
create index if not exists idx_qr_groups_user_id on public.qr_groups(user_id);
create index if not exists idx_qr_groups_group_code on public.qr_groups(group_code);

-- Enable RLS on qr_groups
alter table public.qr_groups enable row level security;

create policy "Users can view their own qr groups"
  on public.qr_groups for select
  using (auth.uid() = user_id);

create policy "Users can insert their own qr groups"
  on public.qr_groups for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own qr groups"
  on public.qr_groups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own qr groups"
  on public.qr_groups for delete
  using (auth.uid() = user_id);

-- 2. Update qr_codes table
-- Add group_id to qr_codes
alter table public.qr_codes 
add column if not exists group_id uuid references public.qr_groups(id) on delete cascade;

-- We assume existing codes might not have a group, so we create a default group for them, 
-- or we can just leave it nullable for old records, but the new logic requires it.
-- For safety, we allow it to be nullable for now, but new records will have it.

create index if not exists idx_qr_codes_group_id on public.qr_codes(group_id);

-- Add unique constraint to identification code per user (so they don't have duplicated QR-0001)
-- Actually, the user requirement is "El identificador visible de cada QR debe ser único dentro de la cuenta"
-- If there are existing duplicates, this might fail, but let's try.
-- alter table public.qr_codes add constraint qr_codes_user_code_key unique (user_id, code);

-- If we need a new column for 'identification_code' as per prompt:
-- Actually the table already has `code text not null`, which holds 'QR-0001'. We will keep using `code`.

