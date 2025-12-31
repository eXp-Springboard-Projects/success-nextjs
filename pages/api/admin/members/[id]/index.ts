import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.query;
  const supabase = supabaseAdmin();

  if (req.method === 'GET') {
    try {
      // Fetch member details
      const { data: member, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      // Fetch subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('memberId', id)
        .order('createdAt', { ascending: false });

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('memberId', id)
        .order('createdAt', { ascending: false })
        .limit(10);

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('memberId', id)
        .order('createdAt', { ascending: false })
        .limit(10);

      // Transform to match frontend interface
      const memberData = {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        name: `${member.firstName} ${member.lastName}`.trim(),
        email: member.email,
        phone: member.phone,
        tags: member.tags,
        priorityLevel: member.priorityLevel || 'Standard',
        internalNotes: member.internalNotes,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        totalSpent: member.totalSpent || 0,
        lifetimeValue: member.lifetimeValue || 0,
        subscription: subscriptions?.[0] ? {
          status: subscriptions[0].status,
          currentPeriodStart: subscriptions[0].currentPeriodStart,
          currentPeriodEnd: subscriptions[0].currentPeriodEnd,
          stripePriceId: subscriptions[0].stripePriceId,
          stripeSubscriptionId: subscriptions[0].stripeSubscriptionId,
          stripeCustomerId: subscriptions[0].stripeCustomerId,
          cancelAtPeriodEnd: subscriptions[0].cancelAtPeriodEnd || false,
        } : undefined,
        transactions: transactions || [],
        orders: orders || [],
      };

      return res.status(200).json(memberData);
    } catch (error) {
      console.error('Error fetching member:', error);
      return res.status(500).json({ error: 'Failed to fetch member' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;

      const { data, error } = await supabase
        .from('members')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Error updating member:', error);
      return res.status(500).json({ error: 'Failed to update member' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
