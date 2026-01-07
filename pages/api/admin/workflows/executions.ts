// API: Workflow Executions List
// Returns recent workflow executions

import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'STAFF') {
    return res.status(403).json({ message: 'Unauthorized - staff access required' });
  }

  try {
    const { filter = 'all', limit = 50 } = req.query;

    const supabase = supabaseAdmin();

    let query = supabase
      .from('workflow_executions')
      .select('*')
      .order('enrolledAt', { ascending: false })
      .limit(Number(limit));

    // Apply filter
    if (filter === 'active') {
      query = query.eq('status', 'active');
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed');
    } else if (filter === 'failed') {
      query = query.eq('status', 'failed');
    }

    const { data: executions, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({ executions });
  } catch (error: any) {
    console.error('Error fetching workflow executions:', error);
    return res.status(500).json({ message: error.message });
  }
}
