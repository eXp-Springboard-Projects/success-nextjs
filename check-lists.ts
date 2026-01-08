import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function check() {
  await client.connect();
  
  const result = await client.query(`
    SELECT COUNT(*) as count FROM contact_lists
  `);
  
  console.log('Contact lists in database:', result.rows[0].count);
  
  const lists = await client.query(`
    SELECT id, name, "memberCount" FROM contact_lists LIMIT 5
  `);
  
  console.log('\nSample lists:');
  lists.rows.forEach(list => {
    console.log(`- ${list.name} (${list.memberCount} members)`);
  });
  
  await client.end();
}

check().catch(console.error);
