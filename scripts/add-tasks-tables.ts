import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating tasks table...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      due_date DATE,
      due_time TIME,
      contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      deal_id TEXT REFERENCES deals(id) ON DELETE SET NULL,
      ticket_id TEXT,
      assigned_to TEXT,
      assigned_to_name TEXT,
      completed_at TIMESTAMP,
      completed_by TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_tasks_deal ON tasks(deal_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_tasks_ticket ON tasks(ticket_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`;

  console.log('✅ Tasks table created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating tasks table:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
