/**
 * Check recently created posts and pages
 */



const prisma = new PrismaClient();

async function checkContent() {
  console.log('🔍 Checking Posts and Pages\n');
  console.log('==============================\n');

  try {
    // Get latest posts
    console.log('📝 LATEST POSTS (Last 5):');
    console.log('------------------------');
    const posts = await prisma.posts.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      }
    });

    if (posts.length === 0) {
      console.log('❌ No posts found\n');
    } else {
      posts.forEach((post, i) => {
        console.log(`${i + 1}. ${post.title}`);
        console.log(`   Slug: ${post.slug}`);
        console.log(`   Status: ${post.status}`);
        console.log(`   Published: ${post.publishedAt || 'Not published'}`);
        console.log(`   Created: ${post.createdAt}\n`);
      });
    }

    // Get latest pages
    console.log('\n📄 LATEST PAGES (Last 5):');
    console.log('------------------------');
    const pages = await prisma.pages.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      }
    });

    if (pages.length === 0) {
      console.log('❌ No pages found\n');
    } else {
      pages.forEach((page, i) => {
        console.log(`${i + 1}. ${page.title}`);
        console.log(`   Slug: ${page.slug}`);
        console.log(`   Status: ${page.status}`);
        console.log(`   Published: ${page.publishedAt || 'Not published'}`);
        console.log(`   Created: ${page.createdAt}\n`);
      });
    }

    // Count by status
    console.log('\n📊 POST STATUS COUNTS:');
    console.log('---------------------');
    const postStatuses = await prisma.posts.groupBy({
      by: ['status'],
      _count: true,
    });
    postStatuses.forEach(s => {
      console.log(`${s.status}: ${s._count}`);
    });

    console.log('\n📊 PAGE STATUS COUNTS:');
    console.log('---------------------');
    const pageStatuses = await prisma.pages.groupBy({
      by: ['status'],
      _count: true,
    });
    pageStatuses.forEach(s => {
      console.log(`${s.status}: ${s._count}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkContent();
