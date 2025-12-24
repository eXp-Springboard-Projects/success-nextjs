import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  if (req.method === 'GET') {
    return getSequence(id, res);
  } else if (req.method === 'PATCH') {
    return updateSequence(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteSequence(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSequence(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { data: sequence, error } = await supabase
      .from('sequences')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    return res.status(200).json(sequence);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sequence' });
  }
}

async function updateSequence(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { name, description, steps, status, autoUnenrollOnReply } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (steps !== undefined) updateData.steps = steps;
    if (status !== undefined) updateData.status = status;
    if (autoUnenrollOnReply !== undefined) updateData.auto_unenroll_on_reply = autoUnenrollOnReply;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateData.updated_at = new Date().toISOString();

    const { data: sequence, error } = await supabase
      .from('sequences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update sequence' });
    }

    return res.status(200).json(sequence);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update sequence' });
  }
}

async function deleteSequence(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('sequences')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete sequence' });
    }

    return res.status(200).json({ message: 'Sequence deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete sequence' });
  }
}
