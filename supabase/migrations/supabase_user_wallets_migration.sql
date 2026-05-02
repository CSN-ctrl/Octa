-- User Wallets: store connected wallet addresses per user (linked to auth.users)
-- Run this SQL in Supabase SQL Editor to create the table and RLS

CREATE TABLE IF NOT EXISTS public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_label TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, wallet_address)
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_wallet_address ON public.user_wallets(wallet_address);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own wallet rows
CREATE POLICY "Users can view own wallets"
  ON public.user_wallets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own wallet
CREATE POLICY "Users can insert own wallet"
  ON public.user_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallet (e.g. label, last_used_at)
CREATE POLICY "Users can update own wallet"
  ON public.user_wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wallet
CREATE POLICY "Users can delete own wallet"
  ON public.user_wallets FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_wallets IS 'Stores connected wallet addresses per user for persistence and quick reconnect';
