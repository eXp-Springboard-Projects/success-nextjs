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

    // Split contacts into those with email (upsert) and without (insert)
    const withEmail = contacts.filter(c => c.email);
    const withoutEmail = contacts.filter(c => !c.email);

    let imported = 0;
    let skipped = 0;

    // Upsert contacts with email (deduplication)
    if (withEmail.length > 0) {
      const contactsToUpsert = withEmail.map(c => ({
        id: nanoid(),
        email: c.email,
        first_name: c.first_name || null,
        last_name: c.last_name || null,
        phone: c.phone || null,
        company: c.company || null,
        source: 'import'
      }));

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

      imported += upserted?.length || 0;
    }

    // Insert contacts without email (no deduplication possible)
    if (withoutEmail.length > 0) {
      const contactsToInsert = withoutEmail.map(c => ({
        id: nanoid(),
        email: `no-email-${nanoid()}@placeholder.local`, // Generate placeholder email
        first_name: c.first_name || null,
        last_name: c.last_name || null,
        phone: c.phone || null,
        company: c.company || null,
        source: 'import'
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('contacts')
        .insert(contactsToInsert)
        .select();

      if (insertError) {
        throw insertError;
      }

      imported += inserted?.length || 0;
    }

    return res.status(200).json({
      imported,
      skipped,
      errors: []
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({
      error: 'Failed to import contacts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
