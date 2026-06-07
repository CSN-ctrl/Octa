-- Seed plots 1–200 so Fuji land indexer sync_chain_plot_ownership can upsert ownership.
-- Idempotent: skips rows that already exist.

INSERT INTO public.plots (id, coord_x, coord_y, owner_wallet)
OVERRIDING SYSTEM VALUE
SELECT
  gs,
  (gs % 20)::numeric,
  (gs / 20)::numeric,
  NULL
FROM generate_series(1, 200) AS gs
ON CONFLICT (id) DO NOTHING;

-- Advance identity sequence past seeded rows when present.
DO $$
DECLARE
  v_seq text;
  v_max bigint;
BEGIN
  SELECT pg_get_serial_sequence('public.plots', 'id') INTO v_seq;
  IF v_seq IS NULL THEN
    RETURN;
  END IF;
  SELECT COALESCE(MAX(id), 0) INTO v_max FROM public.plots;
  IF v_max > 0 THEN
    PERFORM setval(v_seq::regclass, v_max, true);
  END IF;
END $$;
