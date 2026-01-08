import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkAuthors() {
  await client.connect();

  const result = await client.query(`
    SELECT id, title, "authorName", "wordpressAuthor", "authorId", "createdBy", "updatedBy"
    FROM posts
    WHERE "wordpressId" IS NOT NULL
    LIMIT 5
  `);

  console.log('\n=== WordPress Posts Author Attribution ===\n');
  result.rows.forEach(post => {
    console.log('Post:', post.title.substring(0, 60));
    console.log('  Author Name:', post.authorName);
    console.log('  WP Author:', post.wordpressAuthor);
    console.log('  Author ID:', post.authorId);
    console.log('  Created By:', post.createdBy);
    console.log('  Updated By:', post.updatedBy);
    console.log('---');
  });

  await client.end();
}

checkAuthors();
