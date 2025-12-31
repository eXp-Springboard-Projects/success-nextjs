/**
 * Migrate WordPress Pages to Local Database
 *
 * This script fetches all pages from WordPress REST API and saves them to the local database.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://www.success.com/wp-json/wp/v2';

async function fetchWordPressPages() {
  console.log('Fetching pages from WordPress...');

  try {
    const response = await fetch(`${WORDPRESS_API_URL}/pages?per_page=100&_embed`);

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    const pages = await response.json();
    console.log(`Found ${pages.length} pages`);

    return pages;
  } catch (error) {
    console.error('Error fetching WordPress pages:', error);
    throw error;
  }
}

function cleanHtml(html: string): string {
  // Remove WordPress-specific shortcodes and clean up HTML
  return html
    .replace(/\[.*?\]/g, '') // Remove shortcodes
    .trim();
}

async function migratePages() {
  console.log('Starting WordPress pages migration...\n');

  try {
    const wpPages = await fetchWordPressPages();
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const wpPage of wpPages) {
      try {
        const slug = wpPage.slug;

        // Check if page already exists by slug or wordpressId
        const existing = await prisma.pages.findFirst({
          where: {
            OR: [
              { slug: slug },
              { wordpressId: wpPage.id }
            ]
          }
        });

        if (existing) {
          console.log(`⏭️  Skipping "${wpPage.title.rendered}" - already exists`);
          skipped++;
          continue;
        }

        // Determine status
        let status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' = 'DRAFT';
        if (wpPage.status === 'publish') status = 'PUBLISHED';
        else if (wpPage.status === 'private') status = 'ARCHIVED';

        // Get SEO data from Yoast if available
        const seoTitle = wpPage.yoast_head_json?.title || wpPage.title.rendered;
        const seoDescription = wpPage.yoast_head_json?.description || '';

        // Create page in local database
        await prisma.pages.create({
          data: {
            id: uuidv4(),
            title: wpPage.title.rendered,
            slug: slug,
            content: cleanHtml(wpPage.content.rendered),
            status: status,
            publishedAt: status === 'PUBLISHED' ? new Date(wpPage.date) : null,
            seoTitle: seoTitle,
            seoDescription: seoDescription,
            wordpressId: wpPage.id,
            template: wpPage.template || 'default',
            order: wpPage.menu_order || 0,
            createdAt: new Date(wpPage.date),
            updatedAt: new Date(wpPage.modified),
          }
        });

        console.log(`✅ Imported: ${wpPage.title.rendered} (${slug})`);
        imported++;

      } catch (error) {
        console.error(`❌ Error importing page "${wpPage.title.rendered}":`, error);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Complete!');
    console.log('='.repeat(50));
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migratePages()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
