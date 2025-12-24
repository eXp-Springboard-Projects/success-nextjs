import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  try {
    const supabase = supabaseAdmin();

    const [submissionsResult, countResult] = await Promise.all([
      supabase
        .from('form_submissions')
        .select(`
          *,
          contact:contacts(id, email, first_name, last_name)
        `)
        .eq('form_id', id as string)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('form_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('form_id', id as string),
    ]);

    const { data: submissions, error: submissionsError } = submissionsResult;
    const { count: total, error: countError } = countResult;

    if (submissionsError || countError) {
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }

    return res.status(200).json({
      submissions,
      pagination: {
        page,
        limit,
        total: total || 0,
        pages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}
