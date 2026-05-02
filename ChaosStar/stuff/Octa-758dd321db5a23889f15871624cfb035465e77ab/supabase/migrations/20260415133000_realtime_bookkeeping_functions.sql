-- Realtime bookkeeping functions and anomaly visibility.

CREATE OR REPLACE FUNCTION public.reconcile_balance_by_wallet(
  p_wallet_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet text := lower(trim(p_wallet_address));
  v_ledger numeric := 0;
  v_current numeric := 0;
  v_diff numeric := 0;
BEGIN
  IF v_wallet IS NULL OR v_wallet = '' THEN
    RAISE EXCEPTION 'invalid wallet';
  END IF;

  v_ledger := public.get_ledger_balance_by_wallet(v_wallet, 'xBGL');

  SELECT COALESCE(xbgl_balance, 0)
  INTO v_current
  FROM public.user_balances
  WHERE lower(wallet_address) = v_wallet
  LIMIT 1;

  v_diff := v_ledger - COALESCE(v_current, 0);

  IF ABS(v_diff) > 0.01 THEN
    INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
    VALUES (v_wallet, v_ledger, 0, 0, 0, now())
    ON CONFLICT (wallet_address) DO UPDATE
      SET xbgl_balance = EXCLUDED.xbgl_balance,
          last_synced = now();
  END IF;

  RETURN jsonb_build_object(
    'wallet_address', v_wallet,
    'ledger_balance', v_ledger,
    'current_balance', COALESCE(v_current, 0),
    'difference', v_diff,
    'reconciled', ABS(v_diff) <= 0.01,
    'auto_corrected', ABS(v_diff) > 0.01
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_balance_by_wallet(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_balance_by_wallet(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_wallet_bookkeeping_snapshot(
  p_wallet_address text
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH w AS (
    SELECT lower(trim(p_wallet_address)) AS wallet
  ),
  bal AS (
    SELECT COALESCE(ub.xbgl_balance, 0) AS current_balance, ub.last_synced
    FROM public.user_balances ub, w
    WHERE lower(ub.wallet_address) = w.wallet
    LIMIT 1
  ),
  led AS (
    SELECT public.get_ledger_balance_by_wallet((SELECT wallet FROM w), 'xBGL') AS ledger_balance
  ),
  tx AS (
    SELECT t.tx_hash, t.created_at, t.amount, t.transaction_type, t.token_type
    FROM public.transactions t, w
    WHERE lower(t.from_address) = w.wallet OR lower(t.to_address) = w.wallet
    ORDER BY t.created_at DESC
    LIMIT 10
  ),
  failed AS (
    SELECT count(*)::int AS failed_conversions
    FROM public.deposit_conversion_failures d, w
    WHERE lower(coalesce(d.user_wallet, '')) = w.wallet
      AND d.resolved_at IS NULL
  )
  SELECT jsonb_build_object(
    'wallet_address', (SELECT wallet FROM w),
    'ledger_balance', (SELECT ledger_balance FROM led),
    'current_balance', COALESCE((SELECT current_balance FROM bal), 0),
    'difference', (SELECT ledger_balance FROM led) - COALESCE((SELECT current_balance FROM bal), 0),
    'last_synced', (SELECT last_synced FROM bal),
    'failed_conversion_count', (SELECT failed_conversions FROM failed),
    'recent_transactions', COALESCE((SELECT jsonb_agg(to_jsonb(tx)) FROM tx), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.list_bookkeeping_anomalies(
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  kind text,
  identifier text,
  detail jsonb,
  detected_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH failed_conversions AS (
    SELECT
      'conversion_failed'::text AS kind,
      coalesce(source_tx_hash, tx_hash) AS identifier,
      jsonb_build_object(
        'tx_hash', tx_hash,
        'source_tx_hash', source_tx_hash,
        'user_wallet', user_wallet,
        'network_id', network_id,
        'error_message', error_message
      ) AS detail,
      created_at AS detected_at
    FROM public.deposit_conversion_failures
    WHERE resolved_at IS NULL
    ORDER BY created_at DESC
    LIMIT p_limit
  ),
  drift AS (
    SELECT
      'balance_drift'::text AS kind,
      lower(ub.wallet_address) AS identifier,
      jsonb_build_object(
        'wallet_address', lower(ub.wallet_address),
        'ledger_balance', public.get_ledger_balance_by_wallet(lower(ub.wallet_address), 'xBGL'),
        'current_balance', COALESCE(ub.xbgl_balance, 0),
        'difference', public.get_ledger_balance_by_wallet(lower(ub.wallet_address), 'xBGL') - COALESCE(ub.xbgl_balance, 0)
      ) AS detail,
      now() AS detected_at
    FROM public.user_balances ub
    WHERE abs(public.get_ledger_balance_by_wallet(lower(ub.wallet_address), 'xBGL') - COALESCE(ub.xbgl_balance, 0)) > 0.01
    LIMIT p_limit
  )
  SELECT * FROM failed_conversions
  UNION ALL
  SELECT * FROM drift
  ORDER BY detected_at DESC
  LIMIT p_limit;
$$;
