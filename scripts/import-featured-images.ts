

const prisma = new PrismaClient();

async function importFeaturedImages() {
  try {
    // Get all WordPress posts (IDs starting with "post_wp_")
    const wpPosts = await prisma.posts.findMany({
      where: {
        id: { startsWith: 'post_wp_' },
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        slug: true,
        title: true,
        featuredImage: true
      }
    });

    console.log(`Found ${wpPosts.length} WordPress posts`);

    let updated = 0;
    let skipped = 0;

    for (const post of wpPosts) {
      // Extract WordPress post ID from our ID (e.g., "post_wp_91375" -> "91375")
      const wpId = post.id.replace('post_wp_', '');

      try {
        // Fetch from WordPress API
        const response = await fetch(`https://www.success.com/wp-json/wp/v2/posts/${wpId}?_embed`);

        if (!response.ok) {
          console.log(`  ❌ Could not fetch post ${wpId}: ${response.statusText}`);
          skipped++;
          continue;
        }

        const wpPost = await response.json();
        const featuredImageUrl = wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url;

        if (featuredImageUrl) {
          await prisma.posts.update({
            where: { id: post.id },
            data: { featuredImage: featuredImageUrl }
          });

          console.log(`  ✓ Updated ${post.slug}`);
          updated++;
        } else {
          console.log(`  ⊘ No image for ${post.slug}`);
          skipped++;
        }

        // Rate limit: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.log(`  ❌ Error fetching ${wpId}:`, error instanceof Error ? error.message : error);
        skipped++;
      }
    }

    console.log(`\n✅ Updated ${updated} posts with images`);
    console.log(`⊘ Skipped ${skipped} posts`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importFeaturedImages();
