import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjemxhc3Nqa2J0d2VuenNvaHdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyODk0NywiZXhwIjoyMDgyMDA0OTQ3fQ.t4ADR0oV5sJCMNp1adP2vTsxV1W3Pfizw_uyO3BFYd4';

// Extract all models from Prisma schema
function extractPrismaModels(schemaPath: string): string[] {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const modelMatches = schema.matchAll(/^model\s+(\w+)\s+{/gm);
  return Array.from(modelMatches, match => match[1]).sort();
}

async function checkSupabaseTable(supabase: any, tableName: string): Promise<{exists: boolean, error?: string}> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      return { exists: false, error: error.message };
    }

    return { exists: true };
  } catch (err) {
    return { exists: false, error: String(err) };
  }
}

async function compareSchemas() {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
  });

  console.log('🔍 PRISMA TO SUPABASE AUDIT\n');
  console.log('=' .repeat(80));

  // Find Prisma schema
  const schemaPath = path.join(process.cwd(), 'success-plus-work', 'prisma', 'schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Prisma schema not found at:', schemaPath);
    return;
  }

  const models = extractPrismaModels(schemaPath);
  console.log(`\nFound ${models.length} Prisma models\n`);
  console.log('=' .repeat(80));
  console.log('PRISMA MODEL'.padEnd(30) + ' | SUPABASE TABLE EXISTS?');
  console.log('-'.repeat(80));

  let existsCount = 0;
  let missingCount = 0;
  const missingTables: string[] = [];

  for (const model of models) {
    const result = await checkSupabaseTable(supabase, model);

    if (result.exists) {
      console.log(`${model.padEnd(30)} | ✅ YES`);
      existsCount++;
    } else {
      console.log(`${model.padEnd(30)} | ❌ NO`);
      missingCount++;
      missingTables.push(model);
    }
  }

  console.log('=' .repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Tables exist in Supabase: ${existsCount}`);
  console.log(`   ❌ Tables missing in Supabase: ${missingCount}`);

  if (missingTables.length > 0) {
    console.log(`\n⚠️  Missing tables:`);
    missingTables.forEach(t => console.log(`   - ${t}`));
  }

  console.log('\n✅ Audit complete!');
}

compareSchemas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n💥 Audit failed:', error);
    process.exit(1);
  });
