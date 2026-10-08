create table tool_candidates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text not null,
  votos integer not null default 0,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table tool_votes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references tool_candidates(id) on delete cascade,
  voter_hash text not null,
  created_at timestamptz not null default now(),
  unique(candidate_id, voter_hash)
);

create table tool_suggestions (
  id uuid primary key default gen_random_uuid(),
  texto text not null,
  voter_hash text not null,
  estado text not null default 'pendiente',
  created_at timestamptz not null default now()
);

-- RLS policies
alter table tool_candidates enable row level security;
alter table tool_votes enable row level security;
alter table tool_suggestions enable row level security;

-- Public read access for candidates
create policy "Allow public read access for tool_candidates"
  on tool_candidates for select
  using (true);

-- No public insert/update/delete. Only service role can modify.
create policy "Service role can insert candidates" on tool_candidates for insert with check (true);
create policy "Service role can update candidates" on tool_candidates for update using (true);
create policy "Service role can delete candidates" on tool_candidates for delete using (true);

create policy "Service role can do all on votes" on tool_votes for all using (true) with check (true);
create policy "Service role can do all on suggestions" on tool_suggestions for all using (true) with check (true);

-- Insert initial candidates
insert into tool_candidates (slug, nombre, descripcion, votos) values
('calculadora-monotributo', 'Calculadora de monotributo', 'Simulá cuánto pagarías según tus ingresos.', 142),
('calculadora-comisiones-mercadopago', 'Calculadora de comisiones de Mercado Pago', 'Calculá los costos por cobrar con distintos medios.', 189),
('generador-recibos', 'Generador de recibos', 'Creá recibos simples y profesionales en PDF.', 95),
('calculadora-punto-equilibrio', 'Calculadora de punto de equilibrio', 'Descubrí cuánto necesitás vender para no perder dinero.', 120),
('generador-contratos-alquiler', 'Generador de contratos de alquiler', 'Plantillas actualizadas según la ley vigente.', 68),
('calculadora-indemnizacion', 'Calculadora de indemnización', 'Estimá liquidaciones por despido o renuncia.', 215);
