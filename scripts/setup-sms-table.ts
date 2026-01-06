/**
 * Setup SMS Subscribers table in Supabase
 * This script creates the table by executing SQL statements
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  console.log('Set it in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function setupTable() {
  console.log('🔄 Setting up SMS Subscribers table...\n');

  // First check if table exists
  const { data: existingData, error: checkError } = await supabase
    .from('sms_subscribers')
    .select('id')
    .limit(1);

  if (!checkError || checkError.code !== 'PGRST204') {
    console.log('✅ Table "sms_subscribers" already exists!');

    // Get count
    const { count } = await supabase
      .from('sms_subscribers')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current subscriber count: ${count || 0}\n`);
    console.log('✅ Database is ready for lead capture!');
    return;
  }

  console.log('📝 Table does not exist. Creating now...\n');
  console.log('Since Supabase REST API does not support DDL execution,');
  console.log('please run the following SQL in Supabase SQL Editor:\n');
  console.log('🔗 https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor/sql\n');
  console.log('═'.repeat(80));

  const sql = `-- Create SMS Subscribers table
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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sms_subscribers_updated_at
  BEFORE UPDATE ON sms_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS and Policies
ALTER TABLE sms_subscribers ENABLE ROW LEVEL SECURITY;

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
  );`;

  console.log(sql);
  console.log('═'.repeat(80));
  console.log('\n📌 After running the SQL, run this script again to verify.\n');
}

setupTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
