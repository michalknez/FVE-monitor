-- RPC: měsíční výroba per invertor
-- Logika: MAX(yieldtoday) per den (kumulativní čítač) → SUM per měsíc
create or replace function public.get_monthly_production(p_inverter_ids uuid[])
returns table(inverter_id uuid, month timestamptz, monthly_kwh numeric)
language sql
stable
security invoker
as $$
  select
    inverter_id,
    date_trunc('month', day) as month,
    sum(daily_max)::numeric as monthly_kwh
  from (
    select
      inverter_id,
      date_trunc('day', recorded_at) as day,
      max(yieldtoday) as daily_max
    from public.inverter_readings
    where inverter_id = any(p_inverter_ids)
      and yieldtoday is not null
      and yieldtoday > 0
    group by inverter_id, date_trunc('day', recorded_at)
  ) daily
  group by inverter_id, date_trunc('month', day)
  order by month desc;
$$;
