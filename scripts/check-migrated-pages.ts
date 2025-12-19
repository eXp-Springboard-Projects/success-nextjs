/**
 * Check if key pages exist in database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPages() {
  console.log('🔍 Checking for key pages in database\n');
  console.log('==========================================\n');

  const slugsToCheck = [
    'about-us',
    'magazine',
    'subscribe',
    'newsletter',
    'advertising',
    'coaching',
    'about'
  ];

  console.log('📄 CHECKING PAGES:\n');

  for (const slug of slugsToCheck) {
    const page = await prisma.pages.findFirst({
      where: { slug },
      select: {
        slug: true,
        title: true,
        status: true,
        publishedAt: true
      }
    });

    if (page) {
      const status = page.status === 'PUBLISHED' ? '✅' : '⚠️';
      console.log(`${status} /${slug}`);
      console.log(`   Title: ${page.title}`);
      console.log(`   Status: ${page.status}`);
      console.log(`   Published: ${page.publishedAt || 'Not published'}\n`);
    } else {
      console.log(`❌ /${slug} - NOT FOUND IN DATABASE\n`);
    }
  }

  await prisma.$disconnect();
}

checkPages();
