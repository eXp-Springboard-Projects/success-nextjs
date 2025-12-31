/**
 * Create Social Media Tables in Supabase
 * Run with: npx tsx scripts/create-social-tables.ts
 */

import { supabaseAdmin } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

async function createTables() {
  const supabase = supabaseAdmin();

  console.log('Creating social media tables in Supabase...');

  // Read the SQL file
  const sqlPath = path.join(__dirname, 'create-social-media-tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error('Error executing statement:', error);
        // Try direct query as fallback
        const { error: error2 } = await (supabase as any).from('_sql').insert({ query: statement });
        if (error2) {
          console.error('Fallback also failed:', error2);
        }
      } else {
        console.log('✓ Executed statement successfully');
      }
    } catch (err) {
      console.error('Exception:', err);
    }
  }

  // Verify tables were created
  console.log('\nVerifying tables...');

  const tables = ['social_accounts', 'social_posts', 'social_media_library'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`✗ Table ${table} not accessible:`, error.message);
    } else {
      console.log(`✓ Table ${table} exists and is accessible`);
    }
  }

  console.log('\nDone!');
}

createTables().catch(console.error);
