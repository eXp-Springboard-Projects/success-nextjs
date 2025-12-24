import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../../lib/supabase';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, tagId } = req.query;

  if (!id || typeof id !== 'string' || !tagId || typeof tagId !== 'string') {
    return res.status(400).json({ error: 'Invalid contact ID or tag ID' });
  }

  try {
    const supabase = supabaseAdmin();

    // Remove tag assignment
    const { error: deleteError } = await supabase
      .from('contact_tag_assignments')
      .delete()
      .eq('contact_id', id)
      .eq('tag_id', tagId);

    if (deleteError) throw deleteError;

    // Log activity
    await supabase
      .from('contact_activities')
      .insert({
        id: nanoid(),
        contact_id: id,
        type: 'tag_removed',
        description: 'Tag removed from contact',
        metadata: { tagId }
      });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove tag' });
  }
}
