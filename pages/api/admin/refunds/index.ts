import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only SUPER_ADMIN and ADMIN can access refunds
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    if (req.method === 'GET') {
      const { status, type, search } = req.query;
      const supabase = supabaseAdmin();

      // Build query
      let query = supabase
        .from('refund_disputes')
        .select(`
          *,
          members!refund_disputes_member_id_fkey(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      // Search filter - use ilike for case-insensitive search
      if (search && typeof search === 'string' && search.trim() !== '') {
        // Note: Supabase doesn't support OR across joined tables in a simple way
        // For now, we'll search by ID only and handle member search separately
        query = query.ilike('id', `%${search}%`);
      }

      const { data: refundDisputes, error: disputesError } = await query;

      if (disputesError) {
        throw disputesError;
      }

      // Calculate SLA deadline (48 hours from creation for standard, 24 for high, 12 for urgent)
      const calculateSLA = (createdAt: Date, priority: string) => {
        const created = new Date(createdAt);
        let hoursToAdd = 48;

        switch (priority) {
          case 'HIGH':
            hoursToAdd = 24;
            break;
          case 'URGENT':
            hoursToAdd = 12;
            break;
          case 'MEDIUM':
          case 'LOW':
          default:
            hoursToAdd = 48;
        }

        return new Date(created.getTime() + hoursToAdd * 60 * 60 * 1000);
      };

      // Map to expected format
      const formattedRefunds = refundDisputes?.map((dispute: any) => ({
        id: dispute.id,
        ticketNumber: `RFD-${dispute.id.slice(0, 8).toUpperCase()}`,
        customerName: `${dispute.members?.first_name || ''} ${dispute.members?.last_name || ''}`.trim() || 'Unknown',
        customerEmail: dispute.members?.email || '',
        amount: Number(dispute.amount),
        type: dispute.type.charAt(0) + dispute.type.slice(1).toLowerCase().replace('_', ' '),
        status: dispute.status.charAt(0) + dispute.status.slice(1).toLowerCase().replace('_', ' '),
        priority: dispute.priority.charAt(0) + dispute.priority.slice(1).toLowerCase(),
        requestDate: dispute.created_at,
        slaDeadline: calculateSLA(new Date(dispute.created_at), dispute.priority).toISOString(),
        assignedTo: dispute.assigned_to || undefined,
        reason: dispute.reason || undefined,
      })) || [];

      return res.status(200).json(formattedRefunds);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Refunds API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
