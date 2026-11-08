-- Fuji indexer cutover to the 2026-08-16 free-test stack.
-- Land/Treasury creation block: 57793346
--   Land create tx:     0xfc0d6fa1c58af94e65c23b006d0d80055eaef8c66a91a6a925c430f0c62e7446
--   Treasury first tx:  same block (Routescan / Fuji 43113)
--
-- Why reset: cron checkpoints sit at chain-head from the *previous* addresses.
-- Continuing from last_ingested_block would skip this stack's history
-- (grants, resets, deposits between deploy and now).
--
-- Idempotency: onchain_deposits.tx_hash is unique; land sync is chain-wins.
-- Re-scan from deploy is safe to replay.
--
-- No RLS change: checkpoints remain service-role / SECURITY DEFINER ingest path.

INSERT INTO public.treasury_ingest_checkpoints (
  chain_id,
  last_ingested_block,
  last_run_status,
  last_run_error
) VALUES
  (
    'fuji',
    57793345,
    'idle',
    'cutover: fuji stack 0x5b468dfa… @ 57793346'
  ),
  (
    'fuji-land',
    57793345,
    'idle',
    'cutover: fuji-land stack 0x60fe4241… @ 57793346'
  )
ON CONFLICT (chain_id) DO UPDATE
SET
  last_ingested_block = EXCLUDED.last_ingested_block,
  last_run_status = 'idle',
  last_run_error = EXCLUDED.last_run_error,
  updated_at = now();
