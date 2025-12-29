-- ============================================================================
-- CREATE PAGE_OVERRIDES TABLE FOR VISUAL PAGE EDITOR
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS page_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(500) NOT NULL UNIQUE,
  overrides JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_overrides_path ON page_overrides(page_path);
CREATE INDEX IF NOT EXISTS idx_page_overrides_updated ON page_overrides(updated_at DESC);

COMMENT ON TABLE page_overrides IS 'Visual editor overrides for static pages';
COMMENT ON COLUMN page_overrides.page_path IS 'Page URL path (e.g., /press, /about)';
COMMENT ON COLUMN page_overrides.overrides IS 'JSON object with element selectors and their override values';

-- Example data structure:
-- {
--   ".title": {
--     "color": "#FF0000",
--     "fontSize": "32px"
--   },
--   "#header": {
--     "backgroundColor": "#000000"
--   }
-- }
