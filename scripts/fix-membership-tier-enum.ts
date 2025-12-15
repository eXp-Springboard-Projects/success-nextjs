import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMembershipTierEnum() {
  console.log('Fixing MembershipTier enum migration...\n');

  try {
    // Step 1: Drop the default constraint
    console.log('1. Removing default constraint...');
    await prisma.$executeRaw`
      ALTER TABLE members
      ALTER COLUMN "membershipTier" DROP DEFAULT
    `;

    // Step 2: Create new enum with all values
    console.log('2. Creating new enum type...');
    await prisma.$executeRaw`
      CREATE TYPE "MembershipTier_new" AS ENUM ('Free', 'Customer', 'SUCCESSPlus', 'VIP', 'Enterprise')
    `;

    // Step 3: Update existing data
    console.log('3. Migrating existing data...');
    await prisma.$executeRaw`
      ALTER TABLE members
      ALTER COLUMN "membershipTier" TYPE "MembershipTier_new"
      USING (
        CASE "membershipTier"::text
          WHEN 'FREE' THEN 'Free'::"MembershipTier_new"
          WHEN 'COLLECTIVE' THEN 'Customer'::"MembershipTier_new"
          WHEN 'INSIDER' THEN 'SUCCESSPlus'::"MembershipTier_new"
          WHEN 'Free' THEN 'Free'::"MembershipTier_new"
          WHEN 'Customer' THEN 'Customer'::"MembershipTier_new"
          WHEN 'SUCCESSPlus' THEN 'SUCCESSPlus'::"MembershipTier_new"
          WHEN 'VIP' THEN 'VIP'::"MembershipTier_new"
          WHEN 'Enterprise' THEN 'Enterprise'::"MembershipTier_new"
          ELSE 'Free'::"MembershipTier_new"
        END
      )
    `;

    // Step 4: Drop old enum
    console.log('4. Dropping old enum...');
    await prisma.$executeRaw`
      DROP TYPE "MembershipTier"
    `;

    // Step 5: Rename new enum to final name
    console.log('5. Renaming enum...');
    await prisma.$executeRaw`
      ALTER TYPE "MembershipTier_new" RENAME TO "MembershipTier"
    `;

    // Step 6: Re-add default constraint
    console.log('6. Re-adding default constraint...');
    await prisma.$executeRaw`
      ALTER TABLE members
      ALTER COLUMN "membershipTier" SET DEFAULT 'Free'::"MembershipTier"
    `;

    console.log('\n✅ MembershipTier enum migration complete!');
    console.log('\nNow run: npx prisma generate');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMembershipTierEnum();
