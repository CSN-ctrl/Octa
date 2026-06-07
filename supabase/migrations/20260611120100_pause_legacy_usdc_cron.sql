-- Pause legacy mainnet USDC treasury ingest until VITE_MAINNET_USDC_RAIL=true in production.
-- Fuji AVAX deposit indexer (ingest_fuji_deposits_every_minute) remains active.
--
-- Re-enable when mainnet USDC rail is ready:
--   Re-apply 20260414215500_schedule_treasury_ingestion_job.sql

CREATE EXTENSION IF NOT EXISTS pg_cron;

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
