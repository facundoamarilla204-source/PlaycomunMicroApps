-- =============================================================================
-- MIGRATION 002: plans + features + tool_features
-- PlayComun Pro Architecture — Phase 4 & 5
-- =============================================================================

-- =============================================================================
-- PHASE 4: Plans table
-- =============================================================================

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  currency text not null default 'ARS',
  billing_interval text check (billing_interval in ('month', 'year', 'once', 'none')),
  trial_days integer not null default 0,
  provider text check (provider in ('mercadopago', 'manual', null)),
  provider_plan_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.plans is 'Commercial plans (free, pro_monthly, pro_yearly)';
comment on column public.plans.trial_days is 'Number of trial days. Configurable without schema changes.';
comment on column public.plans.provider_plan_id is 'MercadoPago preapproval_plan ID. Set when configuring real payments.';

-- Enable RLS
alter table public.plans enable row level security;

-- Plans are publicly readable (anyone can see the pricing)
create policy "Plans are publicly readable"
  on public.plans for select
  using (true);

-- Only service_role can modify plans (no client-side mutations)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated roles

-- updated_at trigger
create trigger on_plan_updated
  before update on public.plans
  for each row execute function public.handle_updated_at();

-- Seed initial plans
insert into public.plans (code, name, description, price, currency, billing_interval, trial_days, is_active)
values
  ('free', 'Plan Gratuito', 'Acceso a herramientas básicas con publicidad.', 0, 'ARS', 'none', 0, true),
  ('pro_monthly', 'PlayComun Pro Mensual', 'Todas las funcionalidades Pro, sin publicidad en herramientas. Facturación mensual.', 0, 'ARS', 'month', 0, true),
  ('pro_yearly', 'PlayComun Pro Anual', 'Todas las funcionalidades Pro, sin publicidad en herramientas. Facturación anual con descuento.', 0, 'ARS', 'year', 0, true);

-- =============================================================================
-- PHASE 5: Features + tool_features (flexible premium feature mapping)
-- =============================================================================

create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.features is 'Catalog of features that can be free or premium per tool';

-- Enable RLS
alter table public.features enable row level security;

-- Features catalog is publicly readable
create policy "Features are publicly readable"
  on public.features for select
  using (true);

create table if not exists public.tool_features (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  feature_id uuid not null references public.features(id) on delete cascade,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tool_slug, feature_id)
);

comment on table public.tool_features is 'Maps features to tools, defining which are premium (Pro) per tool';

-- Enable RLS
alter table public.tool_features enable row level security;

-- Tool features are publicly readable (so the app can check access)
create policy "Tool features are publicly readable"
  on public.tool_features for select
  using (true);

-- Indexes for performance
create index if not exists idx_tool_features_tool_slug on public.tool_features(tool_slug);
create index if not exists idx_tool_features_feature_id on public.tool_features(feature_id);

-- Seed example features (these are real feature codes for actual tools)
-- No fake data — these are the real feature categories for generador-presupuestos
insert into public.features (code, name, description) values
  ('create_pdf', 'Generar PDF', 'Generar presupuesto en formato PDF'),
  ('print_document', 'Imprimir', 'Imprimir el documento desde el navegador'),
  ('custom_logo', 'Logo propio', 'Usar logo personalizado en los documentos'),
  ('custom_colors', 'Colores personalizados', 'Personalizar los colores del documento'),
  ('saved_business_data', 'Datos comerciales guardados', 'Guardar y reutilizar datos del emisor'),
  ('document_history', 'Historial de documentos', 'Acceder al historial de documentos generados'),
  ('export_excel', 'Exportar a Excel', 'Exportar datos a formato Excel'),
  ('remove_watermark', 'Sin marca de agua', 'Documentos sin la marca de PlayComun'),
  ('no_ads', 'Sin publicidad', 'Eliminar publicidad dentro de las herramientas');

-- Map features to generador-presupuestos as example
-- The app should register tool_features when developing each tool
insert into public.tool_features (tool_slug, feature_id, is_premium)
select 'generador-presupuestos', f.id, 
  case 
    when f.code in ('create_pdf', 'print_document') then false
    else true
  end
from public.features f
where f.code in ('create_pdf', 'print_document', 'custom_logo', 'custom_colors', 'saved_business_data', 'document_history', 'remove_watermark');
