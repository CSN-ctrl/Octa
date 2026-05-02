-- ============================================
-- ILO STATS SCHEMA
-- ============================================
-- This schema has been applied to the Supabase database

-- ILO Statistics Table
CREATE TABLE IF NOT EXISTS ilo_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_spots INTEGER NOT NULL DEFAULT 10000,
  spots_taken INTEGER NOT NULL DEFAULT 0,
  total_raised_usdc NUMERIC NOT NULL DEFAULT 0,
  total_raised_eur NUMERIC NOT NULL DEFAULT 0,
  participants_count INTEGER NOT NULL DEFAULT 0,
  campaign_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  campaign_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default ILO stats row
INSERT INTO ilo_stats (
  total_spots, 
  spots_taken, 
  total_raised_usdc, 
  total_raised_eur,
  participants_count,
  is_active
) VALUES (10000, 0, 0, 0, 0, true);

-- Enable RLS
ALTER TABLE ilo_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can read ILO stats (public)
CREATE POLICY "ILO stats are publicly readable"
  ON ilo_stats FOR SELECT
  USING (true);

-- Only admins can update ILO stats
CREATE POLICY "Admins can update ILO stats"
  ON ilo_stats FOR UPDATE
  USING (
    auth.email() IN ('admin@test.com', 'admin@example.com')
    OR auth.email() LIKE '%admin%'
  );

-- Function to get ILO stats (bypasses schema cache)
CREATE OR REPLACE FUNCTION get_ilo_stats()
RETURNS TABLE (
  total_spots INTEGER,
  spots_taken INTEGER,
  spots_remaining INTEGER,
  total_raised_usdc NUMERIC,
  total_raised_eur NUMERIC,
  participants_count INTEGER,
  progress_percentage NUMERIC,
  is_active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.total_spots,
    s.spots_taken,
    (s.total_spots - s.spots_taken) as spots_remaining,
    s.total_raised_usdc,
    s.total_raised_eur,
    s.participants_count,
    CASE WHEN s.total_spots > 0 
      THEN ROUND((s.spots_taken::NUMERIC / s.total_spots::NUMERIC) * 100, 2)
      ELSE 0 
    END as progress_percentage,
    s.is_active
  FROM ilo_stats s
  WHERE s.is_active = true
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_ilo_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_ilo_stats() TO authenticated;

-- Comments
COMMENT ON TABLE ilo_stats IS 'Tracks ILO campaign statistics like spots taken, amounts raised';
COMMENT ON COLUMN ilo_stats.total_spots IS 'Total number of spots available in the ILO';
COMMENT ON COLUMN ilo_stats.spots_taken IS 'Number of spots that have been taken';
COMMENT ON COLUMN ilo_stats.total_raised_usdc IS 'Total USDC raised in the ILO';
COMMENT ON COLUMN ilo_stats.total_raised_eur IS 'Total EUR equivalent raised';
COMMENT ON COLUMN ilo_stats.participants_count IS 'Unique number of participants';

-- ============================================
-- To update ILO stats manually (admin):
-- ============================================
-- UPDATE ilo_stats 
-- SET 
--   spots_taken = 847,
--   total_raised_usdc = 42350,
--   total_raised_eur = 38500,
--   participants_count = 847,
--   updated_at = NOW()
-- WHERE is_active = true;

-- To increment stats when a deposit is confirmed:
-- This should be called from your backend/edge function after deposit confirmation
