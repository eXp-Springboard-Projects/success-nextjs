import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating sales sequences tables...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS sequences (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      steps JSONB DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      auto_unenroll_on_reply BOOLEAN DEFAULT true,
      total_enrolled INTEGER DEFAULT 0,
      total_completed INTEGER DEFAULT 0,
      total_replied INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS sequence_enrollments (
      id TEXT PRIMARY KEY,
      sequence_id TEXT NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      deal_id TEXT REFERENCES deals(id) ON DELETE SET NULL,
      current_step INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      last_step_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      paused_until TIMESTAMP,
      replied_at TIMESTAMP,
      bounced_at TIMESTAMP
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sequences_status ON sequences(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_sequence ON sequence_enrollments(sequence_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_contact ON sequence_enrollments(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_status ON sequence_enrollments(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_deal ON sequence_enrollments(deal_id)`;

  console.log('✅ Sales sequences tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating sequences tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
