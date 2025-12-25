import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = supabaseAdmin();
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data provided' });
  }

  // Split by newlines and tabs
  const lines = data.trim().split('\n');
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const line of lines) {
    try {
      // Split by tabs
      const fields = line.split('\t');

      // Skip header rows or invalid rows
      if (fields.length < 4 || fields[0] === 'Record ID - Contact') {
        continue;
      }

      const firstName = fields[1]?.trim();
      const lastName = fields[2]?.trim();
      const email = fields[3]?.trim().toLowerCase();
      const phone = fields[4]?.trim();
      const createDate = fields[9]?.trim();

      // Skip if no email
      if (!email || !email.includes('@')) {
        continue;
      }

      // Check if member already exists
      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Parse create date
      let joinDate = new Date();
      if (createDate) {
        const parsed = new Date(createDate);
        if (!isNaN(parsed.getTime())) {
          joinDate = parsed;
        }
      }

      // Clean phone number
      let cleanPhone = phone;
      if (cleanPhone) {
        cleanPhone = cleanPhone.replace(/\s+/g, '').replace(/^'+/, '');
        if (cleanPhone.startsWith('+') || cleanPhone.match(/^\d/)) {
          // Keep it
        } else {
          cleanPhone = null;
        }
      }

      // Insert member
      const { error: insertError } = await supabase.from('members').insert({
        id: nanoid(),
        firstName: firstName || 'Unknown',
        lastName: lastName || '',
        email: email,
        phone: cleanPhone || null,
        membershipTier: 'SUCCESSPlus',
        membershipStatus: 'Active',
        joinDate: joinDate.toISOString(),
        totalSpent: 0,
        lifetimeValue: 0,
        engagementScore: 0,
        createdAt: joinDate.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (insertError) {
        errors.push(`${email}: ${insertError.message}`);
      } else {
        imported++;
      }
    } catch (err: any) {
      errors.push(`Row error: ${err.message}`);
    }
  }

  return res.status(200).json({
    imported,
    skipped,
    errors: errors.slice(0, 50), // Return first 50 errors only
  });
}
