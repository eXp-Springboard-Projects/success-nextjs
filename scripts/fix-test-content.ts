/**
 * Fix test posts and pages - set them to PUBLISHED status
 */



const prisma = new PrismaClient();

async function fixTestContent() {
  console.log('🔧 Fixing Test Content\n');
  console.log('==============================\n');

  try {
    // Find and update test posts
    console.log('📝 Updating TEST posts to PUBLISHED...');
    const testPosts = await prisma.posts.findMany({
      where: {
        title: { contains: 'TEST', mode: 'insensitive' },
        status: 'DRAFT'
      }
    });

    if (testPosts.length > 0) {
      for (const post of testPosts) {
        await prisma.posts.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: post.publishedAt || new Date()
          }
        });
        console.log(`✅ Published post: "${post.title}" (${post.slug})`);
      }
    } else {
      console.log('  No test posts found in DRAFT status');
    }

    // Find and update test pages
    console.log('\n📄 Updating TEST pages to PUBLISHED...');
    const testPages = await prisma.pages.findMany({
      where: {
        title: { contains: 'TEST', mode: 'insensitive' },
        status: 'DRAFT'
      }
    });

    if (testPages.length > 0) {
      for (const page of testPages) {
        await prisma.pages.update({
          where: { id: page.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: page.publishedAt || new Date()
          }
        });
        console.log(`✅ Published page: "${page.title}" (${page.slug})`);
      }
    } else {
      console.log('  No test pages found in DRAFT status');
    }

    console.log('\n✅ Done! Test content has been published.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTestContent();
