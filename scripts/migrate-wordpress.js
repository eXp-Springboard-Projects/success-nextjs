#!/usr/bin/env node

/**
 * WordPress to Next.js Migration Script
 *
 * This script migrates all content from WordPress REST API to PostgreSQL database.
 * It handles posts, pages, media, categories, tags, and users.
 *
 * Usage: node scripts/migrate-wordpress.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

// Configuration
const WP_API_URL = 'https://www.success.com/wp-json/wp/v2';
const MEDIA_DOWNLOAD_DIR = path.join(__dirname, '..', 'public', 'media');
const LOG_FILE = path.join(__dirname, 'migration-log.csv');
const STATE_FILE = path.join(__dirname, 'migration-state.json');
const PER_PAGE = 100; // WordPress API pagination limit

// Migration state (for resumability)
let state = {
  users: { completed: false, count: 0 },
  categories: { completed: false, count: 0 },
  tags: { completed: false, count: 0 },
  media: { completed: false, count: 0, downloaded: [] },
  posts: { completed: false, count: 0, lastPage: 0 },
  pages: { completed: false, count: 0, lastPage: 0 },
  errors: []
};

// CSV log for URL mappings (for 301 redirects)
const csvRows = [
  'type,old_url,new_url,wp_id,slug,status'
];

/**
 * Fetch data from WordPress REST API with pagination
 */
async function fetchFromWordPress(endpoint, page = 1, perPage = PER_PAGE) {
  const url = `${WP_API_URL}/${endpoint}?per_page=${perPage}&page=${page}&_embed`;
  console.log(`Fetching: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    const total = parseInt(response.headers.get('X-WP-Total') || '0');

    return { data, totalPages, total };
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    state.errors.push({ endpoint, page, error: error.message });
    return { data: [], totalPages: 0, total: 0 };
  }
}

/**
 * Download a file from URL to local filesystem
 */
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (error) => {
      fs.unlink(filepath).catch(() => {});
      reject(error);
    });
  });
}

/**
 * Save migration state to disk
 */
async function saveState() {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Load migration state from disk
 */
async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    state = { ...state, ...JSON.parse(data) };
    console.log('Resumed from previous state');
  } catch (error) {
    console.log('Starting fresh migration');
  }
}

/**
 * Migrate WordPress users to database
 */
async function migrateUsers() {
  if (state.users.completed) {
    console.log('✓ Users already migrated, skipping...');
    return;
  }

  console.log('\n📥 Migrating Users...');

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: users, totalPages } = await fetchFromWordPress('users', page);

    for (const wpUser of users) {
      try {
        // Check if user already exists
        const existing = await prisma.users.findUnique({
          where: { email: wpUser.email || `user-${wpUser.id}@imported.local` }
        });

        if (!existing) {
          await prisma.users.create({
            data: {
              email: wpUser.email || `user-${wpUser.id}@imported.local`,
              name: wpUser.name || wpUser.slug,
              password: '', // Will need to be reset
              role: 'AUTHOR',
              bio: wpUser.description || null,
              avatar: wpUser.avatar_urls?.['96'] || null,
              createdAt: new Date(wpUser.registered_date || Date.now())
            }
          });

          state.users.count++;
          console.log(`  ✓ Imported user: ${wpUser.name}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to import user ${wpUser.id}:`, error.message);
        state.errors.push({ type: 'user', id: wpUser.id, error: error.message });
      }
    }

    hasMore = page < totalPages;
    page++;
    await saveState();
  }

  state.users.completed = true;
  await saveState();
  console.log(`✓ Users migrated: ${state.users.count}`);
}

/**
 * Migrate WordPress categories
 */
async function migrateCategories() {
  if (state.categories.completed) {
    console.log('✓ Categories already migrated, skipping...');
    return;
  }

  console.log('\n📥 Migrating Categories...');

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: categories, totalPages } = await fetchFromWordPress('categories', page);

    for (const wpCat of categories) {
      try {
        const existing = await prisma.categories.findUnique({
          where: { slug: wpCat.slug }
        });

        if (!existing) {
          await prisma.categories.create({
            data: {
              name: wpCat.name,
              slug: wpCat.slug,
              description: wpCat.description || null
            }
          });

          state.categories.count++;
          console.log(`  ✓ Imported category: ${wpCat.name}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to import category ${wpCat.id}:`, error.message);
        state.errors.push({ type: 'category', id: wpCat.id, error: error.message });
      }
    }

    hasMore = page < totalPages;
    page++;
    await saveState();
  }

  state.categories.completed = true;
  await saveState();
  console.log(`✓ Categories migrated: ${state.categories.count}`);
}

/**
 * Migrate WordPress tags
 */
async function migrateTags() {
  if (state.tags.completed) {
    console.log('✓ Tags already migrated, skipping...');
    return;
  }

  console.log('\n📥 Migrating Tags...');

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: tags, totalPages } = await fetchFromWordPress('tags', page);

    for (const wpTag of tags) {
      try {
        const existing = await prisma.tags.findUnique({
          where: { slug: wpTag.slug }
        });

        if (!existing) {
          await prisma.tags.create({
            data: {
              name: wpTag.name,
              slug: wpTag.slug
            }
          });

          state.tags.count++;
          console.log(`  ✓ Imported tag: ${wpTag.name}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to import tag ${wpTag.id}:`, error.message);
        state.errors.push({ type: 'tag', id: wpTag.id, error: error.message });
      }
    }

    hasMore = page < totalPages;
    page++;
    await saveState();
  }

  state.tags.completed = true;
  await saveState();
  console.log(`✓ Tags migrated: ${state.tags.count}`);
}

/**
 * Migrate WordPress media library
 */
async function migrateMedia() {
  if (state.media.completed) {
    console.log('✓ Media already migrated, skipping...');
    return;
  }

  console.log('\n📥 Migrating Media...');

  // Create media directory if it doesn't exist
  await fs.mkdir(MEDIA_DOWNLOAD_DIR, { recursive: true });

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: mediaItems, totalPages } = await fetchFromWordPress('media', page);

    for (const wpMedia of mediaItems) {
      try {
        if (state.media.downloaded.includes(wpMedia.id)) {
          continue; // Already processed
        }

        const sourceUrl = wpMedia.source_url;
        const filename = path.basename(sourceUrl.split('?')[0]);
        const filepath = path.join(MEDIA_DOWNLOAD_DIR, filename);

        // Download file
        console.log(`  Downloading: ${filename}`);
        await downloadFile(sourceUrl, filepath);

        // Save to database
        await prisma.media.create({
          data: {
            filename: filename,
            url: `/media/${filename}`,
            mimeType: wpMedia.mime_type,
            size: wpMedia.media_details?.filesize || 0,
            width: wpMedia.media_details?.width || null,
            height: wpMedia.media_details?.height || null,
            alt: wpMedia.alt_text || null,
            uploadedBy: 'wordpress-import'
          }
        });

        state.media.downloaded.push(wpMedia.id);
        state.media.count++;
        console.log(`  ✓ Imported media: ${filename}`);
      } catch (error) {
        console.error(`  ✗ Failed to import media ${wpMedia.id}:`, error.message);
        state.errors.push({ type: 'media', id: wpMedia.id, error: error.message });
      }
    }

    hasMore = page < totalPages;
    page++;
    await saveState();
  }

  state.media.completed = true;
  await saveState();
  console.log(`✓ Media migrated: ${state.media.count}`);
}

/**
 * Migrate WordPress posts
 */
async function migratePosts() {
  if (state.posts.completed) {
    console.log('✓ Posts already migrated, skipping...');
    return;
  }

  console.log('\n📥 Migrating Posts...');

  let page = state.posts.lastPage || 1;
  let hasMore = true;

  while (hasMore) {
    const { data: posts, totalPages } = await fetchFromWordPress('posts', page);

    for (const wpPost of posts) {
      try {
        // Find author
        const author = await prisma.users.findFirst({
          where: { email: { contains: 'imported' } }
        });

        if (!author) {
          console.error('  ✗ No author found, skipping post');
          continue;
        }

        // Check if post exists
        const existing = await prisma.posts.findUnique({
          where: { slug: wpPost.slug }
        });

        if (existing) continue;

        // Get categories
        const categoryIds = [];
        if (wpPost.categories && wpPost.categories.length > 0) {
          const cats = await prisma.categories.findMany({
            where: { id: { in: wpPost.categories.map(String) } }
          });
          categoryIds.push(...cats.map(c => c.id));
        }

        // Get tags
        const tagIds = [];
        if (wpPost.tags && wpPost.tags.length > 0) {
          const tags = await prisma.tags.findMany({
            where: { id: { in: wpPost.tags.map(String) } }
          });
          tagIds.push(...tags.map(t => t.id));
        }

        // Featured image
        const featuredImage = wpPost._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;

        // Create post
        const newPost = await prisma.posts.create({
          data: {
            title: wpPost.title.rendered,
            slug: wpPost.slug,
            content: wpPost.content.rendered,
            excerpt: wpPost.excerpt?.rendered || null,
            featuredImage: featuredImage,
            status: wpPost.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            authorId: author.id,
            publishedAt: wpPost.date ? new Date(wpPost.date) : null,
            seoTitle: wpPost.yoast_head_json?.title || null,
            seoDescription: wpPost.yoast_head_json?.description || null,
            categories: {
              connect: categoryIds.map(id => ({ id }))
            },
            tags: {
              connect: tagIds.map(id => ({ id }))
            }
          }
        });

        // Log URL mapping
        const oldUrl = wpPost.link;
        const newUrl = `https://success.com/blog/${wpPost.slug}`;
        csvRows.push(`post,${oldUrl},${newUrl},${wpPost.id},${wpPost.slug},${wpPost.status}`);

        state.posts.count++;
        console.log(`  ✓ Imported post: ${wpPost.title.rendered}`);
      } catch (error) {
        console.error(`  ✗ Failed to import post ${wpPost.id}:`, error.message);
        state.errors.push({ type: 'post', id: wpPost.id, error: error.message });
      }
    }

    state.posts.lastPage = page;
    hasMore = page < totalPages;
    page++;
    await saveState();
  }

  state.posts.completed = true;
  await saveState();
  console.log(`✓ Posts migrated: ${state.posts.count}`);
}

/**
 * Migrate WordPress pages
 */
async function migratePages() {
  if (state.pages.completed) {
    console.log('✓ Pages already migrated, skipping...');
    return;
  }

  console.log('\n📥 Migrating Pages...');

  let page = state.pages.lastPage || 1;
  let hasMore = true;

  while (hasMore) {
    const { data: pages, totalPages } = await fetchFromWordPress('pages', page);

    for (const wpPage of pages) {
      try {
        const existing = await prisma.pages.findUnique({
          where: { slug: wpPage.slug }
        });

        if (existing) continue;

        await prisma.pages.create({
          data: {
            title: wpPage.title.rendered,
            slug: wpPage.slug,
            content: wpPage.content.rendered,
            status: wpPage.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
            publishedAt: wpPage.date ? new Date(wpPage.date) : null,
            seoTitle: wpPage.yoast_head_json?.title || null,
            seoDescription: wpPage.yoast_head_json?.description || null
          }
        });

        // Log URL mapping
        const oldUrl = wpPage.link;
        const newUrl = `https://success.com/${wpPage.slug}`;
        csvRows.push(`page,${oldUrl},${newUrl},${wpPage.id},${wpPage.slug},${wpPage.status}`);

        state.pages.count++;
        console.log(`  ✓ Imported page: ${wpPage.title.rendered}`);
      } catch (error) {
        console.error(`  ✗ Failed to import page ${wpPage.id}:`, error.message);
        state.errors.push({ type: 'page', id: wpPage.id, error: error.message });
      }
    }

    state.pages.lastPage = page;
    hasMore = page < totalPages;
    page++;
    await saveState();
  }

  state.pages.completed = true;
  await saveState();
  console.log(`✓ Pages migrated: ${state.pages.count}`);
}

/**
 * Save CSV log file
 */
async function saveCsvLog() {
  await fs.writeFile(LOG_FILE, csvRows.join('\n'));
  console.log(`\n✓ URL mapping saved to: ${LOG_FILE}`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting WordPress to Next.js Migration\n');
  console.log(`Source: ${WP_API_URL}`);
  console.log(`Media Download Path: ${MEDIA_DOWNLOAD_DIR}\n`);

  await loadState();

  try {
    await migrateUsers();
    await migrateCategories();
    await migrateTags();
    await migrateMedia();
    await migratePosts();
    await migratePages();
    await saveCsvLog();

    console.log('\n✅ Migration Complete!');
    console.log(`\nSummary:`);
    console.log(`  Users: ${state.users.count}`);
    console.log(`  Categories: ${state.categories.count}`);
    console.log(`  Tags: ${state.tags.count}`);
    console.log(`  Media: ${state.media.count}`);
    console.log(`  Posts: ${state.posts.count}`);
    console.log(`  Pages: ${state.pages.count}`);
    console.log(`  Errors: ${state.errors.length}`);

    if (state.errors.length > 0) {
      console.log(`\n⚠️  ${state.errors.length} errors occurred during migration`);
      console.log(`Check migration-state.json for details`);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await saveState();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main();
