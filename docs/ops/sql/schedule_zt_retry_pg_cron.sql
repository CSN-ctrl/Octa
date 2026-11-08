-- Manual ops script: schedule ZeroTier pending retries via pg_cron + pg_net.
-- Does NOT run automatically from CI — apply in Supabase SQL Editor after Vault secrets exist.
--
-- Vault secret names (create via Dashboard or vault.create_secret):
--   zt_retry_url   — full URL, e.g. https://www.sarakt.com/api/nodes/zt-retry
--   cron_secret    — same value as Vercel CRON_SECRET for the deployment
--
-- Matches removed Vercel cron: */15 * * * * (commit 67ac703, vercel.json)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'zt_retry_vercel'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'zt_retry_vercel',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'zt_retry_url' LIMIT 1),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
