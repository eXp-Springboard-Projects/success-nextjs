/**
 * Execute SMS Subscribers table migration
 * This script creates the sms_subscribers table directly in Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function executeMigration() {
  console.log('🔄 Creating SMS Subscribers table...\n');

  // Check if table already exists
  const { data: existingTable, error: checkError } = await supabase
    .from('sms_subscribers')
    .select('id')
    .limit(1);

  if (existingTable !== null && !checkError) {
    console.log('✅ Table "sms_subscribers" already exists!');
    console.log('📊 Verifying table structure...\n');

    const { count, error: countError } = await supabase
      .from('sms_subscribers')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`✅ Table is accessible. Current records: ${count || 0}`);
      return;
    }
  }

  console.log('📝 Table does not exist. Creating it now...\n');

  // Since Supabase REST API doesn't support DDL, we'll use their SQL function if available
  // or guide the user to create it manually

  const sql = `
-- Create SMS Subscribers table
CREATE TABLE sms_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  resubscribed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_sms_subscribers_phone ON sms_subscribers(phone);
CREATE UNIQUE INDEX idx_sms_subscribers_email ON sms_subscribers(email);
CREATE INDEX idx_sms_subscribers_active ON sms_subscribers(active) WHERE active = true;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger
CREATE TRIGGER update_sms_subscribers_updated_at
  BEFORE UPDATE ON sms_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table comment
COMMENT ON TABLE sms_subscribers IS 'Stores subscribers for daily inspirational SMS quotes';

-- Enable RLS
ALTER TABLE sms_subscribers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role has full access to sms_subscribers"
  ON sms_subscribers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can read sms_subscribers"
  ON sms_subscribers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );
`;

  console.log('⚠️  Supabase REST API does not support DDL execution.');
  console.log('📋 Please run this SQL in Supabase SQL Editor:\n');
  console.log('🔗 https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor/sql\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n📌 After running the SQL, test again by running this script.\n');
}

executeMigration()
  .then(() => {
    console.log('✨ Migration check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
