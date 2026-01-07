import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

const postgresUrl = process.env.DATABASE_URL || 'postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjUwNDcxMCwiZXhwIjoyMDQ4MDgwNzEwfQ.sb_secret_bx9obYWu-6qwAoNavXVGCg_m3vemyQKZgDbVHiPB5A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateResources() {
  console.log('🔄 Migrating resources from PostgreSQL to Supabase\n');

  // Connect to PostgreSQL
  const pgClient = new Client({ connectionString: postgresUrl });
  await pgClient.connect();
  console.log('✅ Connected to PostgreSQL');

  // Get all resources from PostgreSQL
  const { rows: pgResources } = await pgClient.query('SELECT * FROM resources');
  console.log(`📦 Found ${pgResources.length} resources in PostgreSQL\n`);

  let inserted = 0;
  let skipped = 0;

  for (const resource of pgResources) {
    // Check if already exists in Supabase
    const { data: existing } = await supabase
      .from('resources')
      .select('id')
      .eq('slug', resource.slug)
      .single();

    if (existing) {
      console.log(`⏭️  Skipped: ${resource.title} (already exists)`);
      skipped++;
      continue;
    }

    // Insert into Supabase
    const { error } = await supabase
      .from('resources')
      .insert({
        id: resource.id,
        title: resource.title,
        slug: resource.slug,
        description: resource.description,
        category: resource.category,
        fileUrl: resource.fileUrl,
        fileName: resource.fileName,
        fileSize: resource.fileSize,
        fileType: resource.fileType || 'pdf',
        accessLevel: resource.accessLevel || 'success_plus',
        downloadCount: resource.downloadCount || 0,
        featured: resource.featured || false,
        isActive: resource.isActive !== false,
        tags: resource.tags || [],
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt || resource.createdAt,
      });

    if (error) {
      console.error(`❌ Failed to insert ${resource.title}:`, error.message);
      skipped++;
    } else {
      console.log(`✅ Migrated: ${resource.title}`);
      inserted++;
    }
  }

  await pgClient.end();

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Migrated: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📦 Total: ${pgResources.length}`);
}

migrateResources().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
