import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding lead scoring system...');

  // Add leadScore column to contacts table
  await prisma.$executeRaw`
    ALTER TABLE contacts ADD COLUMN IF NOT EXISTS "leadScore" INT NOT NULL DEFAULT 0;
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_contacts_lead_score ON contacts("leadScore");
  `;

  // Create lead_scoring_rules table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS lead_scoring_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      condition JSONB,
      points INT NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('Creating indexes...');

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_lead_scoring_event ON lead_scoring_rules("eventType");
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_lead_scoring_active ON lead_scoring_rules("isActive");
  `;

  console.log('Seeding default scoring rules...');

  const defaultRules = [
    { name: 'Email Opened', eventType: 'email_opened', points: 5 },
    { name: 'Email Clicked', eventType: 'email_clicked', points: 10 },
    { name: 'Form Submitted', eventType: 'form_submitted', points: 20 },
    { name: 'Purchase', eventType: 'purchase', points: 50 },
    { name: 'Page Visited', eventType: 'page_visited', points: 3 },
    { name: 'Deal Created', eventType: 'deal_created', points: 30 },
    { name: 'Ticket Created', eventType: 'ticket_created', points: -5 },
    { name: 'Unsubscribed', eventType: 'unsubscribed', points: -50 },
  ];

  for (const rule of defaultRules) {
    await prisma.$executeRaw`
      INSERT INTO lead_scoring_rules (id, name, "eventType", points, "isActive", "createdAt", "updatedAt")
      VALUES (
        ${uuidv4()},
        ${rule.name},
        ${rule.eventType},
        ${rule.points},
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('Lead scoring system created successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
