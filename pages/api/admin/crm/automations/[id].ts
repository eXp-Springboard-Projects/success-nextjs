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
    return res.status(400).json({ error: 'Invalid automation ID' });
  }

  if (req.method === 'GET') {
    return getAutomation(id, res);
  } else if (req.method === 'PATCH') {
    return updateAutomation(id, req, res);
  } else if (req.method === 'DELETE') {
    return deleteAutomation(id, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAutomation(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { data: automation, error } = await supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    return res.status(200).json(automation);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch automation' });
  }
}

async function updateAutomation(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { name, description, trigger, steps, status } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (trigger !== undefined) updates.trigger = trigger;
    if (steps !== undefined) updates.steps = steps;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data: automation, error } = await supabase
      .from('automations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(automation);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update automation' });
  }
}

async function deleteAutomation(id: string, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from('automations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ message: 'Automation deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete automation' });
  }
}
