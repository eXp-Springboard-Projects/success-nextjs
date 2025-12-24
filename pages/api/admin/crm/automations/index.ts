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

  if (req.method === 'GET') {
    return getAutomations(req, res);
  } else if (req.method === 'POST') {
    return createAutomation(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAutomations(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { status = '' } = req.query;

    let query = supabase
      .from('automations')
      .select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data: automations, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ automations: automations || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch automations' });
  }
}

async function createAutomation(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      description,
      trigger,
      steps = [],
    } = req.body;

    if (!name || !trigger) {
      return res.status(400).json({ error: 'Name and trigger are required' });
    }

    const automationId = nanoid();

    const { data: automation, error } = await supabase
      .from('automations')
      .insert({
        id: automationId,
        name,
        description: description || null,
        trigger,
        steps,
        status: 'draft',
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(automation);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create automation' });
  }
}
