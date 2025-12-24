

const prisma = new PrismaClient();

async function checkTeamMembers() {
  try {
    const count = await prisma.team_members.count();
    console.log('Team members in database:', count);

    const members = await prisma.team_members.findMany({
      select: { name: true, title: true },
      take: 5,
    });

    console.log('\nFirst 5 team members:');
    members.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name} - ${m.title}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkTeamMembers();
