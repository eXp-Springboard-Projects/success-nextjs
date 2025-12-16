import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating sales deals tables...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS deal_stages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      "order" INTEGER NOT NULL,
      color TEXT NOT NULL,
      probability INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      company_name TEXT,
      value DECIMAL(15, 2) DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      stage_id TEXT NOT NULL REFERENCES deal_stages(id) ON DELETE RESTRICT,
      probability INTEGER DEFAULT 0,
      expected_close_date DATE,
      actual_close_date DATE,
      owner_id TEXT,
      owner_name TEXT,
      source TEXT,
      notes TEXT,
      custom_fields JSONB DEFAULT '{}',
      status TEXT DEFAULT 'open',
      lost_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS deal_activities (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON deal_activities(deal_id)`;

  console.log('✅ Sales deals tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating deals tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
