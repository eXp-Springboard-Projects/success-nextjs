import pkg from 'pg';
const { Client } = pkg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function fix() {
  await client.connect();
  await client.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS "featureInPillarSection" BOOLEAN DEFAULT false;`);
  console.log('✓ Column added');
  await client.end();
}

fix().catch(console.error);
