-- =====================================================================
-- Estudios de Observación · ARclad México · LCG
-- Correr una sola vez en el SQL Editor de Supabase.
-- Misma forma que la app compartida (studies / activities / perceptions)
-- más los campos del Plan de Vuelo (plan_id, frente, sede, semana).
-- =====================================================================
create extension if not exists pgcrypto;

create type public.activity_category as enum
  ('supervision_active','training','administrative','operative','travel','supervision_passive','unproductive');

create table public.studies (
  id uuid primary key default gen_random_uuid(),
  plan_id text,
  frente text not null,
  sede text,
  position text not null,
  collaborator_name text not null default '',
  created_by text not null,
  study_date date,
  semana text,
  objective text not null default '',
  status text not null default 'active' check (status in ('active','completed','archived')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  start_time time not null,
  end_time time,
  duration_seconds integer not null default 0,
  description text not null default '',
  category public.activity_category,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index activities_study_idx on public.activities(study_id);

create table public.perceptions (
  study_id uuid not null references public.studies(id) on delete cascade,
  perception_type text not null check (perception_type in ('actual','ideal')),
  supervision_active numeric not null default 0,
  training numeric not null default 0,
  administrative numeric not null default 0,
  operative numeric not null default 0,
  travel numeric not null default 0,
  supervision_passive numeric not null default 0,
  unproductive numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (study_id, perception_type)
);

-- Vista lista para Power BI: % por categoría por estudio
create or replace view public.v_resumen_estudio as
select s.id, s.plan_id, s.frente, s.sede, s.position as puesto, s.collaborator_name as persona, s.created_by as consultor, s.semana, s.study_date, s.status,
       a.category, sum(a.duration_seconds) as segundos,
       round(100.0 * sum(a.duration_seconds) / nullif(sum(sum(a.duration_seconds)) over (partition by s.id), 0), 1) as pct_observado
from public.studies s
left join public.activities a on a.study_id = s.id
group by s.id, a.category;

-- Seguridad: equipo interno de 3 sin login. La anon key permite leer y escribir; no publicarla fuera del equipo.
alter table public.studies enable row level security;
alter table public.activities enable row level security;
alter table public.perceptions enable row level security;
create policy "equipo estudios" on public.studies for all to anon using (true) with check (true);
create policy "equipo actividades" on public.activities for all to anon using (true) with check (true);
create policy "equipo percepciones" on public.perceptions for all to anon using (true) with check (true);

-- Semilla: los 7 EO del Plan de Vuelo DX (hoja "2. Plan Consultor", Tipo = Estudio de Observación)
insert into public.studies (plan_id, frente, created_by, position, objective, semana) values
 ('A--001','1. Forecast, Ventas & Inteligencia Comercial','Max Cuéllar','Asistente Comercial (captura de pedidos)','Validar retrabajos, confirmaciones de inventario por WhatsApp, recaptura, errores','S1'),
 ('A-000','1. Forecast, Ventas & Inteligencia Comercial','Max Cuéllar','Ejecutivo Comercial (día en la vida)','Medir % de tiempo en venta efectiva vs administrativa, pasos de la venta, uso de sistema','S1'),
 ('A-001','1. Forecast, Ventas & Inteligencia Comercial','Max Cuéllar','Gerente Comercial','','S2'),
 ('A-026','2. Importaciones & Compras Nacionales','Max Cuéllar','Ejecutivo de Importaciones','Seguimiento de tránsitos por correo, retrabajos, tiempos por actividad','S3'),
 ('A-027','2. Importaciones & Compras Nacionales','Max Cuéllar','Ejecutivo de Compras','% de compras reactivas en vivo; ciclo requisición→OC→firma; interrupciones','S4'),
 ('A-039','3. Programación & Producción','Pablo Sepúlveda','Programador de Producción','Obtención de información, programación, seguimiento a plan, supervisión en máquinas, secuenciación en Excel',null),
 ('A-041','3. Programación & Producción','Pablo Sepúlveda','Jefe de Almacén','',null);
