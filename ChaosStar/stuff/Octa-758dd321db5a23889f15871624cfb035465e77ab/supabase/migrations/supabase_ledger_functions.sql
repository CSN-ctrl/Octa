-- ============================================
-- LEDGER AUTOMATION FUNCTIONS
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- Function to automatically create transaction when balance changes
CREATE OR REPLACE FUNCTION create_balance_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_transaction_type TEXT;
  v_from_address TEXT;
  v_to_address TEXT;
  v_amount NUMERIC;
  v_metadata JSONB;
  v_tx_hash TEXT;
BEGIN
  -- Determine transaction type based on balance change
  IF NEW.xbgl_balance > OLD.xbgl_balance THEN
    -- Balance increased - incoming transaction
    v_amount := NEW.xbgl_balance - OLD.xbgl_balance;
    v_from_address := '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33'; -- Treasury
    v_to_address := NEW.wallet_address;
    v_transaction_type := 'transfer';
    v_metadata := jsonb_build_object(
      'source', 'treasury',
      'auto_created', true,
      'direction', 'from_treasury'
    );
  ELSIF NEW.xbgl_balance < OLD.xbgl_balance THEN
    -- Balance decreased - outgoing transaction
    v_amount := OLD.xbgl_balance - NEW.xbgl_balance;
    v_from_address := NEW.wallet_address;
    v_to_address := '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33'; -- Treasury
    v_transaction_type := 'transfer';
    v_metadata := jsonb_build_object(
      'auto_created', true,
      'direction', 'to_treasury'
    );
  ELSE
    -- No balance change, skip
    RETURN NEW;
  END IF;

  -- Generate transaction hash
  v_tx_hash := 'ledger_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);

  -- Insert transaction (ignore if duplicate)
  INSERT INTO transactions (
    from_address,
    to_address,
    amount,
    token_type,
    transaction_type,
    type,
    tx_hash,
    status,
    metadata
  ) VALUES (
    v_from_address,
    v_to_address,
    v_amount,
    'xBGL',
    v_transaction_type,
    v_transaction_type,
    v_tx_hash,
    'completed',
    v_metadata
  ) ON CONFLICT (tx_hash) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for balance changes
DROP TRIGGER IF EXISTS balance_change_transaction ON user_balances;
CREATE TRIGGER balance_change_transaction
  AFTER UPDATE OF xbgl_balance ON user_balances
  FOR EACH ROW
  WHEN (OLD.xbgl_balance IS DISTINCT FROM NEW.xbgl_balance)
  EXECUTE FUNCTION create_balance_transaction();

-- Function to create plot purchase transaction
CREATE OR REPLACE FUNCTION create_plot_purchase_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_old_owner TEXT;
  v_new_owner TEXT;
  v_plot_price NUMERIC := 100; -- Standard plot price
  v_tx_hash TEXT;
  v_metadata JSONB;
BEGIN
  v_old_owner := COALESCE(OLD.owner_wallet, '');
  v_new_owner := COALESCE(NEW.owner_wallet, '');

  -- Only create transaction if ownership changed from null/empty to a wallet
  IF (v_old_owner IS NULL OR v_old_owner = '') AND v_new_owner != '' THEN
    v_tx_hash := 'plot_' || NEW.id::text || '_' || extract(epoch from now())::text;
    
    v_metadata := jsonb_build_object(
      'plot_id', NEW.id,
      'purchase_type', 'land',
      'auto_created', true,
      'coord_x', NEW.coord_x,
      'coord_y', NEW.coord_y,
      'zone_type', NEW.zone_type
    );

    -- Create transaction
    INSERT INTO transactions (
      from_address,
      to_address,
      amount,
      token_type,
      transaction_type,
      type,
      tx_hash,
      status,
      plot_id,
      metadata
    ) VALUES (
      v_new_owner,
      '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33', -- Treasury
      v_plot_price,
      'xBGL',
      'plot_purchase',
      'plot_purchase',
      v_tx_hash,
      'completed',
      NEW.id,
      v_metadata
    ) ON CONFLICT (tx_hash) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for plot ownership changes
DROP TRIGGER IF EXISTS plot_ownership_transaction ON plots;
CREATE TRIGGER plot_ownership_transaction
  AFTER UPDATE OF owner_wallet ON plots
  FOR EACH ROW
  WHEN (OLD.owner_wallet IS DISTINCT FROM NEW.owner_wallet)
  EXECUTE FUNCTION create_plot_purchase_transaction();

-- Function to create marketplace purchase transaction
CREATE OR REPLACE FUNCTION create_marketplace_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_hash TEXT;
  v_metadata JSONB;
BEGIN
  -- Only create transaction when listing is marked as sold
  IF NEW.status = 'sold' AND OLD.status != 'sold' AND NEW.buyer_wallet IS NOT NULL THEN
    v_tx_hash := 'marketplace_' || NEW.id::text || '_' || extract(epoch from now())::text;
    
    v_metadata := jsonb_build_object(
      'listing_id', NEW.id,
      'asset_type', NEW.asset_type,
      'asset_id', NEW.asset_id,
      'auto_created', true
    );

    -- Create transaction
    INSERT INTO transactions (
      from_address,
      to_address,
      amount,
      token_type,
      transaction_type,
      type,
      tx_hash,
      status,
      metadata
    ) VALUES (
      NEW.buyer_wallet,
      NEW.seller_wallet,
      NEW.price,
      COALESCE(NEW.token_type, 'xBGL'),
      'marketplace_purchase',
      'marketplace_purchase',
      v_tx_hash,
      'completed',
      v_metadata
    ) ON CONFLICT (tx_hash) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for marketplace sales
DROP TRIGGER IF EXISTS marketplace_sale_transaction ON marketplace_listings;
CREATE TRIGGER marketplace_sale_transaction
  AFTER UPDATE OF status, buyer_wallet ON marketplace_listings
  FOR EACH ROW
  WHEN (NEW.status = 'sold' AND OLD.status != 'sold')
  EXECUTE FUNCTION create_marketplace_transaction();

-- Function to create affiliate commission transaction
CREATE OR REPLACE FUNCTION create_affiliate_commission_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_tx_hash TEXT;
  v_metadata JSONB;
  v_affiliate_wallet TEXT;
BEGIN
  -- Only create transaction when commission is paid
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.commission_amount > 0 THEN
    -- Get affiliate wallet from affiliate code
    SELECT wallet_address INTO v_affiliate_wallet
    FROM affiliates
    WHERE affiliate_code = NEW.affiliate_code
    LIMIT 1;

    IF v_affiliate_wallet IS NOT NULL THEN
      v_tx_hash := 'affiliate_' || NEW.id::text || '_' || extract(epoch from now())::text;
      
      v_metadata := jsonb_build_object(
        'affiliate_code', NEW.affiliate_code,
        'referral_id', NEW.id,
        'purchase_amount', NEW.purchase_amount,
        'commission_rate', NEW.commission_rate,
        'auto_created', true
      );

      -- Create transaction
      INSERT INTO transactions (
        from_address,
        to_address,
        amount,
        token_type,
        transaction_type,
        type,
        tx_hash,
        status,
        metadata
      ) VALUES (
        '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33', -- Treasury
        v_affiliate_wallet,
        NEW.commission_amount,
        'xBGL',
        'affiliate_commission',
        'affiliate_commission',
        v_tx_hash,
        'completed',
        v_metadata
      ) ON CONFLICT (tx_hash) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for affiliate commission payments
DROP TRIGGER IF EXISTS affiliate_commission_transaction ON affiliate_referrals;
CREATE TRIGGER affiliate_commission_transaction
  AFTER UPDATE OF status ON affiliate_referrals
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
  EXECUTE FUNCTION create_affiliate_commission_transaction();

-- Function to get ledger balance (sum of all transactions) using auth user email
CREATE OR REPLACE FUNCTION get_ledger_balance(
  p_user_email TEXT,
  p_token_type TEXT DEFAULT 'xBGL'
)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC := 0;
  v_user_email TEXT := LOWER(p_user_email);
BEGIN
  -- Get balance from transactions where user email is in from_address or to_address
  -- user_balances uses email as wallet_address for users without wallets
  SELECT COALESCE(SUM(
    CASE 
      WHEN to_address = v_user_email THEN amount
      WHEN from_address = v_user_email THEN -amount
      ELSE 0
    END
  ), 0) INTO v_balance
  FROM transactions
  WHERE (
    from_address = v_user_email OR 
    to_address = v_user_email
  )
  AND token_type = p_token_type
  AND status = 'completed';

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to reconcile balance with ledger using auth user email
CREATE OR REPLACE FUNCTION reconcile_balance(
  p_user_email TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_ledger_balance NUMERIC;
  v_current_balance NUMERIC;
  v_difference NUMERIC;
  v_result JSONB;
  v_user_email TEXT := LOWER(p_user_email);
BEGIN
  -- Get ledger balance
  v_ledger_balance := get_ledger_balance(v_user_email, 'xBGL');
  
  -- Get current balance (email is stored as wallet_address for users without wallets)
  SELECT COALESCE(xbgl_balance, 0) INTO v_current_balance
  FROM user_balances
  WHERE wallet_address = v_user_email;

  v_difference := v_ledger_balance - v_current_balance;

  v_result := jsonb_build_object(
    'user_email', v_user_email,
    'ledger_balance', v_ledger_balance,
    'current_balance', v_current_balance,
    'difference', v_difference,
    'reconciled', (v_difference = 0)
  );

  -- Auto-correct if difference is significant
  IF ABS(v_difference) > 0.01 THEN
    UPDATE user_balances
    SET xbgl_balance = v_ledger_balance
    WHERE wallet_address = v_user_email;
    
    v_result := v_result || jsonb_build_object('auto_corrected', true);
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

