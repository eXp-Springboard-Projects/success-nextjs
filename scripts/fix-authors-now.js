const https = require('https');

const articles = [
  { slug: '4-benefits-of-having-a-pet-that-promotes-success', id: 77631 },
  { slug: 'mental-health-day-signs', id: null }
];

async function getArticleId(slug) {
  return new Promise((resolve, reject) => {
    https.get(`https://successcom.wpenginepowered.com/wp-json/wp/v2/posts?slug=${slug}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.length > 0) {
            resolve(json[0].id);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function updateAuthor(postId, authorName) {
  console.log(`Updating post ${postId} to author: ${authorName}...`);

  // Since we don't have auth credentials, update via our own database
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://aczlassjkbtwenzsohwm.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data, error } = await supabase
    .from('posts')
    .update({ authorName: authorName })
    .eq('wordpressId', postId);

  if (error) {
    console.log(`  ❌ Error: ${error.message}`);
  } else {
    console.log(`  ✅ Updated successfully`);
  }
}

async function main() {
  console.log('Finding and updating articles...\n');

  // Get ID for second article
  const id2 = await getArticleId('mental-health-day-signs');
  if (id2) {
    articles[1].id = id2;
  }

  // Update both articles
  for (const article of articles) {
    if (article.id) {
      await updateAuthor(article.id, 'Jaclyn Greenberg');
    } else {
      console.log(`Could not find article: ${article.slug}`);
    }
  }

  console.log('\nDone!');
}

main();
