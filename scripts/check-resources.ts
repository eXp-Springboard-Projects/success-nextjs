import { Client } from 'pg';

async function checkResources() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Total count
    const totalResult = await client.query('SELECT COUNT(*) as total FROM resources');
    console.log(`Total resources: ${totalResult.rows[0].total}\n`);

    // By category
    const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count
      FROM resources
      GROUP BY category
      ORDER BY count DESC
    `);
    console.log('Resources by category:');
    categoryResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count}`);
    });

    console.log('\n');

    // Sample resources
    const sampleResult = await client.query(`
      SELECT id, title, category, "isActive", featured
      FROM resources
      LIMIT 5
    `);
    console.log('Sample resources:');
    sampleResult.rows.forEach(row => {
      console.log(`  - ${row.title} (${row.category}) [Active: ${row.isActive}, Featured: ${row.featured}]`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkResources();
