import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function runMigration() {
  console.log('🚀 Running store_products table migration...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the migration SQL file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_store_products_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('📦 store_products table created');
    console.log('🔐 RLS policies configured');
    console.log('📊 Indexes created\n');
  } catch (err) {
    console.error('❌ Error running migration:', err);
    process.exit(1);
  }
}

runMigration();
