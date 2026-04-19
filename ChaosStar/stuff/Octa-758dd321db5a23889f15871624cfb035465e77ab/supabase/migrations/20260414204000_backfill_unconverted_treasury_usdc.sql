-- Backfill conversion for already-ingested, unconverted USDC treasury deposits.

DO $$
DECLARE
  v_treasury text := lower('0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33');
  v_rate numeric := 1;
  rec record;
  v_user_email text;
  v_xbgl numeric;
  v_deposit_id uuid;
BEGIN
  SELECT COALESCE(rate, 1)
  INTO v_rate
  FROM public.exchange_rates
  WHERE upper(from_token) = 'USDC'
    AND upper(to_token) = 'XBGL'
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  FOR rec IN
    SELECT t.*
    FROM public.transactions t
    WHERE lower(coalesce(t.to_address, '')) = v_treasury
      AND upper(coalesce(t.token_type, '')) = 'USDC'
      AND coalesce(t.amount, 0) > 0
      AND t.tx_hash IS NOT NULL
      AND t.transaction_type NOT IN ('deposit_converted', 'treasury_transfer')
      AND NOT EXISTS (
        SELECT 1
        FROM public.transactions c
        WHERE c.tx_hash = lower(t.tx_hash) || '_converted'
      )
    ORDER BY t.created_at ASC
  LOOP
    SELECT lower(o.email) INTO v_user_email
    FROM public.ownership_registry o
    WHERE lower(o.wallet_address) = lower(coalesce(rec.from_address, ''))
    ORDER BY o.updated_at DESC NULLS LAST
    LIMIT 1;

    IF v_user_email IS NULL OR v_user_email = '' THEN
      v_user_email := lower(coalesce(rec.from_address, ''));
    END IF;

    v_xbgl := rec.amount * COALESCE(v_rate, 1);

    INSERT INTO public.usdc_deposits (
      user_email,
      user_wallet,
      network_id,
      usdc_amount,
      xbgl_amount,
      tx_hash,
      hot_wallet_address,
      status,
      confirmed_at,
      metadata
    ) VALUES (
      v_user_email,
      lower(coalesce(rec.from_address, '')),
      COALESCE(rec.metadata->>'chain', 'unknown'),
      rec.amount,
      v_xbgl,
      lower(rec.tx_hash),
      v_treasury,
      'confirmed',
      now(),
      jsonb_build_object(
        'source', 'backfill_migration',
        'source_transaction_id', rec.id,
        'exchange_rate', COALESCE(v_rate, 1)
      )
    )
    RETURNING id INTO v_deposit_id;

    PERFORM public.internal_treasury_transfer_for_deposit(
      lower(coalesce(rec.from_address, '')),
      v_xbgl,
      rec.tx_hash,
      jsonb_build_object(
        'deposit_id', v_deposit_id,
        'network_id', COALESCE(rec.metadata->>'chain', 'unknown'),
        'usdc_amount', rec.amount,
        'backfill', true
      )
    );
  END LOOP;
END $$;
