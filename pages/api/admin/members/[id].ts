import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = supabaseAdmin();

  // Check authentication
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Check if user has admin role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid member ID' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch specific member with subscription details
      const { data: member, error } = await supabase
        .from('members')
        .select(`
          *,
          subscriptions(
            status,
            currentPeriodStart,
            currentPeriodEnd,
            stripePriceId,
            stripeSubscriptionId,
            stripeCustomerId,
            cancelAtPeriodEnd,
            provider,
            tier
          ),
          users!members_linkedMemberId_fkey(
            id,
            name,
            email,
            role
          ),
          transactions(
            id,
            amount,
            currency,
            status,
            type,
            description,
            provider,
            createdAt
          ),
          orders(
            id,
            orderNumber,
            total,
            status,
            createdAt
          )
        `)
        .eq('id', id)
        .single();

      if (error || !member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Sort transactions and orders by createdAt descending, take 10 each
      const transactions = (member.transactions || [])
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      const orders = (member.orders || [])
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      // Transform data for frontend
      const transformedMember = {
        ...member,
        totalSpent: member.totalSpent || 0,
        lifetimeValue: member.lifetimeValue || 0,
        transactions: transactions.map((t: any) => ({
          ...t,
          amount: t.amount || 0,
        })),
        orders: orders.map((o: any) => ({
          ...o,
          total: o.total || 0,
        })),
        platformUser: member.users || null,
        users: undefined, // Remove the raw users field
      };

      return res.status(200).json(transformedMember);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch member' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        tags,
        internalNotes,
        priorityLevel,
      } = req.body;

      // Validate email format if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check for duplicate email (excluding current member)
        const { data: existingMember } = await supabase
          .from('members')
          .select('id')
          .eq('email', email)
          .single();

        if (existingMember && existingMember.id !== id) {
          return res.status(409).json({ message: 'Email already in use by another member' });
        }
      }

      // Validate priorityLevel if provided
      if (priorityLevel && !['Standard', 'High', 'VIP', 'Enterprise'].includes(priorityLevel)) {
        return res.status(400).json({ message: 'Invalid priority level' });
      }

      // Get current member data for audit log
      const { data: currentMember, error: fetchError } = await supabase
        .from('members')
        .select('firstName, lastName, email, phone, tags, internalNotes, priorityLevel')
        .eq('id', id)
        .single();

      if (fetchError || !currentMember) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Build update data object (only include fields that were provided)
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (tags !== undefined) updateData.tags = tags;
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
      if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel;

      // Update member
      const { data: updatedMember, error: updateError } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Log the change in audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          userEmail: session.user.email,
          userName: session.user.name,
          action: 'member.updated',
          entityType: 'Member',
          entityId: id,
          changes: {
            before: currentMember,
            after: {
              firstName: updatedMember.firstName,
              lastName: updatedMember.lastName,
              email: updatedMember.email,
              phone: updatedMember.phone,
              tags: updatedMember.tags,
              internalNotes: updatedMember.internalNotes,
              priorityLevel: updatedMember.priorityLevel,
            },
          },
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null,
          requestUrl: req.url || null,
          method: 'PATCH',
          statusCode: 200,
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
      }

      return res.status(200).json({
        message: 'Member updated successfully',
        member: {
          ...updatedMember,
          totalSpent: updatedMember.totalSpent || 0,
          lifetimeValue: updatedMember.lifetimeValue || 0,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Failed to update member' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete member (cascade will delete subscriptions, transactions, orders)
      const { error: deleteError } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Log the deletion in audit_logs
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          userEmail: session.user.email,
          userName: session.user.name,
          action: 'member.deleted',
          entityType: 'Member',
          entityId: id,
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null,
          requestUrl: req.url || null,
          method: 'DELETE',
          statusCode: 200,
        });

      if (auditError) {
        console.error('Failed to create audit log:', auditError);
      }

      return res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to delete member' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
