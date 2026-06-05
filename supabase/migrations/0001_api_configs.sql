-- Tabulka konfigurací API jednotlivých výrobců elektráren.
create table if not exists public.api_configs (
  id            uuid primary key default gen_random_uuid(),
  brand         text not null,
  url           text not null,
  token         text not null,
  test_wifi_sn  text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Jeden záznam na značku (aplikace s tím počítá při předvyplnění i ukládání).
create unique index if not exists api_configs_brand_key on public.api_configs (brand);

-- Row Level Security. Tokeny jsou citlivé — bez politiky níže nebude mít
-- anon klient k tabulce přístup. Politiky upravte podle reálné autentizace
-- administrace (např. jen role 'authenticated' nebo dedikovaná admin role).
alter table public.api_configs enable row level security;
