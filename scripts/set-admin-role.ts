

const prisma = new PrismaClient();

async function setAdminRole() {
  try {
    // Update admin@success.com to have ADMIN role
    const user = await prisma.users.update({
      where: { email: 'admin@success.com' },
      data: { role: 'ADMIN' },
    });

    console.log('✅ Admin role set successfully for:', user.email);
    console.log('User details:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole();
