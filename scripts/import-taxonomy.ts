import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count: number;
  parent?: number;
}

interface WPTag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count: number;
}

async function main() {
  const baseUrl = process.env.WORDPRESS_API_URL || 'https://www.success.com/wp-json/wp/v2';

  console.log('Importing categories and tags from WordPress...\n');

  // Import Categories
  console.log('=== Importing Categories ===\n');
  let categoriesImported = 0;

  try {
    const categoriesRes = await fetch(`${baseUrl}/categories?per_page=100`);
    const categories: WPCategory[] = await categoriesRes.json();

    for (const cat of categories) {
      // Skip uncategorized or empty categories
      if (cat.slug === 'uncategorized' || cat.count === 0) {
        continue;
      }

      // Check if exists
      const existing = await prisma.categories.findUnique({
        where: { slug: cat.slug },
      });

      if (existing) {
        console.log(`⚠️  Skipping existing category: ${cat.name}`);
        continue;
      }

      // Create category
      await prisma.categories.create({
        data: {
          id: nanoid(),
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          wordpressId: cat.id,
        },
      });

      console.log(`✓ Imported category: ${cat.name} (${cat.count} posts)`);
      categoriesImported++;
    }
  } catch (error) {
    console.error('Error importing categories:', error);
  }

  // Import Tags
  console.log('\n=== Importing Tags ===\n');
  let tagsImported = 0;

  try {
    const tagsRes = await fetch(`${baseUrl}/tags?per_page=100`);
    const tags: WPTag[] = await tagsRes.json();

    for (const tag of tags) {
      // Skip tags with no posts
      if (tag.count === 0) {
        continue;
      }

      // Check if exists
      const existing = await prisma.tags.findUnique({
        where: { slug: tag.slug },
      });

      if (existing) {
        console.log(`⚠️  Skipping existing tag: ${tag.name}`);
        continue;
      }

      // Create tag
      await prisma.tags.create({
        data: {
          id: nanoid(),
          name: tag.name,
          slug: tag.slug,
          description: tag.description || null,
          wordpressId: tag.id,
        },
      });

      console.log(`✓ Imported tag: ${tag.name} (${tag.count} posts)`);
      tagsImported++;
    }
  } catch (error) {
    console.error('Error importing tags:', error);
  }

  console.log('\n=== Import Complete ===');
  console.log(`✓ Categories imported: ${categoriesImported}`);
  console.log(`✓ Tags imported: ${tagsImported}`);

  // Show totals
  const categoryCount = await prisma.categories.count();
  const tagCount = await prisma.tags.count();

  console.log(`\nTotal in database:`);
  console.log(`  Categories: ${categoryCount}`);
  console.log(`  Tags: ${tagCount}`);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
