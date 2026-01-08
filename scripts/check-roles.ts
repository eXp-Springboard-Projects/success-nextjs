import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function checkRoles() {
  await client.connect();

  const result = await client.query('SELECT DISTINCT role FROM users ORDER BY role');
  console.log('Current user roles in database:');
  result.rows.forEach(row => console.log(' -', row.role));

  await client.end();
}

checkRoles();
