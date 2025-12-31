import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPremiumContentFields() {
  console.log('Adding premium content fields to posts table...');

  try {
    // Add isPremium column
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false
    `;

    console.log('✓ Added isPremium column');

    // Add requiredTier column
    await prisma.$executeRaw`
      ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS "requiredTier" TEXT DEFAULT 'collective'
    `;

    console.log('✓ Added requiredTier column');

    // Add index on isPremium for faster queries
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "posts_isPremium_idx" ON posts("isPremium")
    `;

    console.log('✓ Added index on isPremium');

    // Add constraint to ensure requiredTier is valid (PostgreSQL doesn't support IF NOT EXISTS for constraints)
    try {
      await prisma.$executeRaw`
        ALTER TABLE posts
        ADD CONSTRAINT "posts_requiredTier_check"
        CHECK ("requiredTier" IN ('collective', 'insider'))
      `;
      console.log('✓ Added requiredTier constraint');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('✓ requiredTier constraint already exists');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Successfully added premium content fields to posts table');

    // Show sample query
    console.log('\nSample usage:');
    console.log('  - Mark article as premium: UPDATE posts SET "isPremium" = true, "requiredTier" = \'collective\' WHERE id = \'...\';');
    console.log('  - Query premium articles: SELECT * FROM posts WHERE "isPremium" = true;');
    console.log('  - Query insider articles: SELECT * FROM posts WHERE "requiredTier" = \'insider\';');

  } catch (error) {
    console.error('❌ Error adding premium content fields:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPremiumContentFields()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
