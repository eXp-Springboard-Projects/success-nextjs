import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImportStats() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║        WordPress Import Statistics             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // Count categories
    const categoriesCount = await prisma.categories.count();
    const categoriesWithWpId = await prisma.categories.count({
      where: { wordpressId: { not: null } }
    });

    // Count tags
    const tagsCount = await prisma.tags.count();
    const tagsWithWpId = await prisma.tags.count({
      where: { wordpressId: { not: null } }
    });

    // Count authors (users with AUTHOR role and wordpressId)
    const authorsCount = await prisma.users.count({
      where: {
        role: 'AUTHOR',
        wordpressId: { not: null }
      }
    });

    // Count posts
    const postsCount = await prisma.posts.count();
    const postsWithWpId = await prisma.posts.count({
      where: { wordpressId: { not: null } }
    });
    const publishedPosts = await prisma.posts.count({
      where: {
        status: 'PUBLISHED',
        wordpressId: { not: null }
      }
    });

    console.log('📊 Import Results:\n');
    console.log(`Categories:`);
    console.log(`  Total: ${categoriesCount}`);
    console.log(`  From WordPress: ${categoriesWithWpId}\n`);

    console.log(`Tags:`);
    console.log(`  Total: ${tagsCount}`);
    console.log(`  From WordPress: ${tagsWithWpId}\n`);

    console.log(`Authors:`);
    console.log(`  Total WordPress Authors: ${authorsCount}\n`);

    console.log(`Posts:`);
    console.log(`  Total: ${postsCount}`);
    console.log(`  From WordPress: ${postsWithWpId}`);
    console.log(`  Published: ${publishedPosts}`);
    console.log(`  Draft: ${postsWithWpId - publishedPosts}\n`);

    // Sample recent posts
    const recentPosts = await prisma.posts.findMany({
      where: { wordpressId: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        title: true,
        publishedAt: true,
        status: true,
        users: {
          select: { name: true }
        }
      }
    });

    if (recentPosts.length > 0) {
      console.log('📰 Recent Posts:\n');
      recentPosts.forEach((post, i) => {
        console.log(`  ${i + 1}. ${post.title}`);
        console.log(`     Author: ${post.users.name} | Status: ${post.status}`);
        console.log(`     Published: ${post.publishedAt?.toLocaleDateString() || 'N/A'}\n`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImportStats();
