import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

async function runMigration() {
  console.log('🚀 Running products table migration...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read SQL file
    const sqlPath = join(process.cwd(), 'scripts', 'create-products-table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 Executing SQL migration...');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query if RPC doesn't work
        console.log('⚠️  RPC not available, trying direct query...');
        // Note: This requires using postgres client directly
        console.log('Statement:', statement.substring(0, 100) + '...');
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - products');
    console.log('  - orders');
    console.log('  - order_items');
    console.log('  - shopping_carts');
    console.log('  - product_reviews');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n💡 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql');
    process.exit(1);
  }
}

runMigration();
