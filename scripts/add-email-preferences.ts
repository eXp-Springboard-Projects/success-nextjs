import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding email_preferences table...');

  // Create the table using raw SQL
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_preferences (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      "contactId" TEXT,
      unsubscribed BOOLEAN DEFAULT false,
      "optInMarketing" BOOLEAN DEFAULT true,
      "optInTransactional" BOOLEAN DEFAULT true,
      "optInNewsletter" BOOLEAN DEFAULT true,
      "unsubscribeToken" TEXT UNIQUE,
      "unsubscribeReason" TEXT,
      "unsubscribedAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL
    );
  `;

  console.log('Creating indexes...');

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences("unsubscribeToken");
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_preferences_unsubscribed ON email_preferences(unsubscribed);
  `;

  console.log('Email preferences table created successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
