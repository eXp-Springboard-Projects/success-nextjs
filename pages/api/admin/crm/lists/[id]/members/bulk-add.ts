import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../../lib/supabase';
import { randomUUID } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = supabaseAdmin();
    const { id: listId } = req.query;
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Contact IDs array is required' });
    }

    // Verify list exists
    const { data: list, error: listError } = await supabase
      .from('contact_lists')
      .select('id, name')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return res.status(404).json({ error: 'List not found' });
    }

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contactId of contactIds) {
      try {
        // Check if already in list
        const { data: existing } = await supabase
          .from('contact_list_members')
          .select('id')
          .eq('list_id', listId)
          .eq('contact_id', contactId)
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Add to list
        const { error: insertError } = await supabase
          .from('contact_list_members')
          .insert({
            id: randomUUID(),
            list_id: listId as string,
            contact_id: contactId,
            added_at: new Date().toISOString(),
          });

        if (insertError) {
          errors.push(`Failed to add contact ${contactId}: ${insertError.message}`);
        } else {
          added++;
        }
      } catch (err) {
        errors.push(`Error processing contact ${contactId}: ${err}`);
      }
    }

    return res.status(200).json({
      success: true,
      added,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      message: `Added ${added} contacts to "${list.name}". ${skipped} already in list.`
    });
  } catch (error) {
    console.error('Bulk add error:', error);
    return res.status(500).json({ error: 'Failed to add contacts to list' });
  }
}
