-- =============================================================================
-- MIGRATION: Commercial Documents System (Generador de Documentos Comerciales)
-- PlayComun - Presupuestos, Recibos, Ordenes de Trabajo y Facturas Proforma
-- =============================================================================

-- 1. BUSINESS PROFILES (Identidad comercial persistente del emisor)
create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text not null,
  tax_id text,
  phone text,
  email text,
  address text,
  city text,
  logo_url text,
  default_currency text not null default 'ARS',
  default_template text not null default 'modern',
  default_accent_color text not null default '#7C3AED',
  default_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_profiles is 'Commercial business profiles for emisor settings and identity';

-- 2. COMMERCIAL CLIENTS (Agenda y directorio de clientes del usuario)
create table if not exists public.commercial_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  tax_id text,
  phone text,
  email text,
  address text,
  city text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.commercial_clients is 'Saved client directory per user';

-- 3. COMMERCIAL PRODUCTS (Catalogo de productos y servicios reutilizables)
create table if not exists public.commercial_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  default_unit_price numeric(14, 2) not null default 0,
  default_discount numeric(5, 2) not null default 0,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.commercial_products is 'Saved product and service catalog per user';

-- 4. DOCUMENT SEQUENCES (Contador atomico correlativo independiente por tipo y usuario)
create table if not exists public.document_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('presupuesto', 'recibo', 'orden-trabajo', 'factura-proforma')),
  prefix text not null,
  current_number integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_user_document_type unique (user_id, document_type)
);

comment on table public.document_sequences is 'Per-user sequential counters for each commercial document type';

-- 5. COMMERCIAL DOCUMENTS (Cabecera e historial de documentos emitidos)
create table if not exists public.commercial_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('presupuesto', 'recibo', 'orden-trabajo', 'factura-proforma')),
  number text not null,
  issue_date date not null default current_date,
  currency text not null default 'ARS',
  client_id uuid references public.commercial_clients(id) on delete set null,
  emisor_snapshot jsonb not null,
  client_snapshot jsonb not null,
  global_discount_percent numeric(5, 2) not null default 0,
  apply_tax boolean not null default false,
  tax_rate numeric(5, 2) not null default 21,
  raw_subtotal numeric(14, 2) not null default 0,
  lines_discount_total numeric(14, 2) not null default 0,
  global_discount_amount numeric(14, 2) not null default 0,
  taxable_base numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  grand_total numeric(14, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  design_template text not null default 'modern',
  accent_color text not null default '#7C3AED',
  footer_notes text,
  status text not null default 'borrador' check (status in ('borrador', 'enviado', 'aceptado', 'cobrado', 'vencido', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.commercial_documents is 'Headers and snapshots of generated commercial documents';

-- 6. COMMERCIAL DOCUMENT ITEMS (Lineas de conceptos o tareas del comprobante)
create table if not exists public.commercial_document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.commercial_documents(id) on delete cascade,
  product_id uuid references public.commercial_products(id) on delete set null,
  description text not null,
  quantity numeric(12, 3) not null default 1,
  unit_price numeric(14, 2) not null default 0,
  discount_percent numeric(5, 2) not null default 0,
  subtotal numeric(14, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.commercial_document_items is 'Item lines belonging to a commercial document';

-- =============================================================================
-- INDEXES
-- =============================================================================
create index if not exists idx_business_profiles_user on public.business_profiles(user_id);
create index if not exists idx_commercial_clients_user on public.commercial_clients(user_id);
create index if not exists idx_commercial_products_user on public.commercial_products(user_id);
create index if not exists idx_document_sequences_lookup on public.document_sequences(user_id, document_type);
create index if not exists idx_commercial_documents_user on public.commercial_documents(user_id);
create index if not exists idx_commercial_documents_type on public.commercial_documents(type);
create index if not exists idx_commercial_documents_client on public.commercial_documents(client_id);
create index if not exists idx_commercial_documents_created on public.commercial_documents(created_at desc);
create index if not exists idx_commercial_document_items_doc on public.commercial_document_items(document_id);

-- =============================================================================
-- ATOMIC FUNCTION FOR NEXT CORRELATIVE NUMBER
-- =============================================================================
create or replace function public.get_next_document_number(
  p_user_id uuid,
  p_type text,
  p_custom_prefix text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_next_num integer;
  v_formatted text;
begin
  -- Resolve default prefix if not provided
  if p_custom_prefix is not null and trim(p_custom_prefix) <> '' then
    v_prefix := upper(trim(p_custom_prefix));
  else
    case p_type
      when 'presupuesto' then v_prefix := 'PRE';
      when 'recibo' then v_prefix := 'REC';
      when 'orden-trabajo' then v_prefix := 'OT';
      when 'factura-proforma' then v_prefix := 'PRO';
      else v_prefix := 'DOC';
    end case;
  end if;

  -- Atomic upsert with lock
  insert into public.document_sequences (user_id, document_type, prefix, current_number)
  values (p_user_id, p_type, v_prefix, 1)
  on conflict (user_id, document_type)
  do update set
    current_number = public.document_sequences.current_number + 1,
    prefix = coalesce(v_prefix, public.document_sequences.prefix),
    updated_at = now()
  returning current_number, prefix into v_next_num, v_prefix;

  -- Formats as PREFIX-0001
  v_formatted := v_prefix || '-' || lpad(v_next_num::text, 4, '0');
  return v_formatted;
end;
$$;

comment on function public.get_next_document_number is 'Increments and returns the next correlative document number for a user and document type atomically';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
alter table public.business_profiles enable row level security;
alter table public.commercial_clients enable row level security;
alter table public.commercial_products enable row level security;
alter table public.document_sequences enable row level security;
alter table public.commercial_documents enable row level security;
alter table public.commercial_document_items enable row level security;

-- Policies for business_profiles
create policy "Users can view their own business profile"
  on public.business_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own business profile"
  on public.business_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own business profile"
  on public.business_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own business profile"
  on public.business_profiles for delete
  using (auth.uid() = user_id);

-- Policies for commercial_clients
create policy "Users can view their own clients"
  on public.commercial_clients for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clients"
  on public.commercial_clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clients"
  on public.commercial_clients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own clients"
  on public.commercial_clients for delete
  using (auth.uid() = user_id);

-- Policies for commercial_products
create policy "Users can view their own products"
  on public.commercial_products for select
  using (auth.uid() = user_id);

create policy "Users can insert their own products"
  on public.commercial_products for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own products"
  on public.commercial_products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own products"
  on public.commercial_products for delete
  using (auth.uid() = user_id);

-- Policies for document_sequences
create policy "Users can view their own sequences"
  on public.document_sequences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sequences"
  on public.document_sequences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sequences"
  on public.document_sequences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for commercial_documents
create policy "Users can view their own documents"
  on public.commercial_documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on public.commercial_documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on public.commercial_documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on public.commercial_documents for delete
  using (auth.uid() = user_id);

-- Policies for commercial_document_items
create policy "Users can view items of their documents"
  on public.commercial_document_items for select
  using (
    exists (
      select 1 from public.commercial_documents d
      where d.id = commercial_document_items.document_id
        and d.user_id = auth.uid()
    )
  );

create policy "Users can insert items to their documents"
  on public.commercial_document_items for insert
  with check (
    exists (
      select 1 from public.commercial_documents d
      where d.id = document_id
        and d.user_id = auth.uid()
    )
  );

create policy "Users can update items of their documents"
  on public.commercial_document_items for update
  using (
    exists (
      select 1 from public.commercial_documents d
      where d.id = commercial_document_items.document_id
        and d.user_id = auth.uid()
    )
  );

create policy "Users can delete items of their documents"
  on public.commercial_document_items for delete
  using (
    exists (
      select 1 from public.commercial_documents d
      where d.id = commercial_document_items.document_id
        and d.user_id = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS FOR updated_at
-- =============================================================================
create trigger on_business_profiles_updated
  before update on public.business_profiles
  for each row execute function public.handle_updated_at();

create trigger on_commercial_clients_updated
  before update on public.commercial_clients
  for each row execute function public.handle_updated_at();

create trigger on_commercial_products_updated
  before update on public.commercial_products
  for each row execute function public.handle_updated_at();

create trigger on_document_sequences_updated
  before update on public.document_sequences
  for each row execute function public.handle_updated_at();

create trigger on_commercial_documents_updated
  before update on public.commercial_documents
  for each row execute function public.handle_updated_at();
