import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  // Only admins can view stats
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid paylink ID' });
  }

  try {
    const supabase = supabaseAdmin();

    // Get paylink
    const { data: paylink, error } = await supabase
      .from('pay_links')
      .select('*')
      .eq('id', id)
      .single();

    if (!paylink || error) {
      return res.status(404).json({ error: 'Paylink not found' });
    }

    // Get payment history from orders table (if payments were tracked there)
    // For now, return basic stats from the paylink itself
    const stats = {
      totalUses: paylink.currentUses,
      maxUses: paylink.maxUses,
      remainingUses: paylink.maxUses ? paylink.maxUses - paylink.currentUses : null,
      totalRevenue: Number(paylink.amount) * paylink.currentUses,
      status: paylink.status,
      isExpired: paylink.expiresAt ? new Date(paylink.expiresAt) < new Date() : false,
      isMaxedOut: paylink.maxUses ? paylink.currentUses >= paylink.maxUses : false,
      createdAt: paylink.createdAt,
      lastUsed: null, // Would need to track this in a separate payments table
      conversionRate: null, // Would need page view tracking
    };

    return res.status(200).json(stats);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
