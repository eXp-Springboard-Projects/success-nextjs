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
    return getSequences(req, res);
  } else if (req.method === 'POST') {
    return createSequence(req, res, session);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSequences(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = supabaseAdmin();
    const { status = '' } = req.query;

    let query = supabase
      .from('sequences')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sequencesData, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch sequences' });
    }

    // Add reply_rate calculation
    const sequences = sequencesData?.map(s => ({
      ...s,
      reply_rate: s.total_enrolled > 0 ? (s.total_replied / s.total_enrolled * 100) : 0,
    }));

    return res.status(200).json({ sequences });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch sequences' });
  }
}

async function createSequence(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const supabase = supabaseAdmin();
    const {
      name,
      description,
      steps = [],
      autoUnenrollOnReply = true,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const sequenceId = nanoid();

    const { data: sequence, error } = await supabase
      .from('sequences')
      .insert({
        id: sequenceId,
        name,
        description: description || null,
        steps,
        status: 'draft',
        auto_unenroll_on_reply: autoUnenrollOnReply,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create sequence' });
    }

    return res.status(201).json(sequence);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create sequence' });
  }
}
