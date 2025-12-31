/**
 * WordPress API Explorer Utility
 *
 * This script explores the SUCCESS.com WordPress API to discover available
 * endpoints, custom post types, and data structures.
 *
 * Usage: node scripts/wordpress-api-explorer.js
 */

const https = require('https');

const BASE_URL = 'https://www.success.com/wp-json/wp/v2';

function fetchAPI(endpoint) {
  return new Promise((resolve, reject) => {
    https.get(`${BASE_URL}${endpoint}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function exploreAPI() {
  console.log('🔍 Exploring SUCCESS.com WordPress API...\n');

  // 1. Get available routes/endpoints
  console.log('📋 Fetching available endpoints...');
  try {
    const routes = await new Promise((resolve, reject) => {
      https.get('https://www.success.com/wp-json/', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    console.log('\n✅ Available Routes:');
    if (routes.routes) {
      const v2Routes = Object.keys(routes.routes)
        .filter(route => route.startsWith('/wp/v2/'))
        .sort();

      v2Routes.forEach(route => {
        console.log(`  - ${route}`);
      });
    }
  } catch (error) {
    console.error('❌ Error fetching routes:', error.message);
  }

  // 2. Explore custom post types
  console.log('\n\n📚 Exploring Custom Post Types...\n');

  const customPostTypes = [
    'magazines',
    'bestsellers',
    'videos',
    'podcasts',
    'speakers',
    'products',
    'press-releases'
  ];

  for (const postType of customPostTypes) {
    try {
      console.log(`\n🔎 Testing: /${postType}`);
      const data = await fetchAPI(`/${postType}?per_page=1&_embed`);

      if (Array.isArray(data) && data.length > 0) {
        console.log(`  ✅ Available! Sample item:`);
        const item = data[0];
        console.log(`     ID: ${item.id}`);
        console.log(`     Title: ${item.title?.rendered || 'N/A'}`);
        console.log(`     Slug: ${item.slug || 'N/A'}`);
        console.log(`     Link: ${item.link || 'N/A'}`);

        // Show custom fields if available
        if (item.meta_data) {
          console.log(`     Custom Fields: ${Object.keys(item.meta_data).length} fields`);
          console.log(`     Fields: ${Object.keys(item.meta_data).slice(0, 5).join(', ')}...`);
        }

        // Show embedded data
        if (item._embedded) {
          console.log(`     Embedded: ${Object.keys(item._embedded).join(', ')}`);
        }
      } else {
        console.log(`  ℹ️  Endpoint exists but returned no data`);
      }
    } catch (error) {
      console.log(`  ❌ Not available or error: ${error.message}`);
    }
  }

  // 3. Explore categories
  console.log('\n\n📂 Exploring Categories...\n');
  try {
    const categories = await fetchAPI('/categories?per_page=20');
    console.log(`✅ Found ${categories.length} categories:\n`);

    categories
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat.id}, Count: ${cat.count}, Slug: ${cat.slug})`);
      });
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
  }

  // 4. Sample magazine data structure
  console.log('\n\n📖 Detailed Magazine Data Structure...\n');
  try {
    const magazines = await fetchAPI('/magazines?per_page=1&_embed');
    if (magazines.length > 0) {
      const mag = magazines[0];
      console.log('Sample Magazine Object:');
      console.log(JSON.stringify({
        id: mag.id,
        title: mag.title,
        slug: mag.slug,
        meta_data: mag.meta_data ? Object.keys(mag.meta_data) : [],
        featured_media: mag.featured_media,
        _embedded_keys: mag._embedded ? Object.keys(mag._embedded) : []
      }, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching magazine details:', error.message);
  }

  console.log('\n\n✅ API Exploration Complete!\n');
}

// Run the explorer
exploreAPI().catch(console.error);
