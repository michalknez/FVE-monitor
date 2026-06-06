-- Přidání sloupců pro energetická data a síťový přetok
alter table public.inverter_readings
  add column if not exists feedinpower  numeric,  -- přetok do sítě (W): + export, - odběr
  add column if not exists powerdc1     numeric,  -- FV výkon MPPT 1 (W)
  add column if not exists powerdc2     numeric,  -- FV výkon MPPT 2 (W)
  add column if not exists powerdc3     numeric,  -- FV výkon MPPT 3 (W)
  add column if not exists powerdc4     numeric,  -- FV výkon MPPT 4 (W)
  add column if not exists batpower     numeric,  -- výkon baterie (W): + nabíjení, - vybíjení
  add column if not exists ratedpower   numeric;  -- jmenovitý výkon střídače (W) z API
