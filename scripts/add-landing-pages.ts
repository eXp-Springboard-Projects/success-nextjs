import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating landing_pages table...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS landing_pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content JSONB DEFAULT '[]',
      meta_title TEXT,
      meta_description TEXT,
      status TEXT DEFAULT 'draft',
      template TEXT DEFAULT 'minimal',
      form_id TEXT,
      views INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      published_at TIMESTAMP,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug)
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status)
  `;

  console.log('✓ Landing pages table created successfully');
}

main()
  .catch((e) => {
    console.error('Error creating landing pages table:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
