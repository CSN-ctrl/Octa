-- Runtime hardening for treasury USDC ingest:
-- - durable per-chain checkpoints
-- - replay/failure observability
-- - schema-level idempotency for source tx hash conversions

CREATE TABLE IF NOT EXISTS public.treasury_ingest_checkpoints (
  chain_id text PRIMARY KEY,
  last_ingested_block bigint NOT NULL DEFAULT 0,
  last_ingested_at timestamptz,
  last_run_started_at timestamptz,
  last_run_completed_at timestamptz,
  last_run_status text NOT NULL DEFAULT 'idle' CHECK (last_run_status IN ('idle', 'running', 'ok', 'partial', 'error')),
  last_run_error text,
  total_ingested_count bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treasury_ingest_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id text NOT NULL,
  source_tx_hash text NOT NULL,
  source_unique_id text,
  source_block_num bigint,
  error_message text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  retry_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  resolved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_treasury_ingest_failures_chain_source_hash
  ON public.treasury_ingest_failures (lower(chain_id), lower(source_tx_hash));

CREATE INDEX IF NOT EXISTS idx_treasury_ingest_failures_status_last_seen
  ON public.treasury_ingest_failures (status, last_seen_at DESC);

-- Canonical idempotency guard: one conversion ledger row per source tx hash.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_source_tx_hash_deposit_conversion
  ON public.transactions (lower(metadata->>'source_tx_hash'))
  WHERE transaction_type = 'treasury_transfer'
    AND type = 'deposit_conversion'
    AND coalesce(metadata->>'source_tx_hash', '') <> '';

-- Track touch time on checkpoint updates.
CREATE OR REPLACE FUNCTION public.touch_treasury_ingest_checkpoint_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_treasury_ingest_checkpoint_updated_at ON public.treasury_ingest_checkpoints;
CREATE TRIGGER trg_touch_treasury_ingest_checkpoint_updated_at
BEFORE UPDATE ON public.treasury_ingest_checkpoints
FOR EACH ROW
EXECUTE FUNCTION public.touch_treasury_ingest_checkpoint_updated_at();
