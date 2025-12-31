import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating Contacts CRM tables...');

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
      total_emails_sent INTEGER DEFAULT 0,
      total_opens INTEGER DEFAULT 0,
      total_clicks INTEGER DEFAULT 0,
      last_email_sent TIMESTAMP,
      last_email_opened TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create contact_tags table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contact_tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3b82f6',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create contact_tag_assignments table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contact_tag_assignments (
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (contact_id, tag_id)
    )
  `;

  // Create contact_lists table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contact_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      type TEXT DEFAULT 'static',
      filters JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create contact_list_members table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS contact_list_members (
      contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      list_id TEXT NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (contact_id, list_id)
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

  // Create indexes
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contacts_email_status ON contacts(email_status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_tags_name ON contact_tags(name)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact ON contact_tag_assignments(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag ON contact_tag_assignments(tag_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_lists_type ON contact_lists(type)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_list_members_contact ON contact_list_members(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_list_members_list ON contact_list_members(list_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_activities_contact ON contact_activities(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_contact_notes_contact ON contact_notes(contact_id)`;

  console.log('✅ Contacts CRM tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating Contacts CRM tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
