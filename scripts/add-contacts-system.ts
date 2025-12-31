import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating Contacts system tables...');

  // Create contacts table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      visible_id SERIAL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      company TEXT,
      source TEXT,
      custom_fields JSONB DEFAULT '{}',
      email_status TEXT DEFAULT 'subscribed',
      tags TEXT[] DEFAULT ARRAY[]::TEXT[],
      lists TEXT[] DEFAULT ARRAY[]::TEXT[],
      total_emails_sent INTEGER DEFAULT 0,
      total_opens INTEGER DEFAULT 0,
      total_clicks INTEGER DEFAULT 0,
      last_email_sent TIMESTAMP,
      last_email_opened TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create contact_activities table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contact_activities (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create contact_notes table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contact_notes (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      staff_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create email_preferences table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_preferences (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      unsubscribed BOOLEAN DEFAULT false,
      opt_in_marketing BOOLEAN DEFAULT true,
      opt_in_transactional BOOLEAN DEFAULT true,
      unsubscribe_reason TEXT,
      unsubscribe_token TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create email_sends table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_sends (
      id TEXT PRIMARY KEY,
      template_id TEXT,
      contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP,
      bounced_at TIMESTAMP,
      error_message TEXT
    )
  `;

  // Create indexes
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contacts_email_status ON contacts(email_status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contacts_lists ON contacts USING GIN(lists)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_activities_contact_id ON contact_activities(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON contact_notes(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences(unsubscribe_token)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_sends_contact_id ON email_sends(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_sends_to_email ON email_sends(to_email)`;

  console.log('✅ Contacts system tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating Contacts system tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
