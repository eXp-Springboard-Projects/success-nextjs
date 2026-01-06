import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const RESOURCES_DIR = path.join(process.cwd(), 'public', 'resources', 'success-plus');

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user.role !== 'STAFF') {
    return res.status(403).json({ message: 'Unauthorized - staff access required' });
  }

  try {
    console.log('🔄 Seeding resources to Supabase');

    const supabase = supabaseAdmin();

    // Check if resources table exists
    const { error: tableCheckError } = await supabase
      .from('resources')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      return res.status(500).json({
        message: 'Resources table does not exist',
        error: tableCheckError.message
      });
    }

    // Read all PDF files
    const files = fs.readdirSync(RESOURCES_DIR).filter(f => f.endsWith('.pdf'));
    console.log(`Found ${files.length} PDF resources`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const results: any[] = [];

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
          results.push({ filename, status: 'error', error: updateError.message });
        } else {
          console.log(`✏️  Updated: ${title}`);
          updated++;
          results.push({ filename, status: 'updated', title });
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
          results.push({ filename, status: 'error', error: insertError.message });
        } else {
          console.log(`✅ Added: ${title}`);
          inserted++;
          results.push({ filename, status: 'inserted', title });
        }
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        total: files.length,
        inserted,
        updated,
        skipped,
      },
      results,
    });
  } catch (error: any) {
    console.error('Seed failed:', error);
    return res.status(500).json({
      message: 'Failed to seed resources',
      error: error.message
    });
  }
}
