-- Create magazine_issues table for managing digital magazine covers and reader links
CREATE TABLE IF NOT EXISTS magazine_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  publish_date VARCHAR(100) NOT NULL,
  cover_image_url TEXT NOT NULL,
  reader_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_magazine_issues_slug ON magazine_issues(slug);

-- Create index on active issues
CREATE INDEX IF NOT EXISTS idx_magazine_issues_active ON magazine_issues(active) WHERE active = true;

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_magazine_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_magazine_issues_updated_at
  BEFORE UPDATE ON magazine_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_magazine_issues_updated_at();

-- Enable Row Level Security
ALTER TABLE magazine_issues ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active issues
CREATE POLICY "Anyone can view active magazine issues"
  ON magazine_issues
  FOR SELECT
  USING (active = true);

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access to magazine issues"
  ON magazine_issues
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage magazine issues"
  ON magazine_issues
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'EDITOR')
    )
  );

-- Insert default January 2026 issue
INSERT INTO magazine_issues (
  slug,
  title,
  publish_date,
  cover_image_url,
  reader_url,
  active
) VALUES (
  'january2026',
  'January/February 2026',
  'JANUARY / FEBRUARY 2026',
  '',
  'https://read.dmtmag.com/i/1555634-jan-feb-2026/0',
  true
) ON CONFLICT (slug) DO NOTHING;
