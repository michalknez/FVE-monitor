create table if not exists public.inverter_readings (
  id              uuid primary key default gen_random_uuid(),
  inverter_id     uuid not null references public.inverters(id) on delete cascade,
  recorded_at     timestamptz not null,
  vdc1            numeric, vdc2 numeric, vdc3 numeric, vdc4 numeric,
  idc1            numeric, idc2 numeric, idc3 numeric, idc4 numeric,
  vac1            numeric, vac2 numeric, vac3 numeric,
  soc             numeric,
  battemper       numeric,
  acpower         numeric,
  yieldtoday      numeric,
  inverter_status text,
  created_at      timestamptz not null default now()
);

create index if not exists inverter_readings_inverter_id_idx
  on public.inverter_readings (inverter_id);
create index if not exists inverter_readings_recorded_at_idx
  on public.inverter_readings (recorded_at desc);

alter table public.inverter_readings enable row level security;
-- Edge Function přistupuje přes supabaseAdmin (service role), který RLS obchází.
-- Před produkcí přidat politiku pro přihlášeného admina.
