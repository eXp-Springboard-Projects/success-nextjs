import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.users.findUnique({
      where: { email: 'admin@success.com' },
    });

    if (admin) {
      console.log('✅ Admin user found:');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('Password Hash:', admin.password);
      console.log('Has Changed Password:', admin.hasChangedDefaultPassword);
      console.log('Created:', admin.createdAt);
    } else {
      console.log('❌ Admin user NOT found');
    }

    // Also check for all @success.com users
    const allUsers = await prisma.users.findMany({
      where: {
        email: {
          endsWith: '@success.com',
        },
      },
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('\n📋 All @success.com users:');
    allUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.role})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
