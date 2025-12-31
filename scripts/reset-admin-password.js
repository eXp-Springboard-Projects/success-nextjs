const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const email = 'admin@success.com';
    const newPassword = 'ChangeMe123!'; // Change this to your desired password

    console.log('Looking for user:', email);

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found:', email);
      console.log('\nCreating new admin user...');

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const newUser = await prisma.users.create({
        data: {
          email,
          password: hashedPassword,
          name: 'Admin',
          role: 'ADMIN',
        },
      });

      console.log('✓ Admin user created successfully!');
      console.log('Email:', email);
      console.log('Password:', newPassword);
      console.log('\nPlease change this password after logging in.');
    } else {
      console.log('User found! Updating password...');

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.users.update({
        where: { email },
        data: { password: hashedPassword },
      });

      console.log('✓ Password updated successfully!');
      console.log('Email:', email);
      console.log('Password:', newPassword);
      console.log('\nYou can now log in with these credentials.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
