import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { tagId } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID' });
  }

  if (!tagId) {
    return res.status(400).json({ error: 'Tag ID is required' });
  }

  try {
    const supabase = supabaseAdmin();

    // Add tag assignment
    const { error: assignError } = await supabase
      .from('contact_tag_assignments')
      .insert({ contact_id: id, tag_id: tagId })
      .select()
      .single();

    // Ignore duplicate errors (ON CONFLICT DO NOTHING)
    if (assignError && !assignError.message.includes('duplicate')) {
      throw assignError;
    }

    // Log activity
    await supabase
      .from('contact_activities')
      .insert({
        id: nanoid(),
        contact_id: id,
        type: 'tag_added',
        description: 'Tag added to contact',
        metadata: { tagId }
      });

    // Get tag details
    const { data: tag, error: tagError } = await supabase
      .from('contact_tags')
      .select('*')
      .eq('id', tagId)
      .single();

    if (tagError) throw tagError;

    return res.status(201).json(tag);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add tag' });
  }
}
