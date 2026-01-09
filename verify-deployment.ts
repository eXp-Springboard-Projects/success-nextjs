import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function verify() {
  await client.connect();
  
  console.log('=== VERIFICATION REPORT ===\n');
  
  // 1. Check featureInPillarSection column exists
  const colCheck = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'posts' 
    AND column_name = 'featureInPillarSection'
  `);
  console.log('✓ featureInPillarSection column:', colCheck.rows.length > 0 ? 'EXISTS' : 'MISSING');
  
  // 2. Check contact lists
  const lists = await client.query(`SELECT COUNT(*) as count FROM contact_lists`);
  console.log('✓ Contact lists:', lists.rows[0].count);
  
  // 3. Check WordPress posts
  const wpPosts = await client.query(`
    SELECT COUNT(*) as count 
    FROM posts 
    WHERE "wordpressId" IS NOT NULL
  `);
  console.log('✓ WordPress posts imported:', wpPosts.rows[0].count);
  
  // 4. Check author attribution
  const authorSample = await client.query(`
    SELECT "authorName", "wordpressAuthor" 
    FROM posts 
    WHERE "wordpressId" IS NOT NULL 
    LIMIT 1
  `);
  if (authorSample.rows[0]) {
    console.log('✓ Author attribution working:', authorSample.rows[0].authorName || authorSample.rows[0].wordpressAuthor);
  }
  
  // 5. Check media table
  const media = await client.query(`SELECT COUNT(*) as count FROM media`);
  console.log('✓ Media items:', media.rows[0].count);
  
  await client.end();
}

verify().catch(console.error);
