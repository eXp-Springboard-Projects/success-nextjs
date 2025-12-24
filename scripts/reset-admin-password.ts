
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const newPassword = 'SUCCESS2025!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.users.update({
      where: { email: 'admin@success.com' },
      data: {
        password: hashedPassword,
        hasChangedDefaultPassword: false, // Will be forced to change on first login
      },
    });

    console.log('✅ Password reset successful!');
    console.log('');
    console.log('='.repeat(60));
    console.log('🔑 ADMIN CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('Email:    admin@success.com');
    console.log('Password: SUCCESS2025!');
    console.log('='.repeat(60));
    console.log('');
    console.log('⚠️  You will be forced to change this password on first login');
    console.log('');
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
