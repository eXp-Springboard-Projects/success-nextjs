import { prisma } from '../lib/prisma';

async function findTestPages() {
  try {
    const pages = await prisma.$queryRaw<any[]>`
      SELECT id, slug, title, status
      FROM pages
      WHERE slug LIKE '%test%' OR slug LIKE '%TEST%'
         OR title LIKE '%test%' OR title LIKE '%TEST%'
    `;

    console.log('Test pages found:');
    console.log(JSON.stringify(pages, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findTestPages();
