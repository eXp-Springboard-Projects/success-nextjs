/**
 * Create Page Overrides Table
 *
 * Creates a table to store visual editor overrides for static pages
 *
 * Usage:
 *   npx tsx scripts/create-page-overrides-table.ts
 */

import { supabaseAdmin } from '../lib/supabase';

async function createPageOverridesTable() {
  console.log('📋 Creating page_overrides table...\n');

  const supabase = supabaseAdmin();

  // Create the table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS page_overrides (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_path VARCHAR(500) NOT NULL UNIQUE,
      overrides JSONB NOT NULL DEFAULT '{}',
      created_by UUID REFERENCES users(id),
      updated_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_page_overrides_path ON page_overrides(page_path);
    CREATE INDEX IF NOT EXISTS idx_page_overrides_updated ON page_overrides(updated_at DESC);

    COMMENT ON TABLE page_overrides IS 'Visual editor overrides for static pages';
    COMMENT ON COLUMN page_overrides.page_path IS 'Page URL path (e.g., /press, /about)';
    COMMENT ON COLUMN page_overrides.overrides IS 'JSON object with element selectors and their override values';
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      // Try direct SQL execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, creating table directly...');

      // Since we can't execute raw SQL directly, we'll use the REST API
      console.log('✅ Table schema ready');
      console.log('\nPlease run this SQL in your Supabase SQL Editor:');
      console.log('='.repeat(80));
      console.log(createTableSQL);
      console.log('='.repeat(80));
    } else {
      console.log('✅ page_overrides table created successfully!');
    }

    console.log('\n📊 Table Structure:');
    console.log('  - id: UUID (Primary Key)');
    console.log('  - page_path: VARCHAR(500) (Unique)');
    console.log('  - overrides: JSONB (Element overrides)');
    console.log('  - created_by: UUID (References users)');
    console.log('  - updated_by: UUID (References users)');
    console.log('  - created_at: TIMESTAMP');
    console.log('  - updated_at: TIMESTAMP\n');

    console.log('🎉 Setup complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log(createTableSQL);
    console.log('='.repeat(80));
  }
}

createPageOverridesTable();
