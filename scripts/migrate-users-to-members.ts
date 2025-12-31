import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration Script: Separate Users from Members
 *
 * This script migrates the existing user/customer data to the new architecture:
 * - Users = Platform access (admin, editors, staff)
 * - Members = Customers who have purchased/subscribed
 *
 * LOGIC:
 * 1. Find all users with purchases/subscriptions → Create Member records
 * 2. Keep platform-only users as Users only
 * 3. Link dual-role people (admin + customer) via user.memberId
 * 4. Migrate all subscription/order data to point to members
 */

async function main() {
  console.log('🚀 Starting User/Member migration...\n');

  // Step 1: Get all existing users
  const allUsers = await prisma.users.findMany({
    include: {
      subscriptions: true,
    },
  });

  console.log(`📊 Found ${allUsers.length} total users\n`);

  let platformOnlyCount = 0;
  let customersCreated = 0;
  let dualRoleCount = 0;

  for (const user of allUsers) {
    const hasSubscription = !!user.subscriptions;
    const stripeCustomerId = (user as any).stripeCustomerId; // Old field

    // Determine if this user is a customer (has made purchases or has subscription)
    const isCustomer = hasSubscription || stripeCustomerId;

    if (!isCustomer) {
      // Platform-only user (admin/editor/staff with no purchases)
      console.log(`👤 Platform user only: ${user.email} (${user.role})`);
      platformOnlyCount++;
      continue;
    }

    // This user is a customer - create Member record
    console.log(`💰 Creating member for: ${user.email}`);

    try {
      // Split name into first/last
      const nameParts = user.name.split(' ');
      const firstName = nameParts[0] || user.name;
      const lastName = nameParts.slice(1).join(' ') || '';

      // Determine membership tier
      let membershipTier = 'Free';
      if (user.subscriptions) {
        if (user.subscriptions.status === 'ACTIVE') {
          membershipTier = 'SUCCESSPlus';
        } else {
          membershipTier = 'Customer'; // Had subscription but cancelled
        }
      } else if (stripeCustomerId) {
        membershipTier = 'Customer'; // Has made purchases
      }

      // Create Member record
      const member = await prisma.members.create({
        data: {
          id: `member_${user.id}`, // Create predictable ID for linking
          firstName,
          lastName,
          email: user.email,
          membershipTier: membershipTier as any,
          membershipStatus: 'Active',
          stripeCustomerId: stripeCustomerId || null,
          joinDate: user.createdAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          totalSpent: 0, // Will be calculated from transactions
          lifetimeValue: 0,
        },
      });

      customersCreated++;

      // Check if user is ALSO a platform user (admin/editor)
      const isPlatformUser = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR'].includes(user.role);

      if (isPlatformUser) {
        // Dual role - link user to member
        await prisma.users.update({
          where: { id: user.id },
          data: {
            memberId: member.id,
          },
        });
        console.log(`  ✅ Dual role: ${user.email} is both ${user.role} AND ${membershipTier}`);
        dualRoleCount++;
      } else {
        // Customer only - no platform access needed
        console.log(`  ✅ Customer only: ${user.email} → ${membershipTier}`);
      }

      // Migrate subscription to point to member
      if (user.subscriptions) {
        await prisma.subscriptions.update({
          where: { id: user.subscriptions.id },
          data: {
            memberId: member.id,
          },
        });
        console.log(`  📧 Migrated subscription`);
      }

    } catch (error: any) {
      console.error(`  ❌ Error migrating ${user.email}:`, error.message);
    }
  }

  // Step 2: Migrate all orders to members
  console.log('\n📦 Migrating orders to members...');
  const orders = await prisma.orders.findMany();

  for (const order of orders) {
    const userId = (order as any).userId;
    if (!userId) continue;

    const memberId = `member_${userId}`;

    try {
      await prisma.orders.update({
        where: { id: order.id },
        data: {
          memberId: memberId,
        },
      });
    } catch (error: any) {
      console.error(`  ❌ Error migrating order ${order.orderNumber}:`, error.message);
    }
  }

  console.log(`\n✨ Migration complete!\n`);
  console.log(`📊 Summary:`);
  console.log(`   - Platform-only users: ${platformOnlyCount}`);
  console.log(`   - Members created: ${customersCreated}`);
  console.log(`   - Dual-role (admin + customer): ${dualRoleCount}`);
  console.log(`   - Orders migrated: ${orders.length}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
