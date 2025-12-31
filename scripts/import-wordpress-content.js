/**
 * WordPress Content Import Script
 *
 * Imports WordPress export data into Prisma database with:
 * - Batch processing for 2,000+ posts
 * - Progress tracking
 * - Media file downloading to cloud storage
 * - Category, tag, and author relationships
 *
 * Usage:
 *   node scripts/import-wordpress-content.js [--test] [--batch-size=50]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 50;
const TEST_MODE = process.argv.includes('--test');
const TEST_LIMIT = 100;
const EXPORT_FILE = path.join(__dirname, '../wordpress-export-data.json');
const MEDIA_DIR = path.join(__dirname, '../public/media/wordpress');

// Progress tracking
class ProgressTracker {
  constructor(total, label) {
    this.total = total;
    this.current = 0;
    this.label = label;
    this.startTime = Date.now();
  }

  update(increment = 1) {
    this.current += increment;
    const percent = ((this.current / this.total) * 100).toFixed(1);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const rate = (this.current / elapsed).toFixed(2);

    process.stdout.write(
      `\r${this.label}: [${this.current}/${this.total}] ${percent}% | ${elapsed}s | ${rate}/s`
    );

    if (this.current >= this.total) {
      console.log('\n✓ Complete');
    }
  }
}

// Download media file
async function downloadMedia(url, filename) {
  const protocol = url.startsWith('https') ? https : http;
  const fullPath = path.join(MEDIA_DIR, filename);

  // Ensure directory exists
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  return new Promise((resolve, reject) => {
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = require('fs').createWriteStream(fullPath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(fullPath);
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Extract slug from WordPress URL
function extractSlug(url) {
  if (!url) return null;
  const match = url.match(/\/([^\/]+)\/?$/);
  return match ? match[1] : null;
}

// Import authors
async function importAuthors(authors) {
  console.log('\n📝 Importing Authors...');
  const progress = new ProgressTracker(authors.length, 'Authors');

  const authorMap = new Map();

  for (const author of authors) {
    try {
      const userData = {
        email: author.email || `${author.slug}@success.com`,
        name: author.name,
        username: author.slug,
        role: 'AUTHOR',
        emailVerified: new Date(),
      };

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });

      authorMap.set(author.id, user.id);
      progress.update();
    } catch (error) {
      console.error(`\nError importing author ${author.name}:`, error.message);
    }
  }

  return authorMap;
}

// Import categories
async function importCategories(categories) {
  console.log('\n📁 Importing Categories...');
  const progress = new ProgressTracker(categories.length, 'Categories');

  const categoryMap = new Map();

  for (const category of categories) {
    try {
      const cat = await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description || null,
        },
        create: {
          slug: category.slug,
          name: category.name,
          description: category.description || null,
        },
      });

      categoryMap.set(category.id, cat.id);
      progress.update();
    } catch (error) {
      console.error(`\nError importing category ${category.name}:`, error.message);
    }
  }

  return categoryMap;
}

// Import tags
async function importTags(tags) {
  console.log('\n🏷️  Importing Tags...');
  const progress = new ProgressTracker(tags.length, 'Tags');

  const tagMap = new Map();

  for (const tag of tags) {
    try {
      const t = await prisma.tag.upsert({
        where: { slug: tag.slug },
        update: {
          name: tag.name,
        },
        create: {
          slug: tag.slug,
          name: tag.name,
        },
      });

      tagMap.set(tag.id, t.id);
      progress.update();
    } catch (error) {
      console.error(`\nError importing tag ${tag.name}:`, error.message);
    }
  }

  return tagMap;
}

// Import media (batch processing)
async function importMedia(mediaItems) {
  console.log('\n🖼️  Importing Media...');
  const progress = new ProgressTracker(mediaItems.length, 'Media');

  const mediaMap = new Map();

  for (let i = 0; i < mediaItems.length; i += BATCH_SIZE) {
    const batch = mediaItems.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (media) => {
      try {
        const filename = path.basename(new URL(media.source_url).pathname);
        let localPath = null;

        // Download media file
        try {
          localPath = await downloadMedia(media.source_url, filename);
          localPath = localPath.replace(/\\/g, '/').replace(/.*\/public/, '');
        } catch (downloadError) {
          console.warn(`\nFailed to download ${media.source_url}: ${downloadError.message}`);
        }

        const mediaRecord = await prisma.media.create({
          data: {
            url: media.source_url,
            localPath: localPath,
            altText: media.alt_text || media.title?.rendered || null,
            caption: media.caption?.rendered || null,
            mimeType: media.mime_type,
            width: media.media_details?.width || null,
            height: media.media_details?.height || null,
          },
        });

        mediaMap.set(media.id, mediaRecord.id);
        progress.update();
      } catch (error) {
        console.error(`\nError importing media ${media.id}:`, error.message);
        progress.update();
      }
    }));
  }

  return mediaMap;
}

// Import posts (batch processing)
async function importPosts(posts, authorMap, categoryMap, tagMap, mediaMap) {
  console.log('\n📰 Importing Posts...');
  const progress = new ProgressTracker(posts.length, 'Posts');

  const urlMappings = [];

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (post) => {
      try {
        const authorId = authorMap.get(post.author);
        if (!authorId) {
          console.warn(`\nSkipping post ${post.id}: Author not found`);
          progress.update();
          return;
        }

        // Get featured image
        let featuredImageId = null;
        if (post.featured_media && mediaMap.has(post.featured_media)) {
          featuredImageId = mediaMap.get(post.featured_media);
        }

        // Extract excerpt (strip HTML)
        let excerpt = post.excerpt?.rendered || '';
        excerpt = excerpt.replace(/<[^>]*>/g, '').trim();
        if (excerpt.length > 500) {
          excerpt = excerpt.substring(0, 497) + '...';
        }

        // Create post
        const postData = {
          title: post.title?.rendered || 'Untitled',
          slug: post.slug,
          content: post.content?.rendered || '',
          excerpt: excerpt,
          status: post.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
          authorId: authorId,
          featuredImageId: featuredImageId,
          publishedAt: post.date ? new Date(post.date) : new Date(),
          updatedAt: post.modified ? new Date(post.modified) : new Date(),
        };

        const createdPost = await prisma.post.create({
          data: postData,
        });

        // Connect categories
        if (post.categories && post.categories.length > 0) {
          const categoryIds = post.categories
            .map(catId => categoryMap.get(catId))
            .filter(id => id !== undefined);

          if (categoryIds.length > 0) {
            await prisma.post.update({
              where: { id: createdPost.id },
              data: {
                categories: {
                  connect: categoryIds.map(id => ({ id })),
                },
              },
            });
          }
        }

        // Connect tags
        if (post.tags && post.tags.length > 0) {
          const tagIds = post.tags
            .map(tagId => tagMap.get(tagId))
            .filter(id => id !== undefined);

          if (tagIds.length > 0) {
            await prisma.post.update({
              where: { id: createdPost.id },
              data: {
                tags: {
                  connect: tagIds.map(id => ({ id })),
                },
              },
            });
          }
        }

        // Store URL mapping for redirects
        urlMappings.push({
          oldUrl: post.link,
          newUrl: `/blog/${post.slug}`,
          wpId: post.id,
          slug: post.slug,
        });

        progress.update();
      } catch (error) {
        console.error(`\nError importing post ${post.id}:`, error.message);
        progress.update();
      }
    }));
  }

  return urlMappings;
}

// Import pages
async function importPages(pages, mediaMap) {
  console.log('\n📄 Importing Pages...');
  const progress = new ProgressTracker(pages.length, 'Pages');

  const urlMappings = [];

  for (const page of pages) {
    try {
      // Get featured image
      let featuredImageId = null;
      if (page.featured_media && mediaMap.has(page.featured_media)) {
        featuredImageId = mediaMap.get(page.featured_media);
      }

      const pageData = {
        title: page.title?.rendered || 'Untitled',
        slug: page.slug,
        content: page.content?.rendered || '',
        status: page.status === 'publish' ? 'PUBLISHED' : 'DRAFT',
        featuredImageId: featuredImageId,
        publishedAt: page.date ? new Date(page.date) : new Date(),
        updatedAt: page.modified ? new Date(page.modified) : new Date(),
      };

      await prisma.page.create({
        data: pageData,
      });

      // Store URL mapping
      urlMappings.push({
        oldUrl: page.link,
        newUrl: `/${page.slug}`,
        wpId: page.id,
        slug: page.slug,
      });

      progress.update();
    } catch (error) {
      console.error(`\nError importing page ${page.id}:`, error.message);
      progress.update();
    }
  }

  return urlMappings;
}

// Main import function
async function main() {
  console.log('🚀 WordPress Content Import Script');
  console.log('===================================\n');

  if (TEST_MODE) {
    console.log(`⚠️  TEST MODE: Importing first ${TEST_LIMIT} posts only\n`);
  }

  try {
    // Read export file
    console.log('📂 Reading export file...');
    const exportData = JSON.parse(await fs.readFile(EXPORT_FILE, 'utf8'));

    console.log('\n📊 Export Data Summary:');
    console.log(`   Authors: ${exportData.authors?.length || 0}`);
    console.log(`   Categories: ${exportData.categories?.length || 0}`);
    console.log(`   Tags: ${exportData.tags?.length || 0}`);
    console.log(`   Media: ${exportData.media?.length || 0}`);
    console.log(`   Posts: ${exportData.posts?.length || 0}`);
    console.log(`   Pages: ${exportData.pages?.length || 0}`);

    // In test mode, limit posts
    if (TEST_MODE && exportData.posts) {
      exportData.posts = exportData.posts.slice(0, TEST_LIMIT);
      console.log(`\n   Limited to: ${exportData.posts.length} posts (test mode)`);
    }

    // Import in order: authors -> categories -> tags -> media -> posts -> pages
    const authorMap = await importAuthors(exportData.authors || []);
    const categoryMap = await importCategories(exportData.categories || []);
    const tagMap = await importTags(exportData.tags || []);
    const mediaMap = await importMedia(exportData.media || []);
    const postMappings = await importPosts(
      exportData.posts || [],
      authorMap,
      categoryMap,
      tagMap,
      mediaMap
    );
    const pageMappings = await importPages(exportData.pages || [], mediaMap);

    // Save URL mappings
    const allMappings = [...postMappings, ...pageMappings];
    const mappingFile = path.join(__dirname, 'url-mappings.json');
    await fs.writeFile(mappingFile, JSON.stringify(allMappings, null, 2));

    console.log(`\n\n✅ Import Complete!`);
    console.log(`   URL mappings saved to: ${mappingFile}`);
    console.log(`   Total URLs mapped: ${allMappings.length}`);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
