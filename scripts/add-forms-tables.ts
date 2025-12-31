import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding forms tables...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fields JSONB NOT NULL DEFAULT '[]'::jsonb,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      "thankYouMessage" TEXT,
      "redirectUrl" TEXT,
      "listId" TEXT,
      tags TEXT[],
      "notifyEmails" TEXT[],
      status TEXT NOT NULL DEFAULT 'active',
      submissions INT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_list FOREIGN KEY ("listId") REFERENCES contact_lists(id) ON DELETE SET NULL
    );
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY,
      "formId" TEXT NOT NULL,
      "contactId" TEXT,
      data JSONB NOT NULL,
      source TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_form FOREIGN KEY ("formId") REFERENCES forms(id) ON DELETE CASCADE,
      CONSTRAINT fk_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE SET NULL
    );
  `;

  console.log('Creating indexes...');

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_forms_created ON forms("createdAt");
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions("formId");
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_form_submissions_contact ON form_submissions("contactId");
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_form_submissions_created ON form_submissions("createdAt");
  `;

  console.log('Forms tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
