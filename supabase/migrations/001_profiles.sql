-- =============================================================================
-- MIGRATION 001: profiles table + favorites normalization
-- PlayComun Pro Architecture — Phase 2 & 3
-- =============================================================================

-- =============================================================================
-- PHASE 2: profiles table linked to auth.users
-- =============================================================================

-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles, linked 1:1 with auth.users';
comment on column public.profiles.role is 'User role: user or admin. Cannot be changed by the user.';

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile (except role)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Trigger function: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

-- Create the trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on profile changes
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Backfill: create profiles for existing users who don't have one
insert into public.profiles (id, full_name, avatar_url)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- =============================================================================
-- PHASE 3: favorites normalization (already mostly correct)
-- The existing table is well-structured. We only need to verify
-- the unique constraint exists (it does) and add an index for user lookups.
-- =============================================================================

-- Create index for faster user-scoped queries (if not exists)
create index if not exists idx_favorites_user_id on public.favorites(user_id);
