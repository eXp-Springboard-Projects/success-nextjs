import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding featuredImage and featuredImageAlt fields to pages and videos tables...');

  try {
    // Add fields to pages table
    await prisma.$executeRaw`
      ALTER TABLE pages
      ADD COLUMN IF NOT EXISTS "featuredImage" TEXT,
      ADD COLUMN IF NOT EXISTS "featuredImageAlt" TEXT;
    `;
    console.log('✅ Added featuredImage fields to pages table');

    // Add fields to videos table
    await prisma.$executeRaw`
      ALTER TABLE videos
      ADD COLUMN IF NOT EXISTS "featuredImage" TEXT,
      ADD COLUMN IF NOT EXISTS "featuredImageAlt" TEXT;
    `;
    console.log('✅ Added featuredImage fields to videos table');

    // Also add seoTitle and seoDescription to videos if missing
    await prisma.$executeRaw`
      ALTER TABLE videos
      ADD COLUMN IF NOT EXISTS "seoTitle" TEXT,
      ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
    `;
    console.log('✅ Added SEO fields to videos table');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
