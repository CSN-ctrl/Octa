-- Affiliate Program Database Schema
-- Run this SQL in Supabase SQL Editor to create the affiliate tables

-- Affiliates table - stores affiliate codes and stats
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  affiliate_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,4) DEFAULT 0.15,
  total_referrals INTEGER DEFAULT 0,
  total_commission DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User affiliate codes - stores which affiliate codes users have used
CREATE TABLE IF NOT EXISTS user_affiliate_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  affiliate_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, affiliate_code)
);

-- Affiliate referrals table - stores each referral and commission
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code TEXT NOT NULL,
  referrer_wallet TEXT NOT NULL,
  referred_wallet TEXT NOT NULL,
  referred_email TEXT,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(20,8) NOT NULL,
  purchase_amount DECIMAL(20,8) NOT NULL,
  plot_ids INTEGER[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  FOREIGN KEY (referrer_wallet) REFERENCES affiliates(wallet_address) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_wallet ON affiliates(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_affiliate_codes_wallet ON user_affiliate_codes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_affiliate_codes_code ON user_affiliate_codes(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON affiliate_referrals(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON affiliate_referrals(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON affiliate_referrals(referred_wallet);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON affiliate_referrals(status);

-- RLS Policies (adjust based on your security needs)
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affiliate_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own affiliate data
CREATE POLICY "Users can view own affiliate data" ON affiliates
  FOR SELECT USING (true); -- Allow all reads for now, adjust if needed

-- Policy: Users can insert their own affiliate record
CREATE POLICY "Users can create own affiliate" ON affiliates
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now, adjust if needed

-- Policy: Users can view their own affiliate code references
CREATE POLICY "Users can view own affiliate code references" ON user_affiliate_codes
  FOR SELECT USING (true); -- Allow all reads for now

-- Policy: Users can insert their own affiliate code references
CREATE POLICY "Users can create own affiliate code reference" ON user_affiliate_codes
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now

-- Policy: Users can view referrals (both as referrer and referred)
CREATE POLICY "Users can view referrals" ON affiliate_referrals
  FOR SELECT USING (true); -- Allow all reads for now

-- Policy: System can insert referrals (this will be done via service role or RPC)
CREATE POLICY "System can create referrals" ON affiliate_referrals
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now

-- Function to update affiliate stats (optional helper)
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE affiliates
  SET 
    total_referrals = (
      SELECT COUNT(*) 
      FROM affiliate_referrals 
      WHERE referrer_wallet = NEW.referrer_wallet
    ),
    total_commission = (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM affiliate_referrals 
      WHERE referrer_wallet = NEW.referrer_wallet
    ),
    updated_at = NOW()
  WHERE wallet_address = NEW.referrer_wallet;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update affiliate stats when referral is created
CREATE TRIGGER trigger_update_affiliate_stats
AFTER INSERT ON affiliate_referrals
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_stats();

-- Comments for documentation
COMMENT ON TABLE affiliates IS 'Stores affiliate codes and statistics for each wallet';
COMMENT ON TABLE user_affiliate_codes IS 'Tracks which affiliate codes users have used';
COMMENT ON TABLE affiliate_referrals IS 'Records each referral and calculated commission';
COMMENT ON COLUMN affiliates.commission_rate IS 'Commission rate as decimal (0.15 = 15%)';
COMMENT ON COLUMN affiliate_referrals.status IS 'pending: commission not paid, paid: commission paid, cancelled: referral cancelled';

