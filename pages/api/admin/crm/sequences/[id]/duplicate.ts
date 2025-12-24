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
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  try {
    const supabase = supabaseAdmin();

    const { data: sequence, error: fetchError } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    const newId = nanoid();
    const newName = `${sequence.name} (Copy)`;

    const { data: newSequence, error: insertError } = await supabase
      .from('sequences')
      .insert({
        id: newId,
        name: newName,
        description: sequence.description,
        steps: sequence.steps,
        status: 'draft',
        auto_unenroll_on_reply: sequence.auto_unenroll_on_reply,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to duplicate sequence' });
    }

    return res.status(201).json(newSequence);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to duplicate sequence' });
  }
}
