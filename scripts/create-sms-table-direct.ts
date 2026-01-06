/**
 * Create SMS Subscribers table using direct PostgreSQL connection
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:100vc3NUeQMck5%21Ae@db.aczlassjkbtwenzsohwm.supabase.co:5432/postgres";

async function createTable() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  console.log('🔄 Connecting to Supabase PostgreSQL database...\n');

  try {
    // Test connection
    const testClient = await pool.connect();
    console.log('✅ Connected to database successfully!\n');
    testClient.release();

    // Read SQL migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_sms_subscribers_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration SQL...\n');

    // Execute the SQL
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Migration executed successfully!\n');
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Verify table was created
    const verifyClient = await pool.connect();
    const { rows } = await verifyClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sms_subscribers'
      ORDER BY ordinal_position;
    `);
    verifyClient.release();

    console.log('✅ Table "sms_subscribers" created successfully!\n');
    console.log('📋 Table structure:');
    console.log('─'.repeat(80));
    rows.forEach((row: any) => {
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    console.log('─'.repeat(80));

    // Get record count
    const countClient = await pool.connect();
    const { rows: countRows } = await countClient.query('SELECT COUNT(*) as count FROM sms_subscribers');
    countClient.release();

    console.log(`\n📊 Current subscriber count: ${countRows[0].count}`);
    console.log('\n✨ Migration complete! The table is ready to use.');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTable()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
