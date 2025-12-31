-- Social Media Auto-Poster Tables
-- Create tables for social media account connections and scheduled posts

-- Social Accounts table (stores OAuth connections)
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'threads')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT NOT NULL,
  platform_display_name TEXT,
  access_token TEXT NOT NULL, -- Encrypted OAuth access token
  refresh_token TEXT, -- Encrypted OAuth refresh token
  token_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(platform, platform_user_id)
);

-- Social Posts table (stores scheduled/published posts)
CREATE TABLE IF NOT EXISTS public.social_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of media URLs to attach
  target_platforms TEXT[] NOT NULL, -- Array of platforms to post to
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  error_message TEXT,
  platform_post_ids JSONB, -- Store post IDs from each platform
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Social Media Library table (stores uploaded images/videos)
CREATE TABLE IF NOT EXISTS public.social_media_library (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  tags TEXT[],
  folder TEXT DEFAULT 'general',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON public.social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON public.social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON public.social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON public.social_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_media_library_user_id ON public.social_media_library(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_social_accounts_updated_at BEFORE UPDATE ON public.social_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON public.social_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_media_library_updated_at BEFORE UPDATE ON public.social_media_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
