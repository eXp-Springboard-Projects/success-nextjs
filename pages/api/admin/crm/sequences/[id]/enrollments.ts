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
    return res.status(400).json({ error: 'Invalid sequence ID' });
  }

  try {
    const supabase = supabaseAdmin();
    const { status = '' } = req.query;

    let query = supabase
      .from('sequence_enrollments')
      .select(`
        *,
        contacts (
          email,
          first_name,
          last_name,
          company
        ),
        deals (
          name
        )
      `)
      .eq('sequence_id', id)
      .order('enrolled_at', { ascending: false });

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data: enrollments, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to match the original format
    const formattedEnrollments = enrollments?.map(e => ({
      ...e,
      email: e.contacts?.email,
      first_name: e.contacts?.first_name,
      last_name: e.contacts?.last_name,
      company: e.contacts?.company,
      deal_name: e.deals?.name,
    }));

    return res.status(200).json({ enrollments: formattedEnrollments });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
}
