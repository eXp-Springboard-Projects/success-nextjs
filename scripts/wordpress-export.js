/**
 * WordPress Content Export Script
 *
 * This script connects to WordPress database and exports all content to JSON
 *
 * SETUP:
 * 1. Get WordPress database credentials from hosting panel
 * 2. Set environment variables:
 *    - WP_DB_HOST (e.g., localhost or mysql.example.com)
 *    - WP_DB_NAME (e.g., wp_success)
 *    - WP_DB_USER (e.g., wp_user)
 *    - WP_DB_PASSWORD
 *    - WP_DB_PREFIX (default: wp_)
 *
 * USAGE:
 * node scripts/wordpress-export.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// WordPress Database Configuration
const WP_CONFIG = {
  host: process.env.WP_DB_HOST || 'localhost',
  user: process.env.WP_DB_USER || 'root',
  password: process.env.WP_DB_PASSWORD || '',
  database: process.env.WP_DB_NAME || 'wordpress',
  port: process.env.WP_DB_PORT || 3306,
};

const WP_PREFIX = process.env.WP_DB_PREFIX || 'wp_';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'wordpress-export');

async function connectDatabase() {
  try {
    console.log('🔌 Connecting to WordPress database...');
    console.log(`   Host: ${WP_CONFIG.host}`);
    console.log(`   Database: ${WP_CONFIG.database}`);
    console.log(`   User: ${WP_CONFIG.user}`);

    const connection = await mysql.createConnection(WP_CONFIG);
    console.log('✅ Connected successfully!\n');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n📝 To fix this:');
    console.error('1. Get WordPress database credentials from your hosting panel');
    console.error('2. Set environment variables:');
    console.error('   export WP_DB_HOST="your-host"');
    console.error('   export WP_DB_NAME="your-database"');
    console.error('   export WP_DB_USER="your-username"');
    console.error('   export WP_DB_PASSWORD="your-password"');
    console.error('\nOr create a .env file with these values\n');
    process.exit(1);
  }
}

async function getCounts(connection) {
  console.log('📊 Counting WordPress content...\n');

  const queries = {
    posts: `SELECT COUNT(*) as count FROM ${WP_PREFIX}posts WHERE post_type = 'post' AND post_status = 'publish'`,
    drafts: `SELECT COUNT(*) as count FROM ${WP_PREFIX}posts WHERE post_type = 'post' AND post_status = 'draft'`,
    pages: `SELECT COUNT(*) as count FROM ${WP_PREFIX}posts WHERE post_type = 'page' AND post_status = 'publish'`,
    videos: `SELECT COUNT(*) as count FROM ${WP_PREFIX}posts WHERE post_type = 'video' AND post_status = 'publish'`,
    podcasts: `SELECT COUNT(*) as count FROM ${WP_PREFIX}posts WHERE post_type = 'podcast' AND post_status = 'publish'`,
    media: `SELECT COUNT(*) as count FROM ${WP_PREFIX}posts WHERE post_type = 'attachment'`,
    categories: `SELECT COUNT(*) as count FROM ${WP_PREFIX}terms t INNER JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id = tt.term_id WHERE tt.taxonomy = 'category'`,
    tags: `SELECT COUNT(*) as count FROM ${WP_PREFIX}terms t INNER JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id = tt.term_id WHERE tt.taxonomy = 'post_tag'`,
    authors: `SELECT COUNT(DISTINCT post_author) as count FROM ${WP_PREFIX}posts WHERE post_status = 'publish'`,
    comments: `SELECT COUNT(*) as count FROM ${WP_PREFIX}comments WHERE comment_approved = '1'`,
  };

  const counts = {};
  for (const [key, query] of Object.entries(queries)) {
    const [rows] = await connection.execute(query);
    counts[key] = rows[0].count;
  }

  console.log('CONTENT SUMMARY:');
  console.log(`  Published Posts:    ${counts.posts.toLocaleString()}`);
  console.log(`  Draft Posts:        ${counts.drafts.toLocaleString()}`);
  console.log(`  Pages:              ${counts.pages.toLocaleString()}`);
  console.log(`  Videos:             ${counts.videos.toLocaleString()}`);
  console.log(`  Podcasts:           ${counts.podcasts.toLocaleString()}`);
  console.log(`  Media Files:        ${counts.media.toLocaleString()}`);
  console.log(`  Categories:         ${counts.categories.toLocaleString()}`);
  console.log(`  Tags:               ${counts.tags.toLocaleString()}`);
  console.log(`  Authors:            ${counts.authors.toLocaleString()}`);
  console.log(`  Comments:           ${counts.comments.toLocaleString()}`);
  console.log('');

  return counts;
}

async function exportPosts(connection) {
  console.log('📝 Exporting posts...');

  const query = `
    SELECT
      p.ID,
      p.post_author,
      p.post_date,
      p.post_date_gmt,
      p.post_content,
      p.post_title,
      p.post_excerpt,
      p.post_status,
      p.post_name as slug,
      p.post_modified,
      p.post_modified_gmt,
      p.post_type,
      u.user_login,
      u.user_email,
      u.display_name as author_name
    FROM ${WP_PREFIX}posts p
    LEFT JOIN ${WP_PREFIX}users u ON p.post_author = u.ID
    WHERE p.post_type = 'post'
    AND p.post_status IN ('publish', 'draft', 'pending')
    ORDER BY p.post_date DESC
  `;

  const [rows] = await connection.execute(query);
  console.log(`   Found ${rows.length} posts`);

  // Get post meta, categories, and tags for each post
  for (let post of rows) {
    // Get post meta
    const [meta] = await connection.execute(
      `SELECT meta_key, meta_value FROM ${WP_PREFIX}postmeta WHERE post_id = ?`,
      [post.ID]
    );
    post.meta = {};
    meta.forEach(m => {
      post.meta[m.meta_key] = m.meta_value;
    });

    // Get categories
    const [categories] = await connection.execute(
      `SELECT t.term_id, t.name, t.slug
       FROM ${WP_PREFIX}terms t
       INNER JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id = tt.term_id
       INNER JOIN ${WP_PREFIX}term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
       WHERE tr.object_id = ? AND tt.taxonomy = 'category'`,
      [post.ID]
    );
    post.categories = categories;

    // Get tags
    const [tags] = await connection.execute(
      `SELECT t.term_id, t.name, t.slug
       FROM ${WP_PREFIX}terms t
       INNER JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id = tt.term_id
       INNER JOIN ${WP_PREFIX}term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
       WHERE tr.object_id = ? AND tt.taxonomy = 'post_tag'`,
      [post.ID]
    );
    post.tags = tags;

    // Get featured image
    const [thumbnail] = await connection.execute(
      `SELECT meta_value FROM ${WP_PREFIX}postmeta WHERE post_id = ? AND meta_key = '_thumbnail_id'`,
      [post.ID]
    );
    if (thumbnail.length > 0) {
      const [image] = await connection.execute(
        `SELECT guid FROM ${WP_PREFIX}posts WHERE ID = ?`,
        [thumbnail[0].meta_value]
      );
      post.featured_image = image.length > 0 ? image[0].guid : null;
    } else {
      post.featured_image = null;
    }
  }

  return rows;
}

async function exportPages(connection) {
  console.log('📄 Exporting pages...');

  const query = `
    SELECT
      p.ID,
      p.post_author,
      p.post_date,
      p.post_content,
      p.post_title,
      p.post_excerpt,
      p.post_status,
      p.post_name as slug,
      p.post_modified,
      u.display_name as author_name
    FROM ${WP_PREFIX}posts p
    LEFT JOIN ${WP_PREFIX}users u ON p.post_author = u.ID
    WHERE p.post_type = 'page'
    AND p.post_status = 'publish'
    ORDER BY p.post_title
  `;

  const [rows] = await connection.execute(query);
  console.log(`   Found ${rows.length} pages`);

  // Get post meta for each page
  for (let page of rows) {
    const [meta] = await connection.execute(
      `SELECT meta_key, meta_value FROM ${WP_PREFIX}postmeta WHERE post_id = ?`,
      [page.ID]
    );
    page.meta = {};
    meta.forEach(m => {
      page.meta[m.meta_key] = m.meta_value;
    });
  }

  return rows;
}

async function exportMedia(connection) {
  console.log('🖼️  Exporting media...');

  const query = `
    SELECT
      p.ID,
      p.post_title,
      p.post_name as slug,
      p.guid as url,
      p.post_mime_type,
      p.post_date
    FROM ${WP_PREFIX}posts p
    WHERE p.post_type = 'attachment'
    ORDER BY p.post_date DESC
  `;

  const [rows] = await connection.execute(query);
  console.log(`   Found ${rows.length} media files`);

  // Get media metadata
  for (let media of rows) {
    const [meta] = await connection.execute(
      `SELECT meta_value FROM ${WP_PREFIX}postmeta WHERE post_id = ? AND meta_key = '_wp_attachment_metadata'`,
      [media.ID]
    );
    if (meta.length > 0) {
      try {
        media.metadata = meta[0].meta_value;
      } catch (e) {
        media.metadata = null;
      }
    }
  }

  return rows;
}

async function exportCategories(connection) {
  console.log('📁 Exporting categories...');

  const query = `
    SELECT
      t.term_id,
      t.name,
      t.slug,
      tt.description,
      tt.count
    FROM ${WP_PREFIX}terms t
    INNER JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id = tt.term_id
    WHERE tt.taxonomy = 'category'
    ORDER BY t.name
  `;

  const [rows] = await connection.execute(query);
  console.log(`   Found ${rows.length} categories`);
  return rows;
}

async function exportTags(connection) {
  console.log('🏷️  Exporting tags...');

  const query = `
    SELECT
      t.term_id,
      t.name,
      t.slug,
      tt.count
    FROM ${WP_PREFIX}terms t
    INNER JOIN ${WP_PREFIX}term_taxonomy tt ON t.term_id = tt.term_id
    WHERE tt.taxonomy = 'post_tag'
    ORDER BY t.name
  `;

  const [rows] = await connection.execute(query);
  console.log(`   Found ${rows.length} tags`);
  return rows;
}

async function exportAuthors(connection) {
  console.log('👤 Exporting authors...');

  const query = `
    SELECT DISTINCT
      u.ID,
      u.user_login,
      u.user_email,
      u.user_nicename,
      u.display_name,
      u.user_registered
    FROM ${WP_PREFIX}users u
    INNER JOIN ${WP_PREFIX}posts p ON u.ID = p.post_author
    WHERE p.post_status = 'publish'
    ORDER BY u.display_name
  `;

  const [rows] = await connection.execute(query);
  console.log(`   Found ${rows.length} authors`);

  // Get author meta
  for (let author of rows) {
    const [meta] = await connection.execute(
      `SELECT meta_key, meta_value FROM ${WP_PREFIX}usermeta WHERE user_id = ?`,
      [author.ID]
    );
    author.meta = {};
    meta.forEach(m => {
      author.meta[m.meta_key] = m.meta_value;
    });
  }

  return rows;
}

async function exportComments(connection) {
  console.log('💬 Exporting comments...');

  const query = `
    SELECT
      comment_ID,
      comment_post_ID,
      comment_author,
      comment_author_email,
      comment_author_url,
      comment_date,
      comment_content,
      comment_approved,
      comment_parent
    FROM ${WP_PREFIX}comments
    WHERE comment_approved = '1'
    ORDER BY comment_date DESC
    LIMIT 10000
  `;

  const [rows] = await connection.execute(query);
  console.log(`   Found ${rows.length} approved comments`);
  return rows;
}

async function exportCustomPostTypes(connection, postType) {
  console.log(`🎥 Exporting ${postType}s...`);

  const query = `
    SELECT
      p.ID,
      p.post_author,
      p.post_date,
      p.post_content,
      p.post_title,
      p.post_excerpt,
      p.post_status,
      p.post_name as slug,
      p.post_modified,
      u.display_name as author_name
    FROM ${WP_PREFIX}posts p
    LEFT JOIN ${WP_PREFIX}users u ON p.post_author = u.ID
    WHERE p.post_type = ?
    AND p.post_status = 'publish'
    ORDER BY p.post_date DESC
  `;

  const [rows] = await connection.execute(query, [postType]);
  console.log(`   Found ${rows.length} ${postType}s`);

  // Get post meta
  for (let item of rows) {
    const [meta] = await connection.execute(
      `SELECT meta_key, meta_value FROM ${WP_PREFIX}postmeta WHERE post_id = ?`,
      [item.ID]
    );
    item.meta = {};
    meta.forEach(m => {
      item.meta[m.meta_key] = m.meta_value;
    });
  }

  return rows;
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   WordPress Content Export Script                     ║');
  console.log('║   SUCCESS Magazine → Next.js Migration                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const connection = await connectDatabase();

  try {
    // Get content counts
    const counts = await getCounts(connection);

    // Create output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📂 Export directory: ${OUTPUT_DIR}\n`);

    // Export all content
    const exportData = {
      exported_at: new Date().toISOString(),
      wordpress_info: {
        prefix: WP_PREFIX,
        host: WP_CONFIG.host,
        database: WP_CONFIG.database,
      },
      counts,
      posts: await exportPosts(connection),
      pages: await exportPages(connection),
      media: await exportMedia(connection),
      categories: await exportCategories(connection),
      tags: await exportTags(connection),
      authors: await exportAuthors(connection),
      comments: await exportComments(connection),
      videos: await exportCustomPostTypes(connection, 'video'),
      podcasts: await exportCustomPostTypes(connection, 'podcast'),
    };

    // Save to JSON file
    const outputFile = path.join(OUTPUT_DIR, 'wordpress-export.json');
    await fs.writeFile(outputFile, JSON.stringify(exportData, null, 2));
    console.log(`\n✅ Export complete!`);
    console.log(`📄 Output file: ${outputFile}`);
    console.log(`📊 File size: ${(await fs.stat(outputFile)).size / 1024 / 1024} MB\n`);

    // Save individual files for easier processing
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'posts.json'),
      JSON.stringify(exportData.posts, null, 2)
    );
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'pages.json'),
      JSON.stringify(exportData.pages, null, 2)
    );
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'media.json'),
      JSON.stringify(exportData.media, null, 2)
    );
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'categories.json'),
      JSON.stringify(exportData.categories, null, 2)
    );
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'authors.json'),
      JSON.stringify(exportData.authors, null, 2)
    );

    console.log('📦 Individual files created:');
    console.log('   - posts.json');
    console.log('   - pages.json');
    console.log('   - media.json');
    console.log('   - categories.json');
    console.log('   - authors.json\n');

    console.log('🎉 Next steps:');
    console.log('   1. Review the exported data');
    console.log('   2. Run: node scripts/import-to-nextjs.js');
    console.log('   3. Verify imported content in admin dashboard\n');

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Check for required dependencies
try {
  require('mysql2/promise');
} catch (e) {
  console.error('❌ Missing dependency: mysql2');
  console.error('Run: npm install mysql2\n');
  process.exit(1);
}

// Run the export
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
