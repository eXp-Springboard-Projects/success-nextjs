import { supabaseAdmin } from '../lib/supabase';

async function createTable() {
  const supabase = supabaseAdmin();

  console.log('Creating social_media_requests table...');

  try {
    // Create the table
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS social_media_requests (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
          title TEXT NOT NULL,
          description TEXT,
          link_url TEXT,
          image_url TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          requested_by TEXT NOT NULL,
          requested_by_name TEXT,
          assigned_to TEXT,
          assigned_to_name TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ
        );
      `
    });

    if (error) {
      console.log('Table might already exist or trying direct approach...');

      // Try direct SQL query method
      const { data, error: queryError } = await supabase
        .from('social_media_requests')
        .select('id')
        .limit(1);

      if (queryError && queryError.code === '42P01') {
        console.error('❌ Table does not exist and could not be created');
        console.log('\nPlease run this SQL in Supabase dashboard:');
        console.log('https://app.supabase.com/project/aczlassjkbtwenzsohwm/editor\n');
        console.log(`
CREATE TABLE IF NOT EXISTS social_media_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  requested_by TEXT NOT NULL,
  requested_by_name TEXT,
  assigned_to TEXT,
  assigned_to_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_social_media_requests_status ON social_media_requests(status);
        `);
        return;
      }

      console.log('✅ Table already exists!');
    } else {
      console.log('✅ Table created successfully!');
    }

    // Create indexes
    await supabase.rpc('exec_sql', {
      sql_query: 'CREATE INDEX IF NOT EXISTS idx_social_media_requests_status ON social_media_requests(status);'
    });

    await supabase.rpc('exec_sql', {
      sql_query: 'CREATE INDEX IF NOT EXISTS idx_social_media_requests_requested_by ON social_media_requests(requested_by);'
    });

    await supabase.rpc('exec_sql', {
      sql_query: 'CREATE INDEX IF NOT EXISTS idx_social_media_requests_assigned_to ON social_media_requests(assigned_to);'
    });

    console.log('✅ Indexes created!');

    // Verify
    const { data, error: verifyError } = await supabase
      .from('social_media_requests')
      .select('*')
      .limit(1);

    if (!verifyError) {
      console.log('✅ Table verified and ready to use!');
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

createTable();
