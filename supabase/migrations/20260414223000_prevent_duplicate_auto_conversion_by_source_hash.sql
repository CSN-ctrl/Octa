-- Prevent duplicate auto-transfer when a source transaction was already converted.
-- Guard by BOTH derived conversion tx hash and metadata.source_tx_hash.

CREATE OR REPLACE FUNCTION public.internal_treasury_transfer_for_deposit(
  p_recipient text,
  p_amount numeric,
  p_source_tx_hash text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient text := lower(trim(p_recipient));
  v_treasury text := lower('0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33');
  v_conversion_tx_hash text := lower(trim(p_source_tx_hash)) || '_converted';
  v_source_hash text := lower(coalesce(nullif(trim(p_metadata->>'source_tx_hash'), ''), trim(p_source_tx_hash)));
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  IF v_recipient IS NULL OR v_recipient = '' THEN
    RAISE EXCEPTION 'invalid recipient';
  END IF;

  IF p_source_tx_hash IS NULL OR btrim(p_source_tx_hash) = '' THEN
    RAISE EXCEPTION 'missing source tx hash';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(v_conversion_tx_hash), 913003);

  IF EXISTS (
    SELECT 1
    FROM public.transactions t
    WHERE t.tx_hash = v_conversion_tx_hash
       OR lower(coalesce(t.metadata->>'source_tx_hash', '')) = v_source_hash
  ) THEN
    RETURN jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'tx_hash', v_conversion_tx_hash,
      'source_tx_hash', v_source_hash
    );
  END IF;

  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_treasury, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  INSERT INTO public.user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance, last_synced)
  VALUES (v_recipient, 0, 0, 0, 0, now())
  ON CONFLICT (wallet_address) DO NOTHING;

  UPDATE public.user_balances
  SET xbgl_balance = COALESCE(xbgl_balance, 0) - p_amount,
      last_synced = now()
  WHERE wallet_address = v_treasury
    AND COALESCE(xbgl_balance, 0) >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient treasury balance';
  END IF;

  UPDATE public.user_balances
  SET xbgl_balance = COALESCE(xbgl_balance, 0) + p_amount,
      last_synced = now()
  WHERE wallet_address = v_recipient;

  INSERT INTO public.transactions (
    from_address, to_address, amount, token_type, transaction_type, type, status, tx_hash, metadata
  ) VALUES (
    v_treasury,
    v_recipient,
    p_amount,
    'xBGL',
    'treasury_transfer',
    'deposit_conversion',
    'completed',
    v_conversion_tx_hash,
    COALESCE(p_metadata, '{}'::jsonb) || jsonb_build_object(
      'deposit_auto_conversion', true,
      'source_tx_hash', v_source_hash
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'duplicate', false,
    'tx_hash', v_conversion_tx_hash,
    'source_tx_hash', v_source_hash
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_convert_treasury_usdc_deposit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_treasury text := lower('0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33');
  v_from text := lower(coalesce(NEW.from_address, ''));
  v_to text := lower(coalesce(NEW.to_address, ''));
  v_token text := upper(coalesce(NEW.token_type, ''));
  v_existing_id uuid;
  v_user_email text;
  v_xbgl numeric;
  v_deposit_id uuid;
  v_chain text;
  v_source_hash text := lower(coalesce(nullif(trim(NEW.metadata->>'source_tx_hash'), ''), trim(NEW.tx_hash)));
BEGIN
  IF v_to <> v_treasury THEN
    RETURN NEW;
  END IF;

  IF NEW.tx_hash IS NULL OR btrim(NEW.tx_hash) = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.transaction_type IN ('deposit_converted', 'treasury_transfer') THEN
    RETURN NEW;
  END IF;

  IF v_token <> 'USDC' THEN
    RETURN NEW;
  END IF;

  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_existing_id
  FROM public.transactions
  WHERE tx_hash = lower(NEW.tx_hash) || '_converted'
     OR lower(coalesce(metadata->>'source_tx_hash', '')) = v_source_hash
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT lower(o.email) INTO v_user_email
  FROM public.ownership_registry o
  WHERE lower(o.wallet_address) = v_from
  ORDER BY o.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_user_email IS NULL OR v_user_email = '' THEN
    v_user_email := v_from;
  END IF;

  v_xbgl := public.convert_usdc_to_xbgl(NEW.amount);
  v_chain := COALESCE(NEW.metadata->>'chain', 'unknown');

  INSERT INTO public.usdc_deposits (
    user_email, user_wallet, network_id, usdc_amount, xbgl_amount, tx_hash, hot_wallet_address, status, confirmed_at, metadata
  ) VALUES (
    v_user_email,
    v_from,
    v_chain,
    NEW.amount,
    v_xbgl,
    lower(NEW.tx_hash),
    v_treasury,
    'confirmed',
    now(),
    jsonb_build_object(
      'source', 'transactions_trigger',
      'source_transaction_id', NEW.id,
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  )
  RETURNING id INTO v_deposit_id;

  PERFORM public.internal_treasury_transfer_for_deposit(
    v_from,
    v_xbgl,
    NEW.tx_hash,
    jsonb_build_object(
      'deposit_id', v_deposit_id,
      'network_id', v_chain,
      'usdc_amount', NEW.amount,
      'source_tx_hash', v_source_hash,
      'eur_to_xbgl_rate', public.get_eur_to_xbgl_rate(),
      'eur_to_usdc_rate', public.get_eur_to_usdc_rate(),
      'usdc_to_xbgl_rate', public.get_usdc_to_xbgl_rate()
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;
