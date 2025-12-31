import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    // Step 1: Remove old columns from users table
    console.log('Step 1: Dropping old columns from users table...');
    await prisma.$executeRaw`ALTER TABLE users DROP COLUMN IF EXISTS "membershipTier"`;
    await prisma.$executeRaw`ALTER TABLE users DROP COLUMN IF EXISTS "subscriptionStatus"`;
    await prisma.$executeRaw`ALTER TABLE users DROP COLUMN IF EXISTS "stripeCustomerId"`;
    console.log('✅ Old columns dropped\n');

    // Step 2: Add memberId column to users
    console.log('Step 2: Adding memberId column to users...');
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "memberId" TEXT`;
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD CONSTRAINT "users_memberId_key" UNIQUE ("memberId")`;
    } catch (e) {
      console.log('   (Constraint already exists, skipping)');
    }
    console.log('✅ memberId column added\n');

    // Step 3: Create subscribers table
    console.log('Step 3: Creating subscribers table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS subscribers (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        email TEXT UNIQUE NOT NULL,
        "firstName" TEXT,
        "lastName" TEXT,
        type TEXT NOT NULL DEFAULT 'EmailNewsletter',
        "recipientType" TEXT NOT NULL DEFAULT 'Customer',
        "isComplimentary" BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        source TEXT,
        "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "unsubscribedAt" TIMESTAMP(3),
        "memberId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ subscribers table created\n');

    // Step 4: Create indexes on subscribers
    console.log('Step 4: Creating indexes on subscribers...');
    const subscriberIndexes = [
      'CREATE INDEX IF NOT EXISTS "subscribers_email_idx" ON subscribers(email)',
      'CREATE INDEX IF NOT EXISTS "subscribers_status_idx" ON subscribers(status)',
      'CREATE INDEX IF NOT EXISTS "subscribers_type_idx" ON subscribers(type)',
      'CREATE INDEX IF NOT EXISTS "subscribers_recipientType_idx" ON subscribers("recipientType")',
      'CREATE INDEX IF NOT EXISTS "subscribers_isComplimentary_idx" ON subscribers("isComplimentary")',
      'CREATE INDEX IF NOT EXISTS "subscribers_memberId_idx" ON subscribers("memberId")',
    ];
    for (const indexSql of subscriberIndexes) {
      await prisma.$executeRawUnsafe(indexSql);
    }
    console.log('✅ Subscriber indexes created\n');

    console.log('🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Restart your dev server');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
