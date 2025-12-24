/**
 * Get all staff members from the database
 */



const prisma = new PrismaClient();

async function getStaffList() {
  console.log('🔍 Fetching all staff members...\n');

  const staff = await prisma.users.findMany({
    where: {
      OR: [
        { role: 'EDITOR' },
        { role: 'AUTHOR' },
        { role: 'ADMIN' },
        { role: 'SUPER_ADMIN' },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 Found ${staff.length} staff members:\n`);

  staff.forEach((member, i) => {
    console.log(`${i + 1}. ${member.name || 'No name'}`);
    console.log(`   Email: ${member.email}`);
    console.log(`   Role: ${member.role}`);
    console.log(`   Active: ${member.isActive ? 'Yes' : 'No'}`);
    console.log(`   Created: ${member.createdAt.toLocaleDateString()}\n`);
  });

  // Get count by role
  const roleStats = {
    SUPER_ADMIN: staff.filter(s => s.role === 'SUPER_ADMIN').length,
    ADMIN: staff.filter(s => s.role === 'ADMIN').length,
    EDITOR: staff.filter(s => s.role === 'EDITOR').length,
    AUTHOR: staff.filter(s => s.role === 'AUTHOR').length,
  };

  console.log('\n📈 Staff by Role:');
  console.log(`Super Admins: ${roleStats.SUPER_ADMIN}`);
  console.log(`Admins: ${roleStats.ADMIN}`);
  console.log(`Editors: ${roleStats.EDITOR}`);
  console.log(`Authors: ${roleStats.AUTHOR}`);

  await prisma.$disconnect();
}

getStaffList();
