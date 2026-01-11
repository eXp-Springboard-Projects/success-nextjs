import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Invalid contacts data' });
    }

    const supabase = supabaseAdmin();

    // Map contacts to database format
    const contactsToUpsert = contacts
      .filter(c => c.email) // Skip contacts without email
      .map(c => ({
        id: nanoid(),
        email: c.email,
        first_name: c.firstName || null,
        last_name: c.lastName || null,
        phone: c.phone || null,
        company: c.company || null,
        source: 'import'
      }));

    // Bulk upsert contacts
    const { data: upserted, error: upsertError } = await supabase
      .from('contacts')
      .upsert(contactsToUpsert, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      throw upsertError;
    }

    const imported = upserted?.length || 0;
    const skipped = contacts.length - contactsToUpsert.length;

    return res.status(200).json({
      imported,
      skipped,
      errors: skipped > 0 ? [`Skipped ${skipped} contacts without email`] : []
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({
      error: 'Failed to import contacts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
