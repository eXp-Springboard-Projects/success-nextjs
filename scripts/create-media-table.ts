/**
 * Create media table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMediaTable() {
  console.log('Creating media table...');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_media_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Note: Supabase client doesn't support raw SQL directly
    // We need to use the Management API or run this through Supabase Dashboard
    // For now, let's create the table with the essential structure

    console.log('Please run this migration through the Supabase Dashboard SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80) + '\n');

    console.log('\nOr visit: https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createMediaTable()
  .then(() => {
    console.log('\n✅ Migration SQL displayed above');
    console.log('Please run it in the Supabase Dashboard SQL Editor');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
