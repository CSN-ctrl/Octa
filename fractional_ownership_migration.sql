-- Migration: Create fractional ownership tables and functions
-- This enables fractional ownership of plots with percentage-based shares

-- Create plot_fractional_shares table
CREATE TABLE IF NOT EXISTS plot_fractional_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id INTEGER NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  owner_wallet TEXT,
  share_percentage DECIMAL(5,2) NOT NULL CHECK (share_percentage > 0 AND share_percentage <= 100),
  shares INTEGER NOT NULL CHECK (shares > 0),
  total_shares INTEGER NOT NULL DEFAULT 10000 CHECK (total_shares > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plot_id, owner_email)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_plot_fractional_shares_plot_id ON plot_fractional_shares(plot_id);
CREATE INDEX IF NOT EXISTS idx_plot_fractional_shares_owner_email ON plot_fractional_shares(owner_email);

-- Function to validate total ownership doesn't exceed 100%
CREATE OR REPLACE FUNCTION validate_fractional_ownership()
RETURNS TRIGGER AS $$
DECLARE
  total_percentage DECIMAL(5,2);
BEGIN
  SELECT COALESCE(SUM(share_percentage), 0) INTO total_percentage
  FROM plot_fractional_shares
  WHERE plot_id = NEW.plot_id;
  
  IF total_percentage > 100 THEN
    RAISE EXCEPTION 'Total ownership percentage cannot exceed 100%%. Current total: %%%', total_percentage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate ownership percentage
CREATE TRIGGER check_fractional_ownership_percentage
  BEFORE INSERT OR UPDATE ON plot_fractional_shares
  FOR EACH ROW
  EXECUTE FUNCTION validate_fractional_ownership();

-- Function to get total ownership percentage for a plot
CREATE OR REPLACE FUNCTION get_plot_total_ownership(p_plot_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total DECIMAL(5,2);
BEGIN
  SELECT COALESCE(SUM(share_percentage), 0) INTO total
  FROM plot_fractional_shares
  WHERE plot_id = p_plot_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to get fractional shares for a user
CREATE OR REPLACE FUNCTION get_user_fractional_shares(p_user_email TEXT)
RETURNS TABLE (
  plot_id INTEGER,
  share_percentage DECIMAL(5,2),
  shares INTEGER,
  total_shares INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pfs.plot_id,
    pfs.share_percentage,
    pfs.shares,
    pfs.total_shares
  FROM plot_fractional_shares pfs
  WHERE pfs.owner_email = LOWER(p_user_email);
END;
$$ LANGUAGE plpgsql;

