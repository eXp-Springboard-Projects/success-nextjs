import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMembers() {
  try {
    console.log('=== CHECKING SUCCESS+ MEMBER COUNTS ===\n');

    // Count all members
    const totalMembers = await prisma.members.count();
    console.log('Total members in database:', totalMembers);

    // Count by membershipTier
    const successPlusCount = await prisma.members.count({
      where: { membershipTier: 'SUCCESSPlus' }
    });
    console.log('Members with membershipTier = "SUCCESSPlus":', successPlusCount);

    // Count with Active status
    const activeSuccessPlus = await prisma.members.count({
      where: {
        membershipTier: 'SUCCESSPlus',
        membershipStatus: 'Active'
      }
    });
    console.log('Active SUCCESS+ members (tier + status):', activeSuccessPlus);

    // Check distinct membership tiers
    const tiers = await prisma.$queryRaw<Array<{ membershipTier: string; count: number }>>`
      SELECT "membershipTier", COUNT(*)::int as count
      FROM members
      WHERE "membershipTier" IS NOT NULL
      GROUP BY "membershipTier"
      ORDER BY count DESC
    `;
    console.log('\n=== MEMBERSHIP TIER BREAKDOWN ===');
    tiers.forEach(t => console.log(`${t.membershipTier}: ${t.count}`));

    // Check distinct membership statuses
    const statuses = await prisma.$queryRaw<Array<{ membershipStatus: string; count: number }>>`
      SELECT "membershipStatus", COUNT(*)::int as count
      FROM members
      WHERE "membershipStatus" IS NOT NULL
      GROUP BY "membershipStatus"
      ORDER BY count DESC
    `;
    console.log('\n=== MEMBERSHIP STATUS BREAKDOWN ===');
    statuses.forEach(s => console.log(`${s.membershipStatus}: ${s.count}`));

    // Sample SUCCESS+ members
    console.log('\n=== SAMPLE SUCCESS+ MEMBERS ===');
    const sampleSuccessPlus = await prisma.members.findMany({
      where: {
        membershipTier: 'SUCCESSPlus'
      },
      take: 5,
      select: {
        id: true,
        email: true,
        membershipTier: true,
        membershipStatus: true,
        createdAt: true
      }
    });
    console.log(JSON.stringify(sampleSuccessPlus, null, 2));

    // Sample general members
    console.log('\n=== SAMPLE GENERAL MEMBERS ===');
    const sampleGeneral = await prisma.members.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        membershipTier: true,
        membershipStatus: true,
        createdAt: true
      }
    });
    console.log(JSON.stringify(sampleGeneral, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMembers();
