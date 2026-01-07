import { supabaseAdmin } from '../lib/supabase';

async function setupHomepagePlacements() {
  const supabase = supabaseAdmin();

  console.log('🚀 Setting up homepage_placements table...\n');

  try {
    // First, check if table exists by trying to query it
    const { error: testError } = await supabase
      .from('homepage_placements')
      .select('id')
      .limit(1);

    if (!testError) {
      console.log('✅ Table already exists!');
      return;
    }

    if (!testError?.message?.includes('does not exist')) {
      throw testError;
    }

    console.log('Creating homepage_placements table...');

    // Create the table using Supabase SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS homepage_placements (
        id TEXT PRIMARY KEY,
        "postId" TEXT NOT NULL,
        zone TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        active BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "createdBy" TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS homepage_placements_zone_active_idx
        ON homepage_placements(zone, active, position);

      CREATE INDEX IF NOT EXISTS homepage_placements_postId_idx
        ON homepage_placements("postId");

      CREATE UNIQUE INDEX IF NOT EXISTS homepage_placements_zone_position_key
        ON homepage_placements(zone, position) WHERE active = true;
    `;

    // Try to execute via RPC if available
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (rpcError) {
      console.log('\n⚠️  Cannot execute SQL directly via API.');
      console.log('\nPlease run this SQL in Supabase Dashboard > SQL Editor:\n');
      console.log('─'.repeat(60));
      console.log(createTableSQL);
      console.log('─'.repeat(60));
      console.log('\nAfter running the SQL, the Featured Content Manager will work!');
      process.exit(1);
    }

    console.log('✅ Table created successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Visit /admin/featured-content');
    console.log('   2. Select articles for homepage zones');
    console.log('   3. Homepage will automatically use your selections!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);

    console.log('\n📋 Manual Setup Required:');
    console.log('Go to Supabase Dashboard > SQL Editor and run:\n');
    console.log(`
CREATE TABLE IF NOT EXISTS homepage_placements (
  id TEXT PRIMARY KEY,
  "postId" TEXT NOT NULL,
  zone TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdBy" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS homepage_placements_zone_active_idx
  ON homepage_placements(zone, active, position);

CREATE INDEX IF NOT EXISTS homepage_placements_postId_idx
  ON homepage_placements("postId");

CREATE UNIQUE INDEX IF NOT EXISTS homepage_placements_zone_position_key
  ON homepage_placements(zone, position) WHERE active = true;
    `);

    process.exit(1);
  }
}

setupHomepagePlacements();
