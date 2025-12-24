

const prisma = new PrismaClient();

async function check() {
  try {
    // Check subscriptions table for SUCCESS+ subscriptions
    const activeSuccessPlusSubs = await prisma.subscriptions.count({
      where: {
        tier: 'SUCCESSPlus',
        status: 'active'
      }
    });
    console.log('Active SUCCESS+ subscriptions:', activeSuccessPlusSubs);

    const totalSubs = await prisma.subscriptions.count();
    console.log('Total subscriptions:', totalSubs);

    // Sample some subscriptions to see the data
    const sampleSubs = await prisma.subscriptions.findMany({
      where: { tier: 'SUCCESSPlus' },
      take: 10,
      select: {
        id: true,
        memberId: true,
        tier: true,
        status: true,
        createdAt: true
      }
    });
    console.log('\nSample SUCCESS+ subscriptions:');
    console.log(JSON.stringify(sampleSubs, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
