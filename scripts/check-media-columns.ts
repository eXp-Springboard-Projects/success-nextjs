import { Client } from 'pg';

const DATABASE_URL = "postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require";

async function checkColumns() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'media'
    ORDER BY ordinal_position
  `);

  console.log('Media table columns:');
  result.rows.forEach(row => {
    console.log(`  ${row.column_name}: ${row.data_type}`);
  });

  await client.end();
}

checkColumns();
