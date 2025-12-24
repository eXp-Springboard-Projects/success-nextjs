import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Department } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, Department.CUSTOMER_SERVICE)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'GET') {
      const {
        startDate,
        endDate,
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build the query
      let query = supabase
        .from('refunds')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      // Apply date filters
      if (startDate) {
        query = query.gte('created_at', new Date(startDate as string).toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', new Date(endDate as string).toISOString());
      }

      const { data: refunds, error, count } = await query;

      if (error) {
        console.error('Error fetching refunds:', error);
        return res.status(500).json({ error: 'Failed to fetch refunds' });
      }

      const total = count || 0;

      return res.status(200).json({
        refunds: (refunds || []).map(refund => ({
          id: refund.id,
          customerName: refund.users?.name || 'Unknown',
          customerEmail: refund.users?.email || 'Unknown',
          originalAmount: refund.original_amount || 0,
          refundAmount: refund.amount || 0,
          reason: refund.reason || 'Not specified',
          processedBy: refund.processed_by || 'System',
          createdAt: refund.created_at,
          status: refund.status || 'pending',
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    if (req.method === 'POST') {
      const { customerEmail, paymentId, amount, refundType, reason, notes } = req.body;

      if (!customerEmail || !paymentId || !reason) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Find user
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create refund record
      const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const refundAmount = refundType === 'full' ? parseFloat(amount) || 0 : parseFloat(amount);

      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          id: refundId,
          user_id: user.id,
          payment_id: paymentId,
          original_amount: refundAmount,
          amount: refundAmount,
          reason,
          notes,
          status: 'pending',
          processed_by: session.user.email,
        })
        .select()
        .single();

      if (refundError) {
        console.error('Error creating refund:', refundError);
        return res.status(500).json({ error: 'Failed to create refund' });
      }

      // Log activity
      const { error: activityError } = await supabase
        .from('staff_activity_feed')
        .insert({
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: session.user.id,
          user_name: session.user.name || session.user.email,
          user_email: session.user.email,
          action: 'REFUND_PROCESSED',
          description: `Processed ${refundType} refund of $${amount} for ${customerEmail}`,
          entity_type: 'refund',
          entity_id: refund.id,
          department: Department.CUSTOMER_SERVICE,
        });

      if (activityError) {
        console.error('Error logging activity:', activityError);
      }

      return res.status(201).json({
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in refunds handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
