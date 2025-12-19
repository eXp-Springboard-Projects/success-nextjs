import { prisma } from '../lib/prisma';

async function deleteTestPages() {
  try {
    // Delete the test pages
    const result = await prisma.$executeRaw`
      DELETE FROM pages
      WHERE id IN ('cmgmsgq2y0000k004rrmdjava', 'page_1765997054142_uwv30f6ty')
    `;

    console.log(`✅ Deleted ${result} test pages`);

    // Verify deletion
    const remaining = await prisma.$queryRaw<any[]>`
      SELECT id, slug, title
      FROM pages
      WHERE slug LIKE '%test%' OR slug LIKE '%TEST%'
         OR title LIKE '%test%' OR title LIKE '%TEST%'
    `;

    console.log(`Remaining test pages: ${remaining.length}`);
    if (remaining.length > 0) {
      console.log(JSON.stringify(remaining, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestPages();
