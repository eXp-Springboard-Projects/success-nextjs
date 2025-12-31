import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Pre-Migration: Create Members from existing Users with subscriptions
 * Run this BEFORE schema migration to preserve data
 */

async function main() {
  console.log('🔍 Pre-Migration: Backing up user data to members table...\n');

  // First, manually create members table if it doesn't exist
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "members" (
      "id" TEXT PRIMARY KEY,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "phone" TEXT,
      "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "membershipTier" TEXT NOT NULL DEFAULT 'Free',
      "membershipStatus" TEXT NOT NULL DEFAULT 'Active',
      "lastLoginDate" TIMESTAMP(3),
      "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "lifetimeValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
      "engagementScore" INTEGER NOT NULL DEFAULT 0,
      "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "billingAddress" JSONB,
      "shippingAddress" JSONB,
      "communicationPreferences" JSONB,
      "assignedCSRep" TEXT,
      "priorityLevel" TEXT NOT NULL DEFAULT 'Standard',
      "internalNotes" TEXT,
      "stripeCustomerId" TEXT UNIQUE,
      "paykickstartCustomerId" TEXT UNIQUE,
      "woocommerceCustomerId" INTEGER UNIQUE,
      "lastContactDate" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('✅ Members table created/verified\n');

  // Get all users with subscription data (old schema)
  const usersWithData = await prisma.$queryRaw<any[]>`
    SELECT
      u.id,
      u.name,
      u.email,
      u."createdAt",
      u."stripeCustomerId",
      u."membershipTier",
      u."subscriptionStatus",
      s.id as "subscriptionId",
      s.status as "subStatus"
    FROM users u
    LEFT JOIN subscriptions s ON s."userId" = u.id
    WHERE u."stripeCustomerId" IS NOT NULL
       OR u."membershipTier" != 'FREE'
       OR s.id IS NOT NULL
  `;

  console.log(`📊 Found ${usersWithData.length} users with subscription/payment data\n`);

  let created = 0;

  for (const user of usersWithData) {
    try {
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || user.name;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Map old membershipTier to new enum
      let newTier = 'Free';
      if (user.subscriptionStatus === 'ACTIVE' || user.subStatus === 'ACTIVE') {
        newTier = 'SUCCESSPlus';
      } else if (user.membershipTier === 'COLLECTIVE') {
        newTier = 'SUCCESSPlus'; // Map old COLLECTIVE to SUCCESSPlus
      } else if (user.membershipTier === 'INSIDER') {
        newTier = 'Customer'; // Map old INSIDER to Customer
      } else if (user.stripeCustomerId) {
        newTier = 'Customer';
      }

      const memberId = `member_${user.id}`;

      await prisma.$executeRaw`
        INSERT INTO members (
          id, "firstName", "lastName", email, "membershipTier", "membershipStatus",
          "stripeCustomerId", "joinDate", "createdAt", "updatedAt"
        )
        VALUES (
          ${memberId},
          ${firstName},
          ${lastName},
          ${user.email},
          ${newTier},
          'Active',
          ${user.stripeCustomerId || null},
          ${user.createdAt},
          ${user.createdAt},
          ${new Date()}
        )
        ON CONFLICT (email) DO NOTHING
      `;

      console.log(`✅ Created member: ${user.email} → ${newTier}`);
      created++;

    } catch (error: any) {
      console.error(`❌ Error creating member for ${user.email}:`, error.message);
    }
  }

  console.log(`\n✨ Pre-migration complete!`);
  console.log(`   - Members created: ${created}`);
  console.log(`\n⚠️  Next steps:`);
  console.log(`   1. Run: npx prisma db push --accept-data-loss`);
  console.log(`   2. Run: npx tsx scripts/migrate-users-to-members.ts`);
}

main()
  .catch((e) => {
    console.error('Pre-migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
