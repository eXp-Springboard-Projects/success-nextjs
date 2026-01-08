import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkContent() {
  await client.connect();

  const result = await client.query(
    'SELECT id, title, content FROM posts WHERE "wordpressId" IS NOT NULL LIMIT 1'
  );

  if (result.rows.length > 0) {
    const post = result.rows[0];
    console.log('Sample WordPress Post:');
    console.log('ID:', post.id);
    console.log('Title:', post.title);
    console.log('Content Length:', post.content?.length);
    console.log('Content Preview (first 500 chars):');
    console.log(post.content?.substring(0, 500));
    console.log('\nContent Type:', typeof post.content);
  } else {
    console.log('No WordPress posts found');
  }

  await client.end();
}

checkContent();
