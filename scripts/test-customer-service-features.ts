

const prisma = new PrismaClient();

async function testFeatures() {
  console.log('🔍 TESTING CUSTOMER SERVICE FEATURES\n');

  try {
    // Test 1: Members API data
    console.log('1️⃣ Testing /admin/members');
    const membersWithPurchases = await prisma.members.count({
      where: {
        OR: [
          { totalSpent: { gt: 0 } },
          { membershipTier: { not: 'Free' } },
          {
            subscriptions: {
              some: {},
            },
          },
        ],
      },
    });
    console.log(`   ✓ Members with purchases/subscriptions: ${membersWithPurchases}`);

    // Sample member data
    const sampleMembers = await prisma.members.findMany({
      where: {
        OR: [
          { totalSpent: { gt: 0 } },
          { membershipTier: { not: 'Free' } },
        ],
      },
      take: 3,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        membershipTier: true,
        totalSpent: true,
      },
    });
    console.log('   Sample members:', JSON.stringify(sampleMembers, null, 2));

    // Test 2: Subscriptions data
    console.log('\n2️⃣ Testing /admin/subscriptions');
    const totalSubs = await prisma.subscriptions.count();
    console.log(`   ✓ Total subscriptions: ${totalSubs}`);

    if (totalSubs > 0) {
      const activeSubs = await prisma.subscriptions.count({
        where: { status: 'active' },
      });
      console.log(`   ✓ Active subscriptions: ${activeSubs}`);

      // Sample subscription
      const sampleSub = await prisma.subscriptions.findFirst({
        include: {
          member: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      console.log('   Sample subscription:', JSON.stringify(sampleSub, null, 2));
    } else {
      console.log('   ⚠️  NO SUBSCRIPTIONS DATA FOUND');
    }

    // Test 3: Tickets data
    console.log('\n3️⃣ Testing /admin/crm/tickets');
    const totalTickets = await prisma.tickets.count();
    console.log(`   ✓ Total tickets: ${totalTickets}`);

    if (totalTickets > 0) {
      const openTickets = await prisma.tickets.count({
        where: { status: 'open' },
      });
      console.log(`   ✓ Open tickets: ${openTickets}`);

      // Sample ticket
      const sampleTicket = await prisma.tickets.findFirst({
        select: {
          id: true,
          visible_id: true,
          subject: true,
          status: true,
          priority: true,
          created_at: true,
        },
      });
      console.log('   Sample ticket:', JSON.stringify(sampleTicket, null, 2));
    } else {
      console.log('   ⚠️  NO TICKETS DATA FOUND');
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Members with data: ${membersWithPurchases > 0 ? '✅ WORKS' : '❌ NO DATA'}`);
    console.log(`Subscriptions: ${totalSubs > 0 ? '✅ HAS DATA' : '❌ NO DATA'}`);
    console.log(`Tickets: ${totalTickets > 0 ? '✅ HAS DATA' : '❌ NO DATA'}`);

  } catch (error) {
    console.error('Error testing features:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeatures();
