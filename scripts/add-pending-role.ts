import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding PENDING role to UserRole enum...');

  try {
    // Add PENDING to the UserRole enum
    await prisma.$executeRaw`
      ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PENDING';
    `;

    console.log('✓ Successfully added PENDING role');
  } catch (error) {
    console.error('Error adding PENDING role:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
