-- Schedule autonomous ingestion of treasury USDC deposits.
-- Requires pg_cron + pg_net/http extensions.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove previous job if present.
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'ingest_treasury_deposits_every_minute'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'ingest_treasury_deposits_every_minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://agqkiwarwxrcemhspxxv.supabase.co/functions/v1/ingest-treasury-deposits',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
