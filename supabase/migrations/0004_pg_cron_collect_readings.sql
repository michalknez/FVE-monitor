-- pg_cron job: volá Edge Function collect-readings každých 15 minut.
--
-- PREREKVIZITA — service role key musí být v Vault (spusť jednou v SQL editoru):
--   insert into vault.secrets (name, secret)
--   values ('service_role_key', '<klíč z Dashboard → Settings → API → service_role>');
--
-- Smazání jobu: select cron.unschedule('collect-readings-15min');

select cron.schedule(
  'collect-readings-15min',
  '*/15 * * * *',
  $cron$
  select net.http_post(
    url     := 'https://qbzodjtzkcomdpggphrl.supabase.co/functions/v1/collect-readings',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from   vault.decrypted_secrets
        where  name = 'service_role_key'
        limit  1
      )
    ),
    body    := '{}'::jsonb
  );
  $cron$
);
