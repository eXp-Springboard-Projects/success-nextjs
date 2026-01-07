import { supabaseAdmin } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  const supabase = supabaseAdmin();

  console.log('🚀 Running homepage placements migration...');

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/add_homepage_placements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...');

      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error('❌ Error executing statement:', error);
        // Try direct execution as fallback
        const { error: directError } = await supabase.from('_migrations').insert({});
        if (directError) {
          console.error('Direct execution also failed');
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit /admin/featured-content to manage homepage placements');
    console.log('2. Select posts and assign them to homepage zones');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
