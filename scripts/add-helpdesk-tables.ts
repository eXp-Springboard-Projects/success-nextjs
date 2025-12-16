import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating Help Desk tables...');

  // Create tickets table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      visible_id SERIAL UNIQUE,
      contact_id TEXT REFERENCES crm_contacts(id) ON DELETE SET NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      category TEXT,
      assigned_to TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP
    );
  `;

  // Create ticket_messages table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      message TEXT NOT NULL,
      attachments JSONB DEFAULT '[]',
      is_internal BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create ticket_categories table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS ticket_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      default_assignee TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Insert default categories
  await prisma.$executeRaw`
    INSERT INTO ticket_categories (id, name, description)
    VALUES
      ('cat_billing', 'Billing', 'Billing and payment related issues'),
      ('cat_subscription', 'Subscription', 'Subscription management and changes'),
      ('cat_access', 'Access', 'Login and access issues'),
      ('cat_technical', 'Technical', 'Technical support and bugs'),
      ('cat_general', 'General', 'General inquiries')
    ON CONFLICT (name) DO NOTHING;
  `;

  // Create indexes
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON tickets(contact_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
  `;

  console.log('✅ Help Desk tables created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating Help Desk tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
