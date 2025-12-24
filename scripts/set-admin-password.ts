/**
 * Set admin@success.com password to Success2025!
 */


import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setAdminPassword() {
  try {
    const email = 'admin@success.com';
    const newPassword = 'Success2025!';

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user
    const user = await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
        hasChangedDefaultPassword: true, // Skip forced password change
        updatedAt: new Date(),
      },
    });

    console.log('✅ Admin password updated successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`Role: ${user.role}`);
    console.log(`\n🔑 Login at: https://success-nextjs.vercel.app/admin/login`);
    console.log(`\n✅  Password change will NOT be required on login.`);
  } catch (error: any) {
    console.error('❌ Error updating password:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminPassword();
