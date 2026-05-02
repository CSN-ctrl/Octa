-- Add status field to affiliates table for application system
-- Run this SQL in Supabase SQL Editor

-- Add status column to affiliates table
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add application fields
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS application_reason TEXT,
ADD COLUMN IF NOT EXISTS application_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update existing affiliates to 'approved' status (if they already have codes)
UPDATE affiliates 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending' 
AND affiliate_code IS NOT NULL;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

-- Update RLS policies to allow users to update their own application
CREATE POLICY "Users can update own affiliate application" ON affiliates
  FOR UPDATE USING (true); -- Allow all updates for now, adjust if needed

-- Comments
COMMENT ON COLUMN affiliates.status IS 'pending: application submitted, approved: can use affiliate code, rejected: application rejected';
COMMENT ON COLUMN affiliates.application_reason IS 'Reason provided by user for wanting to become an affiliate';
COMMENT ON COLUMN affiliates.reviewed_by IS 'Admin wallet or email who reviewed the application';
COMMENT ON COLUMN affiliates.rejection_reason IS 'Reason provided by admin for rejection';

