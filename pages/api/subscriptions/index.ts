import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = supabaseAdmin();

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can view all subscriptions
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const { status, page = '1', limit = '50' } = req.query;

      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const skip = (pageNumber - 1) * limitNumber;

      // Build query
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          members!inner(
            id,
            firstName,
            lastName,
            email,
            membershipTier,
            membershipStatus
          )
        `, { count: 'exact' })
        .range(skip, skip + limitNumber - 1)
        .order('createdAt', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: subscriptions, error, count } = await query;

      if (error) {
        throw error;
      }

      return res.status(200).json({
        subscriptions: subscriptions || [],
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNumber),
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Subscriptions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
