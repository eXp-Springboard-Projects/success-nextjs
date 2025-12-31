/**
 * Test WordPress Import (100 Posts)
 *
 * Runs a test import of 100 posts to verify everything works
 * before doing the full 2,000+ post import
 *
 * Usage:
 *   node scripts/test-import.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Test configuration
const TEST_LIMIT = 100;
const BACKUP_ENABLED = true;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verify database connection
async function verifyDatabase() {
  log('\n🔍 Verifying database connection...', 'blue');
  try {
    await prisma.$connect();
    log('✅ Database connection successful', 'green');
    return true;
  } catch (error) {
    log('❌ Database connection failed: ' + error.message, 'red');
    return false;
  }
}

// Check if tables exist
async function checkTables() {
  log('\n🔍 Checking database schema...', 'blue');

  const requiredTables = ['User', 'Post', 'Page', 'Category', 'Tag', 'Media'];
  const missingTables = [];

  for (const table of requiredTables) {
    try {
      await prisma[table.toLowerCase()].findFirst();
      log(`   ✓ ${table} table exists`, 'green');
    } catch (error) {
      log(`   ✗ ${table} table missing`, 'red');
      missingTables.push(table);
    }
  }

  if (missingTables.length > 0) {
    log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`, 'yellow');
    log('   Run: npx prisma db push', 'yellow');
    return false;
  }

  log('✅ All required tables exist', 'green');
  return true;
}

// Get current record counts
async function getRecordCounts() {
  const counts = {
    users: await prisma.user.count(),
    posts: await prisma.post.count(),
    pages: await prisma.page.count(),
    categories: await prisma.category.count(),
    tags: await prisma.tag.count(),
    media: await prisma.media.count(),
  };
  return counts;
}

// Display record counts
function displayCounts(counts, label) {
  log(`\n${label}:`, 'bright');
  log(`   Users:      ${counts.users}`, 'blue');
  log(`   Posts:      ${counts.posts}`, 'blue');
  log(`   Pages:      ${counts.pages}`, 'blue');
  log(`   Categories: ${counts.categories}`, 'blue');
  log(`   Tags:       ${counts.tags}`, 'blue');
  log(`   Media:      ${counts.media}`, 'blue');
}

// Backup current data
async function backupData() {
  if (!BACKUP_ENABLED) {
    log('\n⏭️  Backup skipped (disabled)', 'yellow');
    return null;
  }

  log('\n💾 Creating backup...', 'blue');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(__dirname, `backup-${timestamp}.json`);

    const backup = {
      timestamp,
      users: await prisma.user.findMany(),
      posts: await prisma.post.findMany({ include: { categories: true, tags: true } }),
      pages: await prisma.page.findMany(),
      categories: await prisma.category.findMany(),
      tags: await prisma.tag.findMany(),
      media: await prisma.media.findMany(),
    };

    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
    log(`✅ Backup created: ${backupFile}`, 'green');
    return backupFile;
  } catch (error) {
    log(`⚠️  Backup failed: ${error.message}`, 'yellow');
    return null;
  }
}

// Run test import
async function runTestImport() {
  log('\n🚀 Starting test import...', 'blue');
  log(`   Importing first ${TEST_LIMIT} posts\n`, 'yellow');

  try {
    // Run import script with --test flag
    execSync('node scripts/import-wordpress-content.js --test', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    log('\n✅ Test import completed', 'green');
    return true;
  } catch (error) {
    log('\n❌ Test import failed: ' + error.message, 'red');
    return false;
  }
}

// Verify imported data
async function verifyImport(beforeCounts) {
  log('\n🔍 Verifying imported data...', 'blue');

  const afterCounts = await getRecordCounts();
  const diff = {
    users: afterCounts.users - beforeCounts.users,
    posts: afterCounts.posts - beforeCounts.posts,
    pages: afterCounts.pages - beforeCounts.pages,
    categories: afterCounts.categories - beforeCounts.categories,
    tags: afterCounts.tags - beforeCounts.tags,
    media: afterCounts.media - beforeCounts.media,
  };

  log('\n📊 Import Results:', 'bright');
  log(`   Users:      +${diff.users}`, diff.users > 0 ? 'green' : 'yellow');
  log(`   Posts:      +${diff.posts}`, diff.posts > 0 ? 'green' : 'yellow');
  log(`   Pages:      +${diff.pages}`, diff.pages > 0 ? 'green' : 'yellow');
  log(`   Categories: +${diff.categories}`, diff.categories > 0 ? 'green' : 'yellow');
  log(`   Tags:       +${diff.tags}`, diff.tags > 0 ? 'green' : 'yellow');
  log(`   Media:      +${diff.media}`, diff.media > 0 ? 'green' : 'yellow');

  // Sample imported posts
  if (diff.posts > 0) {
    log('\n📝 Sample Imported Posts:', 'bright');
    const samplePosts = await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        categories: true,
        tags: true,
      },
    });

    samplePosts.forEach((post, idx) => {
      log(`\n   ${idx + 1}. ${post.title}`, 'blue');
      log(`      Slug:       ${post.slug}`);
      log(`      Author:     ${post.author?.name || 'Unknown'}`);
      log(`      Categories: ${post.categories.map(c => c.name).join(', ') || 'None'}`);
      log(`      Tags:       ${post.tags.map(t => t.name).join(', ') || 'None'}`);
      log(`      Status:     ${post.status}`);
    });
  }

  return diff.posts >= TEST_LIMIT * 0.9; // At least 90% success rate
}

// Main test function
async function main() {
  log('═══════════════════════════════════════', 'bright');
  log('  WordPress Import Test (100 Posts)   ', 'bright');
  log('═══════════════════════════════════════', 'bright');

  try {
    // Step 1: Verify database
    if (!await verifyDatabase()) {
      throw new Error('Database verification failed');
    }

    // Step 2: Check schema
    if (!await checkTables()) {
      throw new Error('Database schema incomplete');
    }

    // Step 3: Get before counts
    const beforeCounts = await getRecordCounts();
    displayCounts(beforeCounts, '📊 Current Database State');

    // Step 4: Backup (optional)
    const backupFile = await backupData();

    // Step 5: Run test import
    const importSuccess = await runTestImport();
    if (!importSuccess) {
      throw new Error('Import failed');
    }

    // Step 6: Verify results
    const verifySuccess = await verifyImport(beforeCounts);

    if (verifySuccess) {
      log('\n' + '═'.repeat(50), 'green');
      log('✅ TEST IMPORT SUCCESSFUL!', 'green');
      log('═'.repeat(50), 'green');
      log('\nYou can now run the full import:', 'bright');
      log('   node scripts/import-wordpress-content.js', 'yellow');
      log('\nOr verify the test data:', 'bright');
      log('   npm run dev', 'yellow');
      log('   Open http://localhost:3000/blog', 'yellow');
    } else {
      log('\n⚠️  TEST IMPORT COMPLETED WITH WARNINGS', 'yellow');
      log('   Review the results above', 'yellow');
      if (backupFile) {
        log(`   Backup available: ${backupFile}`, 'yellow');
      }
    }

  } catch (error) {
    log('\n' + '═'.repeat(50), 'red');
    log('❌ TEST IMPORT FAILED', 'red');
    log('═'.repeat(50), 'red');
    log(`\nError: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
