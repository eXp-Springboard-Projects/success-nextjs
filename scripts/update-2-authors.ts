import fetch from 'node-fetch';

async function updateAuthors() {
  const articles = [
    { slug: '4-benefits-of-having-a-pet-that-promotes-success', newAuthor: 'Jaclyn Greenberg' },
    { slug: 'mental-health-day-signs', newAuthor: 'Jaclyn Greenberg' }
  ];

  console.log('Updating authors...\n');

  for (const article of articles) {
    try {
      // Get session cookie
      const loginRes = await fetch('http://localhost:3000/api/auth/signin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'rachel.nead@success.com',
          password: process.env.ADMIN_PASSWORD || 'your-password',
          callbackUrl: '/admin'
        })
      });

      // Search for the post
      const searchRes = await fetch(`http://localhost:3000/api/posts?search=${article.slug}&per_page=100`);
      const posts = await searchRes.json();

      const post = Array.isArray(posts) ? posts.find((p: any) => p.slug === article.slug) : null;

      if (!post) {
        console.log(`Not found: ${article.slug}`);
        continue;
      }

      console.log(`Found: ${post.title?.rendered || post.title}`);
      console.log(`Current author: ${post.authorName || 'Unknown'}`);

      // Update via WordPress API directly
      const wpRes = await fetch(`https://successcom.wpenginepowered.com/wp-json/wp/v2/posts/${post.wordpressId || post.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from('admin:your-wp-password').toString('base64')
        },
        body: JSON.stringify({
          meta: {
            author_name: article.newAuthor
          }
        })
      });

      if (wpRes.ok) {
        console.log(`Updated to: ${article.newAuthor}\n`);
      } else {
        console.log(`Failed to update\n`);
      }
    } catch (error) {
      console.log(`Error: ${error}\n`);
    }
  }
}

updateAuthors();
