import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkImport() {
  await client.connect();
  
  const posts = await client.query('SELECT COUNT(*) FROM posts WHERE "wordpressId" IS NOT NULL');
  const categories = await client.query('SELECT COUNT(*) FROM categories WHERE "wordpressId" IS NOT NULL');
  const tags = await client.query('SELECT COUNT(*) FROM tags WHERE "wordpressId" IS NOT NULL');
  const authors = await client.query('SELECT COUNT(*) FROM users WHERE "wordpressId" IS NOT NULL');
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║       WordPress Import Status                  ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  console.log(`  Posts:      ${posts.rows[0].count}`);
  console.log(`  Categories: ${categories.rows[0].count}`);
  console.log(`  Tags:       ${tags.rows[0].count}`);
  console.log(`  Authors:    ${authors.rows[0].count}\n`);
  
  await client.end();
}

checkImport();
