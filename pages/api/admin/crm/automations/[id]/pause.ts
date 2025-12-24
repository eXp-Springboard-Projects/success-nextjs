import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';

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
    return res.status(400).json({ error: 'Invalid automation ID' });
  }

  try {
    const supabase = supabaseAdmin();

    const { data: automation, error: fetchError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    if (automation.status === 'paused') {
      return res.status(400).json({ error: 'Automation is already paused' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('automations')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to pause automation' });
  }
}
