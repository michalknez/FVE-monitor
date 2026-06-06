alter table public.plants
  add column if not exists subscription_until date;
