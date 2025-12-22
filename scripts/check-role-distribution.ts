import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const roles = await prisma.users.groupBy({
      by: ['role'],
      _count: true,
      where: { isActive: true }
    });

    console.log('Active users by role:');
    roles.forEach(r => {
      console.log(`  ${r.role}: ${r._count}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
