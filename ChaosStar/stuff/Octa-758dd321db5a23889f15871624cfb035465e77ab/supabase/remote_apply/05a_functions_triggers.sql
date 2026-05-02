CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_expert_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hot_wallets_updated_at ON hot_wallets;
CREATE TRIGGER update_hot_wallets_updated_at
  BEFORE UPDATE ON hot_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expert_applications_updated_at ON expert_applications;
CREATE TRIGGER update_expert_applications_updated_at
  BEFORE UPDATE ON expert_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_applications_updated_at();

-- -----------------------------------------------------------------------------
-- Fractional validation (includes NEW row share in total)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_fractional_ownership()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage NUMERIC(5,2);
BEGIN
  SELECT COALESCE(SUM(share_percentage), 0) INTO total_percentage
  FROM plot_fractional_shares
  WHERE plot_id = NEW.plot_id
    AND id IS DISTINCT FROM NEW.id;

  IF total_percentage + NEW.share_percentage > 100 THEN
    RAISE EXCEPTION 'Total ownership percentage cannot exceed 100%%. Would be: %', total_percentage + NEW.share_percentage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_fractional_ownership_percentage ON plot_fractional_shares;
CREATE TRIGGER check_fractional_ownership_percentage
  BEFORE INSERT OR UPDATE ON plot_fractional_shares
  FOR EACH ROW
  EXECUTE FUNCTION validate_fractional_ownership();

CREATE OR REPLACE FUNCTION get_plot_total_ownership(p_plot_id INTEGER)
RETURNS NUMERIC(5,2) AS $$
DECLARE
  total NUMERIC(5,2);
BEGIN
  SELECT COALESCE(SUM(share_percentage), 0) INTO total
  FROM plot_fractional_shares
  WHERE plot_id = p_plot_id;
  RETURN total;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_fractional_shares(p_user_email TEXT)
RETURNS TABLE (
  plot_id INTEGER,
  share_percentage NUMERIC(5,2),
  shares INTEGER,
  total_shares INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT pfs.plot_id, pfs.share_percentage, pfs.shares, pfs.total_shares
  FROM plot_fractional_shares pfs
  WHERE lower(pfs.owner_email) = lower(p_user_email);
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- ILO: keep plot_purchased in sync when plot_id is set
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_ilo_participant_plot_purchased()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plot_id IS NOT NULL THEN
    NEW.plot_purchased := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ilo_plot_purchased ON ilo_participants;
CREATE TRIGGER trg_sync_ilo_plot_purchased
  BEFORE INSERT OR UPDATE OF plot_id ON ilo_participants
  FOR EACH ROW
  EXECUTE FUNCTION sync_ilo_participant_plot_purchased();

-- -----------------------------------------------------------------------------
-- Ledger automation (from supabase_ledger_functions.sql)
-- -----------------------------------------------------------------------------
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
  IF NEW.xbgl_balance > OLD.xbgl_balance THEN
    v_amount := NEW.xbgl_balance - OLD.xbgl_balance;
    v_from_address := '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33';
    v_to_address := NEW.wallet_address;
    v_transaction_type := 'transfer';
    v_metadata := jsonb_build_object('source', 'treasury', 'auto_created', true, 'direction', 'from_treasury');
  ELSIF NEW.xbgl_balance < OLD.xbgl_balance THEN
    v_amount := OLD.xbgl_balance - NEW.xbgl_balance;
    v_from_address := NEW.wallet_address;
    v_to_address := '0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33';
    v_transaction_type := 'transfer';
    v_metadata := jsonb_build_object('auto_created', true, 'direction', 'to_treasury');
  ELSE
    RETURN NEW;
  END IF;

  v_tx_hash := 'ledger_' || extract(epoch FROM NOW())::text || '_' || substr(md5(random()::text), 1, 8);

  INSERT INTO transactions (
    from_address, to_address, amount, token_type, transaction_type, type, tx_hash, status, metadata
  ) VALUES (
    v_from_address, v_to_address, v_amount, 'xBGL', v_transaction_type, v_transaction_type,
    v_tx_hash, 'completed', v_metadata
  ) ON CONFLICT (tx_hash) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS balance_change_transaction ON user_balances;
CREATE TRIGGER balance_change_transaction
  AFTER UPDATE OF xbgl_balance ON user_balances
  FOR EACH ROW
  WHEN (OLD.xbgl_balance IS DISTINCT FROM NEW.xbgl_balance)
  EXECUTE FUNCTION create_balance_transaction();

