import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating promotions table...');

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL,
      discount_amount DECIMAL(10, 2) NOT NULL,
      min_purchase_amount DECIMAL(10, 2),
      max_discount_amount DECIMAL(10, 2),
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      expires_at TIMESTAMP,
      status TEXT DEFAULT 'active',
      description TEXT,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code)
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status)
  `;

  console.log('✓ Promotions table created successfully');
}

main()
  .catch((e) => {
    console.error('Error creating promotions table:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
