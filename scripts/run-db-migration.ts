/**
 * Run Database Migration
 * Adds missing fields to posts table
 */

import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

async function runMigration() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║         Running Database Migration             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    const migrations = [
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "contentPillar" TEXT', desc: 'Add contentPillar field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "excerptGeneratedBy" TEXT DEFAULT \'manual\'', desc: 'Add excerptGeneratedBy field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "excerptGeneratedAt" TIMESTAMP(3)', desc: 'Add excerptGeneratedAt field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "authorName" TEXT', desc: 'Add authorName field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "authorSlug" TEXT', desc: 'Add authorSlug field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "createdBy" TEXT', desc: 'Add createdBy field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "updatedBy" TEXT', desc: 'Add updatedBy field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "featureOnHomepage" BOOLEAN NOT NULL DEFAULT false', desc: 'Add featureOnHomepage field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "featureInPillarSection" BOOLEAN NOT NULL DEFAULT false', desc: 'Add featureInPillarSection field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "showInTrending" BOOLEAN NOT NULL DEFAULT false', desc: 'Add showInTrending field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "mainFeaturedArticle" BOOLEAN NOT NULL DEFAULT false', desc: 'Add mainFeaturedArticle field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "contentType" TEXT DEFAULT \'regular\'', desc: 'Add contentType field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3)', desc: 'Add scheduledFor field' },
      { sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "customAuthorId" TEXT', desc: 'Add customAuthorId field' },
      { sql: 'CREATE INDEX IF NOT EXISTS "posts_contentPillar_idx" ON posts("contentPillar")', desc: 'Create contentPillar index' },
      { sql: 'CREATE INDEX IF NOT EXISTS "posts_authorName_idx" ON posts("authorName")', desc: 'Create authorName index' },
      { sql: 'CREATE INDEX IF NOT EXISTS "posts_featureOnHomepage_idx" ON posts("featureOnHomepage")', desc: 'Create featureOnHomepage index' },
      { sql: 'UPDATE posts SET "createdBy" = "authorId" WHERE "createdBy" IS NULL', desc: 'Migrate createdBy data' },
      { sql: 'UPDATE posts SET "authorName" = "wordpressAuthor" WHERE "wordpressAuthor" IS NOT NULL AND "authorName" IS NULL', desc: 'Migrate authorName data' }
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const migration of migrations) {
      try {
        await client.query(migration.sql);
        successCount++;
        console.log(`✓ ${migration.desc}`);
      } catch (err: any) {
        errorCount++;
        console.error(`✗ ${migration.desc}`);
        console.error(`  Error: ${err.message}`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║          Migration Complete!                   ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log(`  Success: ${successCount}/${migrations.length} migrations`);
    console.log(`  Errors:  ${errorCount}/${migrations.length} migrations\n`);

    if (successCount === migrations.length) {
      console.log('✅ All migrations executed successfully!\n');
      console.log('Next steps:');
      console.log('  1. Test post creation in admin panel');
      console.log('  2. Test AI excerpt generation');
      console.log('  3. Import WordPress content\n');
    }

  } catch (error: any) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
