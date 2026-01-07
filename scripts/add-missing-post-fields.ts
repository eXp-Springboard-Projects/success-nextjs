import { supabaseAdmin } from '../lib/supabase';

const supabase = supabaseAdmin();

async function addMissingPostFields() {
  console.log('🔧 Adding missing fields to posts table...\n');

  try {
    // 1. Add contentPillar field (CRITICAL - fixes schema cache error)
    console.log('Adding contentPillar field...');
    const { error: contentPillarError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE posts ADD COLUMN IF NOT EXISTS "contentPillar" TEXT'
    });
    if (contentPillarError && !contentPillarError.message?.includes('already exists')) {
      throw contentPillarError;
    }
    console.log('✓ Added contentPillar column');

    // 2. Add AI excerpt tracking fields
    console.log('\nAdding excerpt tracking fields...');
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "excerptGeneratedBy" TEXT DEFAULT 'manual'
    `;
    console.log('✓ Added excerptGeneratedBy column');

    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "excerptGeneratedAt" TIMESTAMP(3)
    `;
    console.log('✓ Added excerptGeneratedAt column');

    // 3. Add separate author name field (fixes author attribution bug)
    console.log('\nAdding author attribution fields...');
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "authorName" TEXT
    `;
    console.log('✓ Added authorName column (for writer display name)');

    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "authorSlug" TEXT
    `;
    console.log('✓ Added authorSlug column');

    // 4. Add created_by/updated_by for admin tracking (separate from author)
    console.log('\nAdding admin tracking fields...');
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "createdBy" TEXT
    `;
    console.log('✓ Added createdBy column (admin who created)');

    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "updatedBy" TEXT
    `;
    console.log('✓ Added updatedBy column (admin who last edited)');

    // 5. Add homepage display toggles
    console.log('\nAdding homepage display toggles...');
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "featureOnHomepage" BOOLEAN NOT NULL DEFAULT false
    `;
    console.log('✓ Added featureOnHomepage column');

    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "featureInPillarSection" BOOLEAN NOT NULL DEFAULT false
    `;
    console.log('✓ Added featureInPillarSection column');

    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "showInTrending" BOOLEAN NOT NULL DEFAULT false
    `;
    console.log('✓ Added showInTrending column');

    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "mainFeaturedArticle" BOOLEAN NOT NULL DEFAULT false
    `;
    console.log('✓ Added mainFeaturedArticle column');

    // 6. Add contentType field
    console.log('\nAdding contentType field...');
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "contentType" TEXT DEFAULT 'regular'
    `;
    console.log('✓ Added contentType column');

    // 7. Add scheduledFor field
    console.log('\nAdding scheduling field...');
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3)
    `;
    console.log('✓ Added scheduledFor column');

    // 8. Add custom author ID (for linking to authors table if we create one)
    console.log('\nAdding custom author ID field...');
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "customAuthorId" TEXT
    `;
    console.log('✓ Added customAuthorId column');

    // 9. Add indexes for performance
    console.log('\nAdding indexes...');

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "posts_contentPillar_idx" ON posts("contentPillar")
      `;
      console.log('✓ Added index on contentPillar');
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "posts_authorName_idx" ON posts("authorName")
      `;
      console.log('✓ Added index on authorName');
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }

    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "posts_featureOnHomepage_idx" ON posts("featureOnHomepage")
      `;
      console.log('✓ Added index on featureOnHomepage');
    } catch (e: any) {
      if (!e.message?.includes('already exists')) throw e;
    }

    // 10. Migrate existing data (copy authorId username to createdBy for audit trail)
    console.log('\nMigrating existing data...');
    await prisma.$executeRaw`
      UPDATE posts
      SET "createdBy" = "authorId"
      WHERE "createdBy" IS NULL
    `;
    console.log('✓ Migrated authorId to createdBy for existing posts');

    // 11. Copy wordpressAuthor to authorName if available
    await prisma.$executeRaw`
      UPDATE posts
      SET "authorName" = "wordpressAuthor"
      WHERE "wordpressAuthor" IS NOT NULL AND "authorName" IS NULL
    `;
    console.log('✓ Migrated wordpressAuthor to authorName');

    console.log('\n✅ Successfully added all missing fields to posts table!\n');

    // Show summary
    console.log('📊 Summary of Changes:');
    console.log('   • contentPillar - Fixes schema cache error');
    console.log('   • excerptGeneratedBy/excerptGeneratedAt - Track AI generations');
    console.log('   • authorName/authorSlug - Display writer names (not admin names)');
    console.log('   • createdBy/updatedBy - Track which admin edited (audit only)');
    console.log('   • 4 homepage display toggles - Feature on homepage, pillar, trending, main');
    console.log('   • contentType - regular/video/podcast/etc');
    console.log('   • scheduledFor - Schedule publishing');
    console.log('   • customAuthorId - Link to authors table (future)');
    console.log('\n💡 Next Steps:');
    console.log('   1. Test post creation - should no longer get contentPillar error');
    console.log('   2. Update admin UI to use authorName instead of logged-in user');
    console.log('   3. Build AI excerpt generation functionality');
    console.log('   4. Test homepage display toggles\n');

  } catch (error) {
    console.error('❌ Error adding missing post fields:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMissingPostFields()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
