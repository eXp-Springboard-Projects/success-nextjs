// WordPress Content Audit Script
const https = require('https');

const endpoints = [
  { name: 'Posts', url: 'https://www.success.com/wp-json/wp/v2/posts?per_page=1' },
  { name: 'Pages', url: 'https://www.success.com/wp-json/wp/v2/pages?per_page=1' },
  { name: 'Categories', url: 'https://www.success.com/wp-json/wp/v2/categories?per_page=1' },
  { name: 'Tags', url: 'https://www.success.com/wp-json/wp/v2/tags?per_page=1' },
  { name: 'Users/Authors', url: 'https://www.success.com/wp-json/wp/v2/users?per_page=1' },
  { name: 'Media', url: 'https://www.success.com/wp-json/wp/v2/media?per_page=1' },
];

async function fetchCount(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const total = res.headers['x-wp-total'] || '0';
      const totalPages = res.headers['x-wp-totalpages'] || '0';
      resolve({ total: parseInt(total), totalPages: parseInt(totalPages) });
      res.resume(); // Consume response
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n=== WORDPRESS CONTENT AUDIT ===\n');

  for (const endpoint of endpoints) {
    try {
      const { total, totalPages } = await fetchCount(endpoint.url);
      console.log(`${endpoint.name.padEnd(20)}: ${total.toLocaleString()} items (${totalPages} pages)`);
    } catch (error) {
      console.log(`${endpoint.name.padEnd(20)}: ERROR - ${error.message}`);
    }
  }

  console.log('\n');
}

main();
