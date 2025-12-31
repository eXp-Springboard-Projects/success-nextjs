import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating automations tables...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      trigger JSONB NOT NULL,
      steps JSONB DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      total_enrolled INTEGER DEFAULT 0,
      total_completed INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS automation_enrollments (
      id TEXT PRIMARY KEY,
      automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      current_step INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      last_step_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS automation_logs (
      id TEXT PRIMARY KEY,
      automation_id TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
      enrollment_id TEXT NOT NULL REFERENCES automation_enrollments(id) ON DELETE CASCADE,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      step_index INTEGER NOT NULL,
      action TEXT NOT NULL,
      result TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_automation_enrollments_automation ON automation_enrollments(automation_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_automation_enrollments_contact ON automation_enrollments(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_automation_enrollments_status ON automation_enrollments(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_automation_logs_enrollment ON automation_logs(enrollment_id)`;

  console.log('✅ Automations tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating automations tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
