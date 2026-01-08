import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkPosts() {
  await client.connect();
  const result = await client.query('SELECT COUNT(*) as count FROM posts WHERE "wordpressId" IS NOT NULL');
  console.log(`✓ Posts already imported: ${result.rows[0].count}`);
  
  const totalWP = await client.query('SELECT MAX("wordpressId") as max FROM posts WHERE "wordpressId" IS NOT NULL');
  console.log(`✓ Highest WordPress ID: ${totalWP.rows[0].max}`);
  
  await client.end();
}

checkPosts();
