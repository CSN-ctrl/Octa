-- ============================================
-- EXPERT APPLICATIONS SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- Expert Applications Table
CREATE TABLE IF NOT EXISTS expert_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  budget_range TEXT NOT NULL,
  investment_goals TEXT,
  preferred_contact TEXT DEFAULT 'email',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  assigned_consultant TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_expert_applications_email ON expert_applications(email);
CREATE INDEX IF NOT EXISTS idx_expert_applications_status ON expert_applications(status);
CREATE INDEX IF NOT EXISTS idx_expert_applications_created_at ON expert_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expert_applications_budget ON expert_applications(budget_range);

-- Enable Row Level Security (RLS)
ALTER TABLE expert_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow anyone to insert applications (public form submission)
CREATE POLICY "Anyone can submit an application"
  ON expert_applications FOR INSERT
  WITH CHECK (true);

-- Users can view their own applications by email
CREATE POLICY "Users can view their own applications"
  ON expert_applications FOR SELECT
  USING (auth.email() = email);

-- Admins can view all applications (using service role or specific admin check)
CREATE POLICY "Admins can view all applications"
  ON expert_applications FOR SELECT
  USING (
    auth.email() IN ('admin@test.com', 'admin@example.com')
    OR auth.email() LIKE '%admin%'
  );

-- Admins can update applications
CREATE POLICY "Admins can update applications"
  ON expert_applications FOR UPDATE
  USING (
    auth.email() IN ('admin@test.com', 'admin@example.com')
    OR auth.email() LIKE '%admin%'
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expert_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_expert_applications_updated_at ON expert_applications;
CREATE TRIGGER update_expert_applications_updated_at
  BEFORE UPDATE ON expert_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_expert_applications_updated_at();

-- Comments for documentation
COMMENT ON TABLE expert_applications IS 'Stores applications from users who want expert/managed investment services';
COMMENT ON COLUMN expert_applications.full_name IS 'Full name of the applicant';
COMMENT ON COLUMN expert_applications.email IS 'Email address for contact';
COMMENT ON COLUMN expert_applications.phone IS 'Phone number (optional)';
COMMENT ON COLUMN expert_applications.budget_range IS 'Investment budget range selected by applicant';
COMMENT ON COLUMN expert_applications.investment_goals IS 'Primary investment goals';
COMMENT ON COLUMN expert_applications.preferred_contact IS 'Preferred method of contact: email, phone, or both';
COMMENT ON COLUMN expert_applications.message IS 'Additional message or questions from applicant';
COMMENT ON COLUMN expert_applications.status IS 'Application status: pending, contacted, approved, rejected';
COMMENT ON COLUMN expert_applications.assigned_consultant IS 'Email or ID of assigned consultant';
COMMENT ON COLUMN expert_applications.notes IS 'Internal notes from consultants/admins';
COMMENT ON COLUMN expert_applications.contacted_at IS 'Timestamp when applicant was first contacted';

-- Sample query to view pending applications (for admin dashboard)
-- SELECT * FROM expert_applications WHERE status = 'pending' ORDER BY created_at DESC;

-- Sample query to get application statistics
-- SELECT 
--   status,
--   budget_range,
--   COUNT(*) as count
-- FROM expert_applications
-- GROUP BY status, budget_range
-- ORDER BY status, budget_range;
