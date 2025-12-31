/**
 * Generate Redirects from URL Mappings
 *
 * Creates vercel.json with 301 redirects for SEO preservation
 * Maps all WordPress URLs to new Next.js URLs
 *
 * Usage:
 *   node scripts/generate-redirects.js
 */

const fs = require('fs').promises;
const path = require('path');

const MAPPINGS_FILE = path.join(__dirname, 'url-mappings.json');
const VERCEL_CONFIG = path.join(__dirname, '../vercel.json');

// Extract path from full URL
function extractPath(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // If not a full URL, assume it's already a path
    return url.startsWith('/') ? url : `/${url}`;
  }
}

// Generate redirect rules
async function generateRedirects() {
  console.log('🔄 Generating Redirect Rules\n');

  try {
    // Read URL mappings
    const mappings = JSON.parse(await fs.readFile(MAPPINGS_FILE, 'utf8'));
    console.log(`📊 Found ${mappings.length} URL mappings\n`);

    // Create redirect objects
    const redirects = mappings.map(mapping => {
      const source = extractPath(mapping.oldUrl);
      const destination = mapping.newUrl;

      return {
        source,
        destination,
        permanent: true, // 301 redirect
      };
    }).filter(r => r.source && r.destination);

    // Remove duplicates (keep first occurrence)
    const uniqueRedirects = [];
    const seenSources = new Set();

    for (const redirect of redirects) {
      if (!seenSources.has(redirect.source)) {
        uniqueRedirects.push(redirect);
        seenSources.add(redirect.source);
      }
    }

    console.log(`✅ Generated ${uniqueRedirects.length} unique redirects\n`);

    // Read existing vercel.json or create new one
    let vercelConfig = {};
    try {
      const existing = await fs.readFile(VERCEL_CONFIG, 'utf8');
      vercelConfig = JSON.parse(existing);
      console.log('📝 Found existing vercel.json\n');
    } catch {
      console.log('📝 Creating new vercel.json\n');
    }

    // Add/update redirects
    vercelConfig.redirects = uniqueRedirects;

    // Write vercel.json
    await fs.writeFile(
      VERCEL_CONFIG,
      JSON.stringify(vercelConfig, null, 2)
    );

    console.log('✅ vercel.json updated successfully!\n');
    console.log(`   File: ${VERCEL_CONFIG}`);
    console.log(`   Total redirects: ${uniqueRedirects.length}`);

    // Generate stats
    const stats = {
      totalMappings: mappings.length,
      uniqueRedirects: uniqueRedirects.length,
      duplicatesRemoved: mappings.length - uniqueRedirects.length,
      sampleRedirects: uniqueRedirects.slice(0, 5),
    };

    // Save stats
    const statsFile = path.join(__dirname, 'redirect-stats.json');
    await fs.writeFile(statsFile, JSON.stringify(stats, null, 2));
    console.log(`   Stats saved: ${statsFile}\n`);

    // Display sample redirects
    console.log('📋 Sample Redirects:');
    stats.sampleRedirects.forEach(r => {
      console.log(`   ${r.source} → ${r.destination}`);
    });

    return stats;

  } catch (error) {
    console.error('❌ Error generating redirects:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await generateRedirects();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
