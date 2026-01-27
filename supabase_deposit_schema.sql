-- ============================================
-- USDC DEPOSIT SYSTEM SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- Exchange Rates Table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_token TEXT NOT NULL,
  to_token TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_token, to_token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_tokens ON exchange_rates(from_token, to_token);

-- Insert default exchange rates
-- EUR to xBGL: 1 EUR = 1.955833 xBGL (fixed rate, stored for reference)
INSERT INTO exchange_rates (from_token, to_token, rate)
VALUES ('EUR', 'xBGL', 1.955833)
ON CONFLICT (from_token, to_token) DO NOTHING;

-- EUR to USDC: 1 EUR = 1.1 USDC (default, can be updated by admin)
INSERT INTO exchange_rates (from_token, to_token, rate)
VALUES ('EUR', 'USDC', 1.1)
ON CONFLICT (from_token, to_token) DO NOTHING;

-- Hot Wallets Table
CREATE TABLE IF NOT EXISTS hot_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for network lookups
CREATE INDEX IF NOT EXISTS idx_hot_wallets_network ON hot_wallets(network_id);
CREATE INDEX IF NOT EXISTS idx_hot_wallets_active ON hot_wallets(is_active);

-- USDC Deposits Table
CREATE TABLE IF NOT EXISTS usdc_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_wallet TEXT,
  network_id TEXT NOT NULL,
  usdc_amount NUMERIC NOT NULL,
  xbgl_amount NUMERIC NOT NULL,
  tx_hash TEXT,
  hot_wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Create indexes for deposits
CREATE INDEX IF NOT EXISTS idx_usdc_deposits_user_email ON usdc_deposits(user_email);
CREATE INDEX IF NOT EXISTS idx_usdc_deposits_tx_hash ON usdc_deposits(tx_hash);
CREATE INDEX IF NOT EXISTS idx_usdc_deposits_status ON usdc_deposits(status);
CREATE INDEX IF NOT EXISTS idx_usdc_deposits_created_at ON usdc_deposits(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE usdc_deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exchange_rates (public read, admin write)
CREATE POLICY "Exchange rates are viewable by everyone"
  ON exchange_rates FOR SELECT
  USING (true);

CREATE POLICY "Exchange rates can be updated by authenticated admins"
  ON exchange_rates FOR UPDATE
  USING (auth.role() = 'authenticated');

-- RLS Policies for hot_wallets (public read, admin write)
CREATE POLICY "Hot wallets are viewable by everyone"
  ON hot_wallets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Hot wallets can be updated by authenticated admins"
  ON hot_wallets FOR ALL
  USING (auth.role() = 'authenticated');

-- RLS Policies for usdc_deposits (users can only see their own)
CREATE POLICY "Users can view their own deposits"
  ON usdc_deposits FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can create their own deposits"
  ON usdc_deposits FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update their own pending deposits"
  ON usdc_deposits FOR UPDATE
  USING (auth.email() = user_email AND status = 'pending');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for hot_wallets updated_at
CREATE TRIGGER update_hot_wallets_updated_at
  BEFORE UPDATE ON hot_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to credit xBGL when deposit is confirmed
CREATE OR REPLACE FUNCTION credit_xbgl_on_deposit_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Update user balance
    INSERT INTO user_balances (
      wallet_address,
      xbgl_balance,
      avax_balance,
      chaos_balance,
      sc_balance
    )
    VALUES (
      NEW.user_email,
      NEW.xbgl_amount,
      0,
      0,
      0
    )
    ON CONFLICT (wallet_address) 
    DO UPDATE SET 
      xbgl_balance = user_balances.xbgl_balance + NEW.xbgl_amount,
      last_synced = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-credit xBGL on deposit confirmation
CREATE TRIGGER auto_credit_xbgl_on_deposit
  AFTER UPDATE OF status ON usdc_deposits
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
  EXECUTE FUNCTION credit_xbgl_on_deposit_confirmation();

-- Comments for documentation
COMMENT ON TABLE exchange_rates IS 'Stores exchange rates between tokens (e.g., USDC to xBGL)';
COMMENT ON TABLE hot_wallets IS 'Stores hot wallet addresses for receiving USDC payments on different networks';
COMMENT ON TABLE usdc_deposits IS 'Tracks USDC deposits and their conversion to xBGL';

COMMENT ON COLUMN exchange_rates.from_token IS 'Source token symbol (e.g., USDC)';
COMMENT ON COLUMN exchange_rates.to_token IS 'Destination token symbol (e.g., xBGL)';
COMMENT ON COLUMN exchange_rates.rate IS 'Exchange rate (e.g., 1.0 means 1 USDC = 1 xBGL)';

COMMENT ON COLUMN hot_wallets.network_id IS 'Network identifier (e.g., ethereum, avalanche, polygon)';
COMMENT ON COLUMN hot_wallets.address IS 'Hot wallet address for receiving USDC';

COMMENT ON COLUMN usdc_deposits.user_email IS 'User email address (primary identifier)';
COMMENT ON COLUMN usdc_deposits.network_id IS 'Network where USDC was sent';
COMMENT ON COLUMN usdc_deposits.usdc_amount IS 'Amount of USDC deposited';
COMMENT ON COLUMN usdc_deposits.xbgl_amount IS 'Equivalent xBGL amount credited';
COMMENT ON COLUMN usdc_deposits.tx_hash IS 'Blockchain transaction hash';
COMMENT ON COLUMN usdc_deposits.status IS 'Deposit status: pending, confirmed, or failed';
