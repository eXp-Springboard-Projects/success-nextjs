import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const RESOURCES_DIR = path.join(process.cwd(), 'public', 'resources', 'success-plus');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aczlassjkbtwenzsohwm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function formatTitle(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function categorizeResource(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.includes('leadership') || lower.includes('okr')) {
    return 'Leadership & Management';
  }
  if (lower.includes('guide') || lower.includes('ebook')) {
    return 'Guides & Workbooks';
  }
  if (lower.includes('planner') || lower.includes('tracker') || lower.includes('calendar')) {
    return 'Planners & Trackers';
  }
  if (lower.includes('finance') || lower.includes('money') || lower.includes('budget') || lower.includes('investment')) {
    return 'Finance & Money';
  }
  if (lower.includes('career') || lower.includes('resume') || lower.includes('interview')) {
    return 'Career Development';
  }
  if (lower.includes('growth') || lower.includes('personal')) {
    return 'Personal Growth';
  }
  if (lower.includes('business') || lower.includes('entrepreneur') || lower.includes('startup') || lower.includes('ceo')) {
    return 'Business & Entrepreneurship';
  }
  if (lower.includes('health') || lower.includes('wellness') || lower.includes('movement') || lower.includes('sleep')) {
    return 'Health & Wellness';
  }
  if (lower.includes('holiday') || lower.includes('christmas') || lower.includes('seasonal')) {
    return 'Seasonal & Holiday';
  }

  return 'General Resources';
}

async function catalogResources() {
  console.log('📚 Cataloging SUCCESS+ Resources to Supabase\n');
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  // Check if resources table exists
  const { data: existingResources, error: fetchError } = await supabase
    .from('resources')
    .select('id')
    .limit(1);

  if (fetchError) {
    console.error('❌ Resources table does not exist or cannot be accessed:', fetchError.message);
    console.log('\nPlease create the table in Supabase SQL Editor:\n');
    console.log(`
CREATE TABLE IF NOT EXISTS "resources" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER,
  "fileType" TEXT DEFAULT 'pdf',
  "accessLevel" TEXT DEFAULT 'success_plus',
  "downloadCount" INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  tags TEXT[],
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources (category);
CREATE INDEX IF NOT EXISTS idx_resources_access_level ON resources ("accessLevel");
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources (featured);
CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources (slug);
    `);
    process.exit(1);
  }

  // Read all PDF files
  const files = fs.readdirSync(RESOURCES_DIR).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDF resources\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const filename of files) {
    const filePath = path.join(RESOURCES_DIR, filename);
    const stats = fs.statSync(filePath);

    const title = formatTitle(filename);
    const slug = filename.replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = categorizeResource(filename);
    const fileUrl = `/resources/success-plus/${encodeURIComponent(filename)}`;

    // Check if exists
    const { data: existing } = await supabase
      .from('resources')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('resources')
        .update({
          title,
          category,
          fileUrl,
          fileName: filename,
          fileSize: stats.size,
          updatedAt: new Date().toISOString(),
        })
        .eq('slug', slug);

      if (updateError) {
        console.error(`❌ Failed to update ${filename}:`, updateError.message);
        skipped++;
      } else {
        console.log(`✏️  Updated: ${title}`);
        updated++;
      }
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('resources')
        .insert({
          id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          slug,
          description: null,
          category,
          fileUrl,
          fileName: filename,
          fileSize: stats.size,
          fileType: 'pdf',
          accessLevel: 'success_plus',
          downloadCount: 0,
          featured: false,
          isActive: true,
          tags: [],
        });

      if (insertError) {
        console.error(`❌ Failed to insert ${filename}:`, insertError.message);
        skipped++;
      } else {
        console.log(`✅ Added: ${title}`);
        inserted++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${inserted}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${inserted + updated + skipped}`);
}

catalogResources().catch(console.error);
