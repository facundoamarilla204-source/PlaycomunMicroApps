-- =============================================================================
-- MIGRATION 20261016070000: consumer_requests table
-- Gestor de solicitudes de Arrepentimiento, Baja de Servicio y Derechos ARCO
-- Conforme a Ley 24.240, Ley 25.326, Disposición 954/2025 y Disposición 3/2026
-- =============================================================================

create table if not exists public.consumer_requests (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  request_type text not null check (request_type in ('arrepentimiento', 'baja_servicio', 'eliminacion_cuenta', 'consulta_legal')),
  full_name text not null,
  email text not null,
  phone text,
  details text,
  payment_reference text,
  status text not null default 'received' check (status in ('received', 'in_review', 'resolved', 'rejected')),
  notification_status text not null default 'pending' check (notification_status in ('pending', 'sent', 'failed', 'not_configured')),
  notification_error text,
  notification_sent_at timestamptz,
  user_id uuid references auth.users(id) on delete set null,
  ip_address text,
  user_agent text,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.consumer_requests is 'Registro de solicitudes de arrepentimiento, baja de servicio y reclamos de consumidores conforme a normativa argentina.';
comment on column public.consumer_requests.tracking_code is 'Código único de identificación de la solicitud informado al consumidor dentro de las 24 hs.';

-- Habilitar RLS
alter table public.consumer_requests enable row level security;

-- Política de inserción: permite que cualquier usuario (anónimo o autenticado) registre una solicitud
-- Esto cumple con el requisito legal de no exigir registración previa para ejercer el derecho de arrepentimiento o baja
create policy "Cualquier persona puede registrar una solicitud de consumidor"
  on public.consumer_requests for insert
  with check (true);

-- Política de lectura: usuarios autenticados pueden ver sus propias solicitudes registradas
create policy "Usuarios pueden ver sus propias solicitudes"
  on public.consumer_requests for select
  using (
    auth.uid() = user_id
    or email = (select email from auth.users where id = auth.uid())
  );

-- Admins pueden consultar y gestionar todas las solicitudes
create policy "Admins pueden ver todas las solicitudes de consumidores"
  on public.consumer_requests for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Admins pueden actualizar solicitudes de consumidores"
  on public.consumer_requests for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Trigger para updated_at
create trigger on_consumer_request_updated
  before update on public.consumer_requests
  for each row execute function public.handle_updated_at();

-- Índices para búsqueda rápida por tracking_code, email y tipo
create index if not exists idx_consumer_requests_tracking_code on public.consumer_requests(tracking_code);
create index if not exists idx_consumer_requests_email on public.consumer_requests(email);
create index if not exists idx_consumer_requests_type on public.consumer_requests(request_type);
create index if not exists idx_consumer_requests_created_at on public.consumer_requests(created_at desc);
