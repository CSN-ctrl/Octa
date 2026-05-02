-- Enforce "first tag sticks" at database level
-- This ensures each user can only have ONE affiliate code, and it can't be changed

-- Drop existing unique constraint if it exists (on wallet_address + affiliate_code)
-- We want one row per user, not one row per user+code combination
ALTER TABLE user_affiliate_codes 
DROP CONSTRAINT IF EXISTS user_affiliate_codes_wallet_address_affiliate_code_key;

-- Add constraint: one affiliate code per user (wallet_address or email)
-- This prevents overwriting the first tag
ALTER TABLE user_affiliate_codes
ADD CONSTRAINT user_affiliate_codes_one_per_user UNIQUE (wallet_address);

-- Also enforce one referral per user (prevents duplicate commissions)
ALTER TABLE affiliate_referrals
ADD CONSTRAINT affiliate_referrals_one_per_referred UNIQUE (referred_wallet);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_affiliate_codes_wallet_unique ON user_affiliate_codes(wallet_address);

-- Comments
COMMENT ON CONSTRAINT user_affiliate_codes_one_per_user ON user_affiliate_codes IS 
'Ensures first affiliate tag sticks - each user can only have one affiliate code, set on first click';

COMMENT ON CONSTRAINT affiliate_referrals_one_per_referred ON affiliate_referrals IS 
'Ensures each user can only be referred once - prevents duplicate commissions';
