/**
 * Import Sample Content from WordPress for Staff Testing
 *
 * Imports 100-200 recent posts from SUCCESS Magazine
 * Includes categories, tags, authors, and media
 *
 * Usage:
 *   npx tsx scripts/import-sample-content.ts
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import https from 'https';

const prisma = new PrismaClient();

const WP_API_BASE = 'https://www.success.com/wp-json/wp/v2';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  slug: string;
  content: { rendered: string };
  excerpt: { rendered: string };
  status: string;
  date: string;
  modified: string;
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      description: string;
      avatar_urls: { [key: string]: string };
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
      media_details: {
        width: number;
        height: number;
        file: string;
      };
    }>;
  };
}

/**
 * Fetch data from WordPress API
 */
async function fetchWordPress(endpoint: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(`${WP_API_BASE}/${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Import categories from WordPress
 */
async function importCategories() {
  console.log('\n📁 Importing categories...');

  const wpCategories = await fetchWordPress('categories?per_page=100');
  let imported = 0;

  for (const cat of wpCategories) {
    try {
      await prisma.categories.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: cat.description || null,
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          name: cat.name,
          slug: cat.slug,
          description: cat.description || null,
          createdAt: new Date(cat.date || Date.now()),
          updatedAt: new Date(),
        },
      });
      imported++;
    } catch (error) {
      console.error(`  ⚠️  Failed to import category ${cat.name}:`, error);
    }
  }

  console.log(`  ✅ Imported ${imported} categories`);
  return imported;
}

/**
 * Import tags from WordPress
 */
async function importTags() {
  console.log('\n🏷️  Importing tags...');

  const wpTags = await fetchWordPress('tags?per_page=100');
  let imported = 0;

  for (const tag of wpTags) {
    try {
      await prisma.tags.upsert({
        where: { slug: tag.slug },
        update: {
          name: tag.name,
          updatedAt: new Date(),
        },
        create: {
          id: randomUUID(),
          name: tag.name,
          slug: tag.slug,
          createdAt: new Date(tag.date || Date.now()),
          updatedAt: new Date(),
        },
      });
      imported++;
    } catch (error) {
      console.error(`  ⚠️  Failed to import tag ${tag.name}:`, error);
    }
  }

  console.log(`  ✅ Imported ${imported} tags`);
  return imported;
}

/**
 * Import authors from WordPress
 */
async function importAuthors() {
  console.log('\n👤 Importing authors...');

  const wpAuthors = await fetchWordPress('users?per_page=50');
  let imported = 0;

  for (const author of wpAuthors) {
    try {
      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: `${author.slug}@success.com` }
      });

      if (!existingUser) {
        await prisma.users.create({
          data: {
            id: randomUUID(),
            name: author.name,
            email: `${author.slug}@success.com`,
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // "password" hashed
            role: 'AUTHOR',
            bio: author.description || null,
            avatar: author.avatar_urls?.['96'] || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: true,
          },
        });
        imported++;
      }
    } catch (error) {
      console.error(`  ⚠️  Failed to import author ${author.name}:`, error);
    }
  }

  console.log(`  ✅ Imported ${imported} new authors`);
  return imported;
}

/**
 * Download and import media file
 */
async function importMediaFile(mediaUrl: string, altText: string): Promise<string | null> {
  try {
    // For now, we'll just store the WordPress URL
    // In production, you'd download and re-upload to your CDN
    const media = await prisma.media.create({
      data: {
        id: randomUUID(),
        filename: mediaUrl.split('/').pop() || 'image.jpg',
        url: mediaUrl,
        mimeType: 'image/jpeg',
        size: 0,
        alt: altText || '',
        uploadedBy: 'system',
        createdAt: new Date(),
      },
    });
    return media.url;
  } catch (error) {
    console.error(`  ⚠️  Failed to import media:`, error);
    return null;
  }
}

/**
 * Import posts from WordPress
 */
async function importPosts(limit: number = 200) {
  console.log(`\n📝 Importing up to ${limit} posts...`);

  let imported = 0;
  let page = 1;
  const perPage = 50;

  while (imported < limit) {
    const wpPosts: WordPressPost[] = await fetchWordPress(
      `posts?per_page=${perPage}&page=${page}&_embed=true&status=publish`
    );

    if (wpPosts.length === 0) break;

    for (const wpPost of wpPosts) {
      if (imported >= limit) break;

      try {
        // Get or create author
        const wpAuthor = wpPost._embedded?.author?.[0];
        let authorId: string;

        if (wpAuthor) {
          const author = await prisma.users.findUnique({
            where: { email: `${wpAuthor.name.toLowerCase().replace(/\s+/g, '-')}@success.com` }
          });

          if (author) {
            authorId = author.id;
          } else {
            // Create author if doesn't exist
            const newAuthor = await prisma.users.create({
              data: {
                id: randomUUID(),
                name: wpAuthor.name,
                email: `author${wpAuthor.id}@success.com`,
                password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
                role: 'AUTHOR',
                bio: wpAuthor.description || null,
                createdAt: new Date(),
                updatedAt: new Date(),
                emailVerified: true,
              },
            });
            authorId = newAuthor.id;
          }
        } else {
          // Use system user as fallback
          const systemUser = await prisma.users.findFirst({
            where: { role: 'ADMIN' }
          });
          authorId = systemUser?.id || randomUUID();
        }

        // Handle featured image
        let featuredImage: string | null = null;
        let featuredImageAlt: string | null = null;
        const wpMedia = wpPost._embedded?.['wp:featuredmedia']?.[0];
        if (wpMedia) {
          featuredImage = wpMedia.source_url;
          featuredImageAlt = wpMedia.alt_text || '';
        }

        // Check if post already exists
        const existingPost = await prisma.posts.findUnique({
          where: { slug: wpPost.slug }
        });

        if (!existingPost) {
          // Create post
          const post = await prisma.posts.create({
            data: {
              id: randomUUID(),
              title: wpPost.title.rendered.replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"'),
              slug: wpPost.slug,
              content: wpPost.content.rendered,
              excerpt: wpPost.excerpt?.rendered || null,
              featuredImage,
              featuredImageAlt,
              status: wpPost.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
              authorId,
              publishedAt: new Date(wpPost.date),
              createdAt: new Date(wpPost.date),
              updatedAt: new Date(wpPost.modified),
              readTime: Math.ceil(wpPost.content.rendered.split(/\s+/).length / 200),
            },
          });

          // Connect categories
          const wpCategories = wpPost._embedded?.['wp:term']?.[0] || [];
          for (const wpCat of wpCategories) {
            const category = await prisma.categories.findUnique({
              where: { slug: wpCat.slug }
            });
            if (category) {
              await prisma.posts.update({
                where: { id: post.id },
                data: {
                  categories: {
                    connect: { id: category.id }
                  }
                }
              });
            }
          }

          // Connect tags
          const wpTags = wpPost._embedded?.['wp:term']?.[1] || [];
          for (const wpTag of wpTags) {
            const tag = await prisma.tags.findUnique({
              where: { slug: wpTag.slug }
            });
            if (tag) {
              await prisma.posts.update({
                where: { id: post.id },
                data: {
                  tags: {
                    connect: { id: tag.id }
                  }
                }
              });
            }
          }

          imported++;
          if (imported % 10 === 0) {
            console.log(`  📝 Imported ${imported} posts...`);
          }
        }
      } catch (error) {
        console.error(`  ⚠️  Failed to import post ${wpPost.title.rendered}:`, error);
      }
    }

    page++;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`  ✅ Imported ${imported} posts`);
  return imported;
}

/**
 * Main import function
 */
async function main() {
  console.log('🚀 Sample Content Import Started');
  console.log('=================================\n');
  console.log('Source: SUCCESS Magazine (www.success.com)');
  console.log('Target: Local database\n');

  const startTime = Date.now();
  const stats = {
    categories: 0,
    tags: 0,
    authors: 0,
    posts: 0,
  };

  try {
    // Import in order
    stats.categories = await importCategories();
    stats.tags = await importTags();
    stats.authors = await importAuthors();
    stats.posts = await importPosts(200); // Import up to 200 posts

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Import Complete!');
    console.log('=================================');
    console.log(`Duration: ${duration}s\n`);
    console.log('Imported:');
    console.log(`  - ${stats.categories} categories`);
    console.log(`  - ${stats.tags} tags`);
    console.log(`  - ${stats.authors} authors`);
    console.log(`  - ${stats.posts} posts`);
    console.log('\n📊 Database is now populated with sample content for staff testing.');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
main();
