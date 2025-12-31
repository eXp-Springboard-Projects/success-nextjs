/**
 * Create Social Media Tables in Supabase using Direct SQL
 * Run with: npx tsx scripts/create-social-tables-direct.ts
 */

import { createClient } from '@supabase/supabase-js';

async function createTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Creating social media tables in Supabase...\n');

  // Create social_accounts table
  console.log('Creating social_accounts table...');
  const { error: error1 } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.social_accounts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'threads')),
        platform_user_id TEXT NOT NULL,
        platform_username TEXT NOT NULL,
        platform_display_name TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(platform, platform_user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON public.social_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON public.social_accounts(platform);
    `
  });

  if (error1 && !error1.message.includes('already exists')) {
    console.error('Error creating social_accounts:', error1);
  } else {
    console.log('✓ social_accounts table created');
  }

  // Create social_posts table
  console.log('Creating social_posts table...');
  const { error: error2 } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.social_posts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        media_urls TEXT[],
        target_platforms TEXT[] NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
        scheduled_at TIMESTAMP,
        published_at TIMESTAMP,
        error_message TEXT,
        platform_post_ids JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON public.social_posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
      CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON public.social_posts(scheduled_at);
    `
  });

  if (error2 && !error2.message.includes('already exists')) {
    console.error('Error creating social_posts:', error2);
  } else {
    console.log('✓ social_posts table created');
  }

  // Create social_media_library table
  console.log('Creating social_media_library table...');
  const { error: error3 } = await supabase.rpc('exec', {
    sql: `
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

      CREATE INDEX IF NOT EXISTS idx_social_media_library_user_id ON public.social_media_library(user_id);
    `
  });

  if (error3 && !error3.message.includes('already exists')) {
    console.error('Error creating social_media_library:', error3);
  } else {
    console.log('✓ social_media_library table created');
  }

  // Verify tables exist
  console.log('\nVerifying tables...');

  const tables = ['social_accounts', 'social_posts', 'social_media_library'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(0);

    if (error) {
      console.log(`✗ ${table}: ${error.message}`);
    } else {
      console.log(`✓ ${table} is accessible`);
    }
  }

  console.log('\n✅ Done! Social media tables are ready.');
}

createTables().catch(console.error);
