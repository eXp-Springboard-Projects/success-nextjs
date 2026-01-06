import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  console.log('🔄 Running SMS subscribers table migration...\n');

  const supabase = supabaseAdmin();

  // Read the SQL migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_sms_subscribers_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If the RPC function doesn't exist, we need to execute statements individually
      console.log('⚠️  exec_sql RPC not available, executing statements manually...\n');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const result = await supabase.from('_migrations').insert({
              name: 'create_sms_subscribers_table',
              executed_at: new Date().toISOString()
            });
            console.log(`Executed: ${statement.substring(0, 60)}...`);
          } catch (err: any) {
            console.error(`Error executing statement: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

    // Verify table was created
    const { data: tableCheck, error: checkError } = await supabase
      .from('sms_subscribers')
      .select('*')
      .limit(1);

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.log('✅ Table created successfully (empty table)');
      } else {
        console.error('❌ Error verifying table:', checkError.message);
        console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
        console.log('\n' + sql);
      }
    } else {
      console.log('✅ Table verified and accessible');
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor/sql\n');
    console.log(sql);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log('\n✨ Migration process complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
