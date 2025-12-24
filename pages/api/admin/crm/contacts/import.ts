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

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const supabase = supabaseAdmin();

    for (const contact of contacts) {
      try {
        const { email, firstName, lastName, phone, company, tags = [], lists = [] } = contact;

        if (!email) {
          results.skipped++;
          results.errors.push(`Skipped: missing email`);
          continue;
        }

        // Check if contact exists
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', email)
          .limit(1);

        if (existing && existing.length > 0) {
          results.skipped++;
          results.errors.push(`Skipped: ${email} already exists`);
          continue;
        }

        const contactId = nanoid();

        // Create contact
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            id: contactId,
            email,
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
            company: company || null,
            source: 'import'
          });

        if (contactError) throw contactError;

        // Add tags (create tag if doesn't exist, then assign)
        for (const tagName of tags) {
          if (tagName && tagName.trim()) {
            // Create tag if it doesn't exist (upsert)
            const tagId = nanoid();
            await supabase
              .from('contact_tags')
              .upsert(
                { id: tagId, name: tagName.trim() },
                { onConflict: 'name', ignoreDuplicates: true }
              );

            // Get tag ID
            const { data: tagResult } = await supabase
              .from('contact_tags')
              .select('id')
              .eq('name', tagName.trim())
              .single();

            if (tagResult) {
              await supabase
                .from('contact_tag_assignments')
                .insert({ contact_id: contactId, tag_id: tagResult.id })
                .select()
                .single();
            }
          }
        }

        // Add to lists (create list if doesn't exist, then assign)
        for (const listName of lists) {
          if (listName && listName.trim()) {
            // Create list if it doesn't exist (upsert)
            const listId = nanoid();
            await supabase
              .from('contact_lists')
              .upsert(
                { id: listId, name: listName.trim(), type: 'static' },
                { onConflict: 'name', ignoreDuplicates: true }
              );

            // Get list ID
            const { data: listResult } = await supabase
              .from('contact_lists')
              .select('id')
              .eq('name', listName.trim())
              .single();

            if (listResult) {
              await supabase
                .from('contact_list_members')
                .insert({ contact_id: contactId, list_id: listResult.id })
                .select()
                .single();
            }
          }
        }

        results.imported++;
      } catch (error) {
        results.errors.push(`Error importing ${contact.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to import contacts' });
  }
}
