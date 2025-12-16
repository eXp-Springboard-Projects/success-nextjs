import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding email infrastructure tables and fields...');

  // Add email-related fields to crm_contacts
  await prisma.$executeRaw`
    ALTER TABLE crm_contacts
    ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'subscribed',
    ADD COLUMN IF NOT EXISTS last_email_sent TIMESTAMP,
    ADD COLUMN IF NOT EXISTS last_email_opened TIMESTAMP,
    ADD COLUMN IF NOT EXISTS total_emails_sent INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_opens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;
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
    );
  `;

  // Create email_sends table for tracking
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_sends (
      id TEXT PRIMARY KEY,
      contact_id TEXT REFERENCES crm_contacts(id) ON DELETE SET NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      template_id TEXT,
      campaign_id TEXT,
      status TEXT DEFAULT 'sent',
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP,
      bounced_at TIMESTAMP,
      complained_at TIMESTAMP,
      metadata JSONB DEFAULT '{}'
    );
  `;

  // Create indexes
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_preferences_email ON email_preferences(email);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_preferences_token ON email_preferences(unsubscribe_token);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_sends_contact_id ON email_sends(contact_id);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_sends_recipient ON email_sends(recipient_email);
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
  `;

  console.log('✅ Email infrastructure tables created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating email infrastructure tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
