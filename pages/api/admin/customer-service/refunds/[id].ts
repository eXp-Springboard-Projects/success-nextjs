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

    const { id } = req.query;

    if (req.method === 'GET') {
      const { data: refund, error } = await supabase
        .from('refunds')
        .select(`
          *,
          users:user_id (
            name,
            email
          )
        `)
        .eq('id', id as string)
        .single();

      if (error || !refund) {
        return res.status(404).json({ error: 'Refund not found' });
      }

      return res.status(200).json({
        refund: {
          id: refund.id,
          customerName: refund.users?.name || 'Unknown',
          customerEmail: refund.users?.email || 'Unknown',
          originalAmount: refund.original_amount || 0,
          refundAmount: refund.amount || 0,
          reason: refund.reason || 'Not specified',
          status: refund.status || 'pending',
          createdAt: refund.created_at,
          processedBy: refund.processed_by || 'System',
          paymentId: refund.payment_id,
          notes: refund.notes,
        },
      });
    }

    if (req.method === 'PATCH') {
      const { status, notes } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes) {
        // Append notes to existing notes
        const { data: existing } = await supabase
          .from('refunds')
          .select('notes')
          .eq('id', id as string)
          .single();

        updateData.notes = existing?.notes
          ? `${existing.notes}\n\n[${new Date().toISOString()}] ${notes}`
          : notes;
      }

      const { data: refund, error: updateError } = await supabase
        .from('refunds')
        .update(updateData)
        .eq('id', id as string)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating refund:', updateError);
        return res.status(500).json({ error: 'Failed to update refund' });
      }

      // Log activity
      const { error: activityError } = await supabase
        .from('staff_activity_feed')
        .insert({
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: session.user.id,
          user_name: session.user.name || session.user.email,
          user_email: session.user.email,
          action: status ? 'REFUND_STATUS_UPDATED' : 'REFUND_NOTES_ADDED',
          description: status
            ? `Updated refund status to ${status}`
            : 'Added notes to refund',
          entity_type: 'refund',
          entity_id: id as string,
          department: Department.CUSTOMER_SERVICE,
        });

      if (activityError) {
        console.error('Error logging activity:', activityError);
      }

      return res.status(200).json({
        refund: {
          id: refund.id,
          status: refund.status,
          notes: refund.notes,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in refund handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
