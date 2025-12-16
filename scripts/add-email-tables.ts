import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating email templates and email sends tables...');

  // Create email_templates table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      preview_text TEXT,
      html_content TEXT NOT NULL,
      json_content JSONB DEFAULT '{}',
      category TEXT DEFAULT 'transactional',
      variables JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Update email_sends table to match new schema
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_sends (
      id TEXT PRIMARY KEY,
      template_id TEXT REFERENCES email_templates(id) ON DELETE SET NULL,
      contact_id TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      campaign_id TEXT,
      to_email TEXT NOT NULL,
      from_email TEXT,
      from_name TEXT,
      subject TEXT NOT NULL,
      status TEXT DEFAULT 'queued',
      sent_at TIMESTAMP,
      delivered_at TIMESTAMP,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP,
      bounced_at TIMESTAMP,
      failed_at TIMESTAMP,
      error_message TEXT,
      metadata JSONB DEFAULT '{}'
    )
  `;

  // Create indexes
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_sends_template ON email_sends(template_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_sends_contact ON email_sends(contact_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id)`;

  console.log('✅ Email tables created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating email tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
