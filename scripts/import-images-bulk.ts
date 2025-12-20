import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importImagesBulk() {
  try {
    console.log('Fetching posts from WordPress API...');

    let updated = 0;
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const url = `https://www.success.com/wp-json/wp/v2/posts?_embed&per_page=${perPage}&page=${page}`;
      console.log(`\nFetching page ${page}...`);

      const response = await fetch(url);

      if (!response.ok) {
        console.log(`❌ Failed to fetch page ${page}: ${response.statusText}`);
        break;
      }

      const posts = await response.json();

      if (!posts || posts.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing ${posts.length} posts...`);

      for (const wpPost of posts) {
        const wpId = wpPost.id;
        const featuredImageUrl = wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url;
        const ourPostId = `post_wp_${wpId}`;

        if (featuredImageUrl) {
          try {
            await prisma.posts.update({
              where: { id: ourPostId },
              data: { featuredImage: featuredImageUrl }
            });
            updated++;
            console.log(`  ✓ Updated post_wp_${wpId}`);
          } catch (error) {
            // Post doesn't exist in our database
          }
        }
      }

      page++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✅ Updated ${updated} posts with images`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importImagesBulk();
