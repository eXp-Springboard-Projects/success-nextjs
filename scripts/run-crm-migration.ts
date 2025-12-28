import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('\n🚀 Running CRM Database Migration\n');
  console.log('═'.repeat(80));

  try {
    // Read the SQL migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '002_crm_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('\n📄 Migration file loaded: 002_crm_tables.sql');
    console.log(`   File size: ${migrationSQL.length} characters\n`);

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    console.log('─'.repeat(80));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');

      try {
        // Execute the SQL statement using Supabase RPC
        const { error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });

        if (error) {
          // Check if it's a "already exists" error (which is OK)
          if (error.message.includes('already exists')) {
            console.log(`⏭️  [${i + 1}/${statements.length}] SKIP: ${preview}...`);
            skipCount++;
          } else {
            console.log(`❌ [${i + 1}/${statements.length}] ERROR: ${preview}...`);
            console.log(`   ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✅ [${i + 1}/${statements.length}] OK: ${preview}...`);
          successCount++;
        }
      } catch (err: any) {
        // If exec_sql RPC doesn't exist, we need to use direct SQL execution
        // This requires a different approach with postgres connection
        console.log(`⚠️  [${i + 1}/${statements.length}] SKIP (RPC not available): ${preview}...`);
        skipCount++;
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📊 MIGRATION SUMMARY:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);

    if (errorCount === 0 && successCount > 0) {
      console.log('\n✅ Migration completed successfully!\n');
    } else if (skipCount === statements.length) {
      console.log('\n⚠️  All statements skipped - RPC method not available.');
      console.log('   Migration should be run directly in Supabase SQL Editor.\n');
      console.log('   To run manually:');
      console.log('   1. Go to https://supabase.com/dashboard/project/aczlassjkbtwenzsohwm/sql/new');
      console.log('   2. Copy the contents of supabase/migrations/002_crm_tables.sql');
      console.log('   3. Paste and run in the SQL editor\n');
    } else {
      console.log('\n⚠️  Migration completed with some errors.\n');
    }

  } catch (error: any) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    process.exit(1);
  }

  console.log('═'.repeat(80) + '\n');
}

runMigration().catch(console.error);
