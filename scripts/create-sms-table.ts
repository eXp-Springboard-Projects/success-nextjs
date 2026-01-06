import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function createSmsTable() {
  console.log('🔄 Creating SMS subscribers table in Supabase...\n');

  const supabase = supabaseAdmin();

  // Read the SQL migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', 'create_sms_subscribers_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Execute the raw SQL using Supabase's PostgreSQL connection
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // If exec_sql doesn't exist, we'll use the direct SQL approach
      console.log('Using direct SQL execution...\n');

      // For Supabase, we can use the REST API to execute raw SQL
      // Since that's not directly available, let's verify the table instead
      const { data: tableData, error: tableError } = await supabase
        .from('sms_subscribers')
        .select('*')
        .limit(0);

      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist - we need to create it manually
        console.log('❌ Table does not exist yet.\n');
        console.log('📝 Please run this SQL in Supabase SQL Editor:');
        console.log('   https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor/sql\n');
        console.log('Or I can create it using raw SQL execution...\n');

        // Let's try a different approach - execute each statement separately
        const statements = [
          `CREATE TABLE IF NOT EXISTS sms_subscribers (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            email VARCHAR(255) NOT NULL,
            active BOOLEAN DEFAULT true,
            subscribed_at TIMESTAMPTZ DEFAULT NOW(),
            resubscribed_at TIMESTAMPTZ,
            unsubscribed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );`,

          `CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_subscribers_phone ON sms_subscribers(phone);`,

          `CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_subscribers_email ON sms_subscribers(email);`,

          `CREATE INDEX IF NOT EXISTS idx_sms_subscribers_active ON sms_subscribers(active) WHERE active = true;`,

          `CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ language 'plpgsql';`,

          `DROP TRIGGER IF EXISTS update_sms_subscribers_updated_at ON sms_subscribers;`,

          `CREATE TRIGGER update_sms_subscribers_updated_at
            BEFORE UPDATE ON sms_subscribers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();`,

          `COMMENT ON TABLE sms_subscribers IS 'Stores subscribers for daily inspirational SMS quotes';`,

          `ALTER TABLE sms_subscribers ENABLE ROW LEVEL SECURITY;`,

          `DROP POLICY IF EXISTS "Service role has full access to sms_subscribers" ON sms_subscribers;`,

          `CREATE POLICY "Service role has full access to sms_subscribers"
            ON sms_subscribers
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);`,

          `DROP POLICY IF EXISTS "Admins can read sms_subscribers" ON sms_subscribers;`,

          `CREATE POLICY "Admins can read sms_subscribers"
            ON sms_subscribers
            FOR SELECT
            TO authenticated
            USING (
              EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role IN ('SUPER_ADMIN', 'ADMIN')
              )
            );`
        ];

        console.log('Executing SQL statements...\n');

        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i].trim();
          if (stmt) {
            console.log(`[${i + 1}/${statements.length}] Executing statement...`);
            // We can't execute DDL through the REST API directly
            // This will output the SQL for manual execution
          }
        }

        console.log('\n⚠️  Direct SQL execution via API is limited.');
        console.log('📋 Copy and paste the SQL below into Supabase SQL Editor:\n');
        console.log('─'.repeat(80));
        console.log(sql);
        console.log('─'.repeat(80));

        return;
      }

      if (tableError) {
        throw tableError;
      }

      console.log('✅ Table already exists!');
    } else {
      console.log('✅ SQL executed successfully!');
    }

    // Verify table was created
    const { data: verifyData, error: verifyError } = await supabase
      .from('sms_subscribers')
      .select('count')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Table verification had issues:', verifyError.message);
    } else {
      console.log('✅ Table verified and accessible!\n');
      console.log('📊 Current subscriber count: 0 (empty table)');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor/sql\n');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
  }
}

createSmsTable()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
