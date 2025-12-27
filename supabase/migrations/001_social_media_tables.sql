-- ============================================================================
-- SOCIAL MEDIA CALENDAR & AUTO-POSTER - DATABASE MIGRATION
-- ============================================================================
-- This migration creates all tables for the social media scheduling feature
-- Compatible with NextAuth (does not use Supabase Auth)
-- ============================================================================

-- Social Media Connected Accounts
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- NextAuth user ID (string, not UUID)
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'threads')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  platform_display_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- Social Media Posts (scheduled content)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- NextAuth user ID
  content TEXT NOT NULL,
  content_variants JSONB DEFAULT '{}', -- Platform-specific content overrides
  media_urls TEXT[] DEFAULT '{}',
  media_ids UUID[] DEFAULT '{}', -- References to media_library
  link_url TEXT,
  link_preview JSONB, -- Cached OG data
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  target_platforms TEXT[] NOT NULL,
  is_evergreen BOOLEAN DEFAULT false,
  evergreen_interval_days INTEGER, -- Days before recycling
  last_recycled_at TIMESTAMPTZ,
  recycle_count INTEGER DEFAULT 0,
  queue_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform-specific post results
CREATE TABLE IF NOT EXISTS social_post_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT, -- ID returned by platform after posting
  platform_post_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  -- Analytics (updated via webhooks or polling)
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  analytics_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Library
CREATE TABLE IF NOT EXISTS social_media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- NextAuth user ID
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- image/jpeg, video/mp4, etc.
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- For videos
  alt_text TEXT,
  tags TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posting Queue/Schedule Templates
CREATE TABLE IF NOT EXISTS social_queue_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- NextAuth user ID
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  time_slot TIME NOT NULL,
  platforms TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_of_week, time_slot)
);

-- Hashtag Groups (for quick insertion)
CREATE TABLE IF NOT EXISTS social_hashtag_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- NextAuth user ID
  name TEXT NOT NULL,
  hashtags TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled
  ON social_posts(scheduled_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_social_posts_user
  ON social_posts(user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_status
  ON social_posts(status);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user
  ON social_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_social_accounts_platform
  ON social_accounts(user_id, platform)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_social_post_results_post
  ON social_post_results(post_id);

CREATE INDEX IF NOT EXISTS idx_social_media_library_user
  ON social_media_library(user_id);

CREATE INDEX IF NOT EXISTS idx_social_queue_slots_user
  ON social_queue_slots(user_id)
  WHERE is_active = true;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_post_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_queue_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_hashtag_groups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (NextAuth Compatible)
-- ============================================================================
-- Note: These policies use the custom auth.user_id() function which you'll
-- need to set via your API routes by setting the request context

-- Social Accounts Policies
DROP POLICY IF EXISTS "Users can manage own social accounts" ON social_accounts;
CREATE POLICY "Users can manage own social accounts" ON social_accounts
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true));

-- Social Posts Policies
DROP POLICY IF EXISTS "Users can manage own posts" ON social_posts;
CREATE POLICY "Users can manage own posts" ON social_posts
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true));

-- Social Post Results Policies
DROP POLICY IF EXISTS "Users can view own post results" ON social_post_results;
CREATE POLICY "Users can view own post results" ON social_post_results
  FOR ALL
  USING (
    post_id IN (
      SELECT id FROM social_posts
      WHERE user_id = current_setting('app.current_user_id', true)
    )
  );

-- Media Library Policies
DROP POLICY IF EXISTS "Users can manage own media" ON social_media_library;
CREATE POLICY "Users can manage own media" ON social_media_library
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true));

-- Queue Slots Policies
DROP POLICY IF EXISTS "Users can manage own queue slots" ON social_queue_slots;
CREATE POLICY "Users can manage own queue slots" ON social_queue_slots
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true));

-- Hashtag Groups Policies
DROP POLICY IF EXISTS "Users can manage own hashtag groups" ON social_hashtag_groups;
CREATE POLICY "Users can manage own hashtag groups" ON social_hashtag_groups
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_posts_updated_at ON social_posts;
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on tables to authenticated users
GRANT ALL ON social_accounts TO authenticated;
GRANT ALL ON social_posts TO authenticated;
GRANT ALL ON social_post_results TO authenticated;
GRANT ALL ON social_media_library TO authenticated;
GRANT ALL ON social_queue_slots TO authenticated;
GRANT ALL ON social_hashtag_groups TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample hashtag groups for testing
-- INSERT INTO social_hashtag_groups (user_id, name, hashtags) VALUES
--   ('test-user-1', 'Business', ARRAY['#business', '#entrepreneur', '#success', '#leadership']),
--   ('test-user-1', 'Motivation', ARRAY['#motivation', '#inspiration', '#mindset', '#goals'])
-- ON CONFLICT (user_id, name) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this migration in Supabase SQL Editor
-- Then set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
-- ============================================================================
