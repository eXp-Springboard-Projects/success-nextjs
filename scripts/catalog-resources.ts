import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DATABASE_URL = "postgres://e731f8c351f1974c788b739203b00113561ca6e26a0a8c0d7d5efcea8cf9b656:sk_LYHdgk8RomZonUpgI9S97@db.prisma.io:5432/postgres?sslmode=require";

const RESOURCES_DIR = path.join(process.cwd(), 'public', 'resources', 'success-plus');

// Categorize resources based on filename patterns
function categorizeResource(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.includes('leadership') || lower.includes('okr') || lower.includes('succession')) {
    return 'Leadership & Management';
  }
  if (lower.includes('guide') || lower.includes('ebook') || lower.includes('workbook')) {
    return 'Guides & Workbooks';
  }
  if (lower.includes('planner') || lower.includes('tracker') || lower.includes('routine') || lower.includes('schedule')) {
    return 'Planners & Trackers';
  }
  if (lower.includes('holiday') || lower.includes('seasonal')) {
    return 'Seasonal & Holiday';
  }
  if (lower.includes('financial') || lower.includes('investment') || lower.includes('debt') || lower.includes('expense') || lower.includes('budget')) {
    return 'Finance & Money';
  }
  if (lower.includes('health') || lower.includes('wellness') || lower.includes('sleep') || lower.includes('movement') || lower.includes('stretch')) {
    return 'Health & Wellness';
  }
  if (lower.includes('career') || lower.includes('resume') || lower.includes('interview') || lower.includes('remote')) {
    return 'Career Development';
  }
  if (lower.includes('goal') || lower.includes('vision') || lower.includes('reflection')) {
    return 'Personal Growth';
  }
  if (lower.includes('business') || lower.includes('customer') || lower.includes('side-hustle') || lower.includes('10x')) {
    return 'Business & Entrepreneurship';
  }

  return 'General Resources';
}

function formatTitle(filename: string): string {
  // Remove extension
  let title = filename.replace(/\.pdf$/i, '');

  // Remove version numbers and duplicates indicators
  title = title.replace(/\s*\(\d+\)$/g, '');
  title = title.replace(/_V\d+$/g, '');

  // Replace hyphens and underscores with spaces
  title = title.replace(/[-_]/g, ' ');

  // Capitalize words
  title = title.split(' ')
    .map(word => {
      // Keep acronyms uppercase
      if (word.toUpperCase() === word && word.length > 1) return word;
      // Keep SUCCESS uppercase
      if (word.toUpperCase() === 'SUCCESS') return 'SUCCESS';
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return title;
}

async function catalogResources() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected to database\n');

  try {
    // Drop and recreate resources table
    console.log('Creating resources table...');
    await client.query(`DROP TABLE IF EXISTS "resources" CASCADE;`);
    await client.query(`
      CREATE TABLE "resources" (
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

      CREATE INDEX IF NOT EXISTS idx_resources_category ON resources USING btree (category);
      CREATE INDEX IF NOT EXISTS idx_resources_access_level ON resources USING btree ("accessLevel");
      CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources USING btree (featured);
      CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources USING btree (slug);
    `);
    console.log('✅ Resources table created\n');

    // Read all PDF files from the resources directory
    const files = fs.readdirSync(RESOURCES_DIR).filter(f => f.endsWith('.pdf'));
    console.log(`Found ${files.length} PDF resources\n`);

    let inserted = 0;
    let skipped = 0;

    for (const filename of files) {
      const filePath = path.join(RESOURCES_DIR, filename);
      const stats = fs.statSync(filePath);

      const title = formatTitle(filename);
      const slug = filename.replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const category = categorizeResource(filename);
      const fileUrl = `/resources/success-plus/${encodeURIComponent(filename)}`;

      // Check if already exists
      const existing = await client.query('SELECT id FROM resources WHERE slug = $1', [slug]);

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipped: ${title} (already exists)`);
        skipped++;
        continue;
      }

      // Insert resource
      await client.query(`
        INSERT INTO resources (
          id, title, slug, category, "fileUrl", "fileName", "fileSize", "accessLevel"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'success_plus'
        )
      `, [
        `resource_${Date.now()}_${inserted}`,
        title,
        slug,
        category,
        fileUrl,
        filename,
        stats.size
      ]);

      console.log(`✅ Added: ${title} (${category})`);
      inserted++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total files: ${files.length}`);
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Skipped: ${skipped}`);

    // Show category breakdown
    const categoryCounts = await client.query(`
      SELECT category, COUNT(*) as count
      FROM resources
      GROUP BY category
      ORDER BY count DESC
    `);

    console.log(`\n📁 Resources by category:`);
    categoryCounts.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.count}`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

catalogResources().catch(e => {
  console.error(e);
  process.exit(1);
});
