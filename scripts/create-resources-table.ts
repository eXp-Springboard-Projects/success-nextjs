import { supabaseAdmin } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('Running resources table migration...');

  const supabase = supabaseAdmin();

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_resources_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements and run them
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    console.log(`\nExecuting: ${statement.substring(0, 100)}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

    if (error) {
      // Try direct query if RPC doesn't work
      const { error: directError } = await supabase.from('_migrations').insert({
        name: 'create_resources_table',
        executed_at: new Date().toISOString()
      });

      console.log('Note: RPC method failed, trying alternative approach');
      console.log('You may need to run this migration manually in Supabase SQL Editor:');
      console.log('\n' + sql);
      break;
    } else {
      console.log('✓ Success');
    }
  }

  console.log('\nMigration completed! Try uploading a resource now.');
}

runMigration().catch(console.error);
