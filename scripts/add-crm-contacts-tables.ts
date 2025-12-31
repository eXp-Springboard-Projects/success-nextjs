import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating CRM contacts tables...');

  // Create contacts table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      company TEXT,
      custom_fields JSONB DEFAULT '{}',
      status TEXT DEFAULT 'active',
      source TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create contact_tags table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS crm_contact_tags (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(contact_id, tag)
    );
  `;

  // Create contact_lists table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS crm_contact_lists (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
      list_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(contact_id, list_name)
    );
  `;

  // Create contact_activities table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS crm_contact_activities (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create contact_notes table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS crm_contact_notes (
      id TEXT PRIMARY KEY,
      contact_id TEXT NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
      staff_id TEXT NOT NULL,
      staff_name TEXT,
      note TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create indexes for better performance
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON crm_contacts(status);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_crm_contact_tags_contact_id ON crm_contact_tags(contact_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_crm_contact_lists_contact_id ON crm_contact_lists(contact_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_crm_contact_activities_contact_id ON crm_contact_activities(contact_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_crm_contact_notes_contact_id ON crm_contact_notes(contact_id);
  `;

  console.log('✅ CRM contacts tables created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating CRM contacts tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
