import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid automation ID' });
  }

  try {
    const supabase = supabaseAdmin();
    const { status = '' } = req.query;

    let query = supabase
      .from('automation_enrollments')
      .select(`
        *,
        contacts (
          email,
          first_name,
          last_name,
          company
        )
      `)
      .eq('automation_id', id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: enrollments, error } = await query
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ enrollments: enrollments || [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
}
