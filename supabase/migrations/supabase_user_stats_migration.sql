-- Create user stats table to track total registered users
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial row (using a fixed UUID for the singleton row)
INSERT INTO user_stats (id, total_users) 
VALUES ('00000000-0000-0000-0000-000000000000', 0)
ON CONFLICT (id) DO NOTHING;

-- Create function to update user count
CREATE OR REPLACE FUNCTION update_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE user_stats 
  SET total_users = (SELECT COUNT(*) FROM auth.users),
      last_updated = NOW()
  WHERE id = '00000000-0000-0000-0000-000000000000';
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on auth.users to update count on insert
CREATE TRIGGER update_user_count_on_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION update_user_count();

-- Create trigger on auth.users to update count on delete
CREATE TRIGGER update_user_count_on_delete
AFTER DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION update_user_count();

-- Initial update to set the current count
UPDATE user_stats 
SET total_users = (SELECT COUNT(*) FROM auth.users),
    last_updated = NOW()
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to user_stats"
ON user_stats
FOR SELECT
TO anon, authenticated
USING (true);

