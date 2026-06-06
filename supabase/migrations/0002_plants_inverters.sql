-- Elektrárny (plants) a jejich invertory (inverters). 1 elektrárna → N invertorů.
-- wifi_sn + brand patří invertoru (klíč pro Solax API dotazy), ne elektrárně.

create table if not exists public.plants (
  id                uuid primary key default gen_random_uuid(),
  owner_first_name  text not null,
  owner_last_name   text not null,
  owner_email       text,
  owner_phone       text,
  address           text,
  gps_lat           numeric,
  gps_lng           numeric,
  reserved_power_kw numeric,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.inverters (
  id          uuid primary key default gen_random_uuid(),
  plant_id    uuid not null references public.plants(id) on delete cascade,
  wifi_sn     text not null,
  brand       text not null,
  label       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists inverters_plant_id_idx on public.inverters (plant_id);

-- Row Level Security. Zatím permisivní dev politiky (anon plný přístup), aby
-- aplikace fungovala bez přihlášení. PŘED PRODUKCÍ zúžit na přihlášeného admina
-- (role 'authenticated' / dedikovaná role) — viz stejný režim jako u api_configs.
alter table public.plants enable row level security;
alter table public.inverters enable row level security;

create policy "dev_all_plants" on public.plants
  for all using (true) with check (true);

create policy "dev_all_inverters" on public.inverters
  for all using (true) with check (true);
