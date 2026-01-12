import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require';

async function runMigration() {
  const pool = new Pool({ connectionString });

  try {
    console.log('Running social media requests migration...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_social_media_requests.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Migration completed successfully');

    // Verify the table was created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'social_media_requests'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table verified successfully');
    } else {
      console.log('❌ Table not found');
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
