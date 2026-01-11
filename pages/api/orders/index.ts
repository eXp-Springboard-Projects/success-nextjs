import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return getOrders(req, res, session.user.id);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getOrders(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const supabase = supabaseAdmin();
    const { status } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({ orders: orders || [] });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
