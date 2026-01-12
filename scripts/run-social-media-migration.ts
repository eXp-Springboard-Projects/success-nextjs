import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://jdmlflnrfcmgszfsyhdg.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkbWxmbG5yZmNtZ3N6ZnN5aGRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDE5OTY1OCwiZXhwIjoyMDQ5Nzc1NjU4fQ.nBxIPlQxAT6lq0BbTx00qxnONvCdJe5DBEOK6xHp0RA';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  console.log('Running social media requests migration...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_social_media_requests.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Migration error:', error);

      // Try alternative approach: execute each statement separately
      console.log('Trying alternative approach...');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (stmtError) {
          console.error('Statement error:', stmtError);
        }
      }
    } else {
      console.log('✅ Migration completed successfully');
    }

    // Verify the table was created
    const { data, error: verifyError } = await supabase
      .from('social_media_requests')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Table verified successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

runMigration();
