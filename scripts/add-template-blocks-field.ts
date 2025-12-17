import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding blocks field to email_templates table...');

  // Add blocks column to email_templates
  await prisma.$executeRaw`
    ALTER TABLE email_templates
    ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT NULL;
  `;

  console.log('✅ Blocks field added successfully!');
}

main()
  .catch((e) => {
    console.error('Error adding blocks field:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
