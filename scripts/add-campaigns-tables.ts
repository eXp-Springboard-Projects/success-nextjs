import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating email campaigns table...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      preview_text TEXT,
      template_id TEXT REFERENCES email_templates(id) ON DELETE SET NULL,
      list_id TEXT REFERENCES contact_lists(id) ON DELETE SET NULL,
      segment_filters JSONB DEFAULT '{}',
      from_email TEXT DEFAULT 'noreply@success.com',
      from_name TEXT DEFAULT 'SUCCESS Magazine',
      status TEXT DEFAULT 'draft',
      scheduled_at TIMESTAMP,
      sent_at TIMESTAMP,
      completed_at TIMESTAMP,
      total_recipients INTEGER DEFAULT 0,
      total_sent INTEGER DEFAULT 0,
      total_delivered INTEGER DEFAULT 0,
      total_opened INTEGER DEFAULT 0,
      total_clicked INTEGER DEFAULT 0,
      total_bounced INTEGER DEFAULT 0,
      total_unsubscribed INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_campaigns_template ON email_campaigns(template_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_campaigns_list ON email_campaigns(list_id)`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON email_campaigns(scheduled_at)`;

  console.log('✅ Email campaigns table created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating campaigns table:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
