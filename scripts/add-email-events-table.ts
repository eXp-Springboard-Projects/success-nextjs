import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating email_events table...');

  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS email_events (
        id TEXT PRIMARY KEY,
        "campaignId" TEXT NOT NULL,
        "contactId" TEXT NOT NULL,
        "emailAddress" TEXT NOT NULL,
        event TEXT NOT NULL,
        "eventData" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_campaign FOREIGN KEY ("campaignId") REFERENCES campaigns(id) ON DELETE CASCADE,
        CONSTRAINT fk_contact FOREIGN KEY ("contactId") REFERENCES contacts(id) ON DELETE CASCADE
      );
    `;
    console.log('✅ Created email_events table');

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events("campaignId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_email_events_contact ON email_events("contactId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_email_events_event ON email_events(event);
    `;
    console.log('✅ Created indexes on email_events');

    // Add campaign stats fields
    await prisma.$executeRaw`
      ALTER TABLE campaigns
      ADD COLUMN IF NOT EXISTS "sentCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "deliveredCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "openedCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "clickedCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "bouncedCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "failedCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "sendErrors" JSONB;
    `;
    console.log('✅ Added campaign stats fields');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
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
