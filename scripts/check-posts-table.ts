import { Client } from 'pg';

const DATABASE_URL = "postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require";

async function checkPostsTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  console.log('Checking posts table...\n');

  try {
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'posts'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ Posts table does NOT exist');
      console.log('\nThis table is required for the post editor to work.');
      console.log('The posts table should have been created by Prisma migrations.');
      await client.end();
      return;
    }

    console.log('✅ Posts table exists');

    // Check columns
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);

    console.log('\nPosts table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });

    // Check for existing posts
    const countResult = await client.query('SELECT COUNT(*) FROM posts');
    console.log(`\n✅ Posts table has ${countResult.rows[0].count} posts`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  await client.end();
}

checkPostsTable();
