import { supabaseAdmin } from '../lib/supabase';

async function createTable() {
  const supabase = supabaseAdmin();

  console.log('Creating email_campaigns table...');

  try {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('Table does not exist. Please run this SQL in Supabase dashboard:');
      console.log('https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor\n');
      console.log(`
CREATE TABLE IF NOT EXISTS email_campaigns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT 'SUCCESS Magazine',
  from_email TEXT NOT NULL DEFAULT 'hello@success.com',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON email_campaigns(sent_at);
      `);
      return;
    }

    console.log('✅ Table already exists!');

  } catch (err) {
    console.error('Error:', err);
  }
}

createTable();
