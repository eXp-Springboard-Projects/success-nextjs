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

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid deal ID' });
  }

  try {
    const supabase = supabaseAdmin();
    const { type, description, metadata = {} } = req.body;

    if (!type || !description) {
      return res.status(400).json({ error: 'Type and description are required' });
    }

    const activityId = nanoid();

    const { data: activity, error } = await supabase
      .from('deal_activities')
      .insert({
        id: activityId,
        deal_id: id,
        type,
        description,
        metadata,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create activity:', error);
      return res.status(500).json({ error: 'Failed to create activity' });
    }

    return res.status(201).json(activity);
  } catch (error) {
    console.error('Failed to create activity:', error);
    return res.status(500).json({ error: 'Failed to create activity' });
  }
}
