/**
 * Create Social Media Tables using PostgreSQL Client
 * Run with: npx tsx scripts/create-social-tables-pg.ts
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function createTables() {
  // Supabase PostgreSQL connection string
  const connectionString = 'postgresql://postgres.aczlassjkbtwenzsohwm:SuccessMAG2025!@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

  const client = new Client({ connectionString });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✓ Connected\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-social-media-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executing SQL to create tables...\n');

    // Execute the entire SQL script
    await client.query(sql);

    console.log('✓ Tables created successfully!\n');

    // Verify tables
    console.log('Verifying tables...');
    const tables = ['social_accounts', 'social_posts', 'social_media_library'];

    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );`,
        [table]
      );

      if (result.rows[0].exists) {
        console.log(`✓ ${table} exists`);
      } else {
        console.log(`✗ ${table} not found`);
      }
    }

    console.log('\n✅ Social media auto-poster is ready to use!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

createTables();
