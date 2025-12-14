import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateRachelPassword() {
  console.log('Updating Rachel\'s password...\n');

  try {
    const hashedPassword = await bcrypt.hash('Success2025!', 10);

    await prisma.users.update({
      where: { email: 'rachel.nead@success.com' },
      data: { password: hashedPassword }
    });

    console.log('✓ Password updated successfully for rachel.nead@success.com');
    console.log('New password: Success2025!\n');

  } catch (error: any) {
    console.error('✗ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateRachelPassword();
