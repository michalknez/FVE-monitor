-- GoodWe SEMS API přihlašovací údaje a OAuth tokeny
alter table public.api_configs
  add column if not exists username               text,         -- přihlašovací email SEMS
  add column if not exists password               text,         -- heslo SEMS (plain-text, dev only)
  add column if not exists sems_token             text,         -- OAuth token z CrossLogin
  add column if not exists sems_uid               text,         -- UID z CrossLogin
  add column if not exists sems_api_url           text,         -- API base URL z CrossLogin (data.api)
  add column if not exists sems_token_expires_at  timestamptz;  -- platnost tokenu (now + 24h)

-- GoodWe PowerStation ID na invertoru (odpovídá powerStationId v SEMS API)
alter table public.inverters
  add column if not exists external_id text;
