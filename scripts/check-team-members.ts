import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeamMembers() {
  try {
    const count = await prisma.team_members.count();
    console.log('Total team members:', count);

    const activeCount = await prisma.team_members.count({
      where: { isActive: true }
    });
    console.log('Active team members:', activeCount);

    if (count > 0) {
      const members = await prisma.team_members.findMany({
        orderBy: { displayOrder: 'asc' },
        take: 10
      });
      console.log('\nTeam members:');
      members.forEach(m => {
        console.log(`- ${m.name} (${m.title}) - Active: ${m.isActive}, Order: ${m.displayOrder}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamMembers();
