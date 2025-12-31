/**
 * WordPress Migration Helper Utilities
 *
 * Collection of helper functions for WordPress content migration:
 * - Export verification
 * - Data validation
 * - Cleanup utilities
 * - Import monitoring
 *
 * Usage:
 *   node scripts/migration-helper.js <command>
 *
 * Commands:
 *   verify-export    - Verify WordPress export file
 *   validate-urls    - Validate URL mappings
 *   cleanup          - Clean up imported data (careful!)
 *   stats            - Show import statistics
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

const EXPORT_FILE = path.join(__dirname, '../wordpress-export-data.json');
const MAPPINGS_FILE = path.join(__dirname, 'url-mappings.json');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verify WordPress export file
async function verifyExport() {
  log('\n🔍 Verifying WordPress Export File\n', 'bright');

  try {
    const data = JSON.parse(await fs.readFile(EXPORT_FILE, 'utf8'));

    // Check structure
    const requiredFields = ['posts', 'pages', 'categories', 'tags', 'authors', 'media'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      log(`❌ Missing fields: ${missingFields.join(', ')}`, 'red');
      return false;
    }

    // Display counts
    log('📊 Export File Contents:', 'blue');
    log(`   Posts:      ${data.posts?.length || 0}`);
    log(`   Pages:      ${data.pages?.length || 0}`);
    log(`   Categories: ${data.categories?.length || 0}`);
    log(`   Tags:       ${data.tags?.length || 0}`);
    log(`   Authors:    ${data.authors?.length || 0}`);
    log(`   Media:      ${data.media?.length || 0}`);

    // Validate post structure
    log('\n🔍 Validating Post Structure...', 'blue');
    const samplePost = data.posts[0];
    const requiredPostFields = ['id', 'slug', 'title', 'content', 'author'];
    const missingPostFields = requiredPostFields.filter(field => !(field in samplePost));

    if (missingPostFields.length > 0) {
      log(`⚠️  Sample post missing: ${missingPostFields.join(', ')}`, 'yellow');
    } else {
      log('✅ Post structure valid', 'green');
    }

    // Check for duplicates
    log('\n🔍 Checking for Duplicates...', 'blue');
    const postSlugs = data.posts.map(p => p.slug);
    const duplicateSlugs = postSlugs.filter((slug, idx) => postSlugs.indexOf(slug) !== idx);

    if (duplicateSlugs.length > 0) {
      log(`⚠️  Found ${duplicateSlugs.length} duplicate post slugs`, 'yellow');
      log(`   Samples: ${[...new Set(duplicateSlugs)].slice(0, 5).join(', ')}`, 'yellow');
    } else {
      log('✅ No duplicate slugs', 'green');
    }

    // Check media URLs
    log('\n🔍 Checking Media URLs...', 'blue');
    const invalidMedia = data.media.filter(m => !m.source_url || !m.source_url.startsWith('http'));

    if (invalidMedia.length > 0) {
      log(`⚠️  Found ${invalidMedia.length} invalid media URLs`, 'yellow');
    } else {
      log('✅ All media URLs valid', 'green');
    }

    log('\n✅ Export file verified successfully!\n', 'green');
    return true;

  } catch (error) {
    log(`❌ Export verification failed: ${error.message}`, 'red');
    return false;
  }
}

// Validate URL mappings
async function validateUrls() {
  log('\n🔍 Validating URL Mappings\n', 'bright');

  try {
    const mappings = JSON.parse(await fs.readFile(MAPPINGS_FILE, 'utf8'));

    log(`📊 Total mappings: ${mappings.length}\n`, 'blue');

    // Check for invalid URLs
    const invalid = mappings.filter(m => !m.oldUrl || !m.newUrl);
    if (invalid.length > 0) {
      log(`❌ Found ${invalid.length} invalid mappings`, 'red');
      return false;
    }

    // Check for duplicate sources
    const sources = mappings.map(m => m.oldUrl);
    const duplicates = sources.filter((url, idx) => sources.indexOf(url) !== idx);

    if (duplicates.length > 0) {
      log(`⚠️  Found ${duplicates.length} duplicate source URLs`, 'yellow');
    }

    // Display stats
    const blogPosts = mappings.filter(m => m.newUrl.startsWith('/blog/')).length;
    const pages = mappings.filter(m => !m.newUrl.startsWith('/blog/')).length;

    log('📊 Mapping Statistics:', 'blue');
    log(`   Blog posts: ${blogPosts}`);
    log(`   Pages:      ${pages}`);
    log(`   Total:      ${mappings.length}`);

    // Sample mappings
    log('\n📋 Sample Mappings:', 'cyan');
    mappings.slice(0, 10).forEach(m => {
      const oldPath = new URL(m.oldUrl).pathname;
      log(`   ${oldPath} → ${m.newUrl}`);
    });

    log('\n✅ URL mappings validated!\n', 'green');
    return true;

  } catch (error) {
    log(`❌ URL validation failed: ${error.message}`, 'red');
    return false;
  }
}

// Show import statistics
async function showStats() {
  log('\n📊 Import Statistics\n', 'bright');

  try {
    await prisma.$connect();

    // Get counts
    const stats = {
      users: await prisma.user.count(),
      posts: await prisma.post.count(),
      publishedPosts: await prisma.post.count({ where: { status: 'PUBLISHED' } }),
      draftPosts: await prisma.post.count({ where: { status: 'DRAFT' } }),
      pages: await prisma.page.count(),
      categories: await prisma.category.count(),
      tags: await prisma.tag.count(),
      media: await prisma.media.count(),
    };

    log('📈 Database Statistics:', 'blue');
    log(`   Users:           ${stats.users}`);
    log(`   Posts (total):   ${stats.posts}`);
    log(`   - Published:     ${stats.publishedPosts}`);
    log(`   - Draft:         ${stats.draftPosts}`);
    log(`   Pages:           ${stats.pages}`);
    log(`   Categories:      ${stats.categories}`);
    log(`   Tags:            ${stats.tags}`);
    log(`   Media:           ${stats.media}`);

    // Recent posts
    log('\n📝 Recent Posts:', 'cyan');
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });

    recentPosts.forEach((post, idx) => {
      log(`   ${idx + 1}. ${post.title}`);
      log(`      Author: ${post.author?.name || 'Unknown'} | Status: ${post.status}`);
    });

    // Categories with post counts
    log('\n📁 Top Categories:', 'cyan');
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    categories.forEach((cat, idx) => {
      log(`   ${idx + 1}. ${cat.name} (${cat._count.posts} posts)`);
    });

    log('');
    return stats;

  } catch (error) {
    log(`❌ Failed to get stats: ${error.message}`, 'red');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Cleanup imported data (DANGEROUS!)
async function cleanup() {
  log('\n⚠️  CLEANUP: This will DELETE all imported data!', 'red');
  log('   Press Ctrl+C to cancel...\n', 'yellow');

  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  log('🗑️  Cleaning up...', 'yellow');

  try {
    await prisma.$connect();

    // Delete in reverse order (respecting foreign keys)
    const deleted = {
      posts: await prisma.post.deleteMany({}),
      pages: await prisma.page.deleteMany({}),
      media: await prisma.media.deleteMany({}),
      tags: await prisma.tag.deleteMany({}),
      categories: await prisma.category.deleteMany({}),
      users: await prisma.user.deleteMany({ where: { role: 'AUTHOR' } }),
    };

    log('\n🗑️  Deleted:', 'yellow');
    log(`   Posts:      ${deleted.posts.count}`);
    log(`   Pages:      ${deleted.pages.count}`);
    log(`   Media:      ${deleted.media.count}`);
    log(`   Tags:       ${deleted.tags.count}`);
    log(`   Categories: ${deleted.categories.count}`);
    log(`   Authors:    ${deleted.users.count}`);

    log('\n✅ Cleanup complete!\n', 'green');

  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main function
async function main() {
  const command = process.argv[2];

  log('═══════════════════════════════════════', 'bright');
  log('  WordPress Migration Helper Utilities  ', 'bright');
  log('═══════════════════════════════════════', 'bright');

  switch (command) {
    case 'verify-export':
      await verifyExport();
      break;

    case 'validate-urls':
      await validateUrls();
      break;

    case 'stats':
      await showStats();
      break;

    case 'cleanup':
      await cleanup();
      break;

    default:
      log('\n📖 Available Commands:\n', 'bright');
      log('   verify-export    - Verify WordPress export file', 'cyan');
      log('   validate-urls    - Validate URL mappings', 'cyan');
      log('   stats            - Show import statistics', 'cyan');
      log('   cleanup          - Clean up imported data (DANGEROUS!)', 'red');
      log('\nUsage:', 'bright');
      log('   node scripts/migration-helper.js <command>\n', 'yellow');
  }
}

main().catch(console.error);
