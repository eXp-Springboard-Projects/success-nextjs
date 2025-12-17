import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
      const member = await prisma.members.findUnique({
        where: {
          id: id,
        },
        include: {
          subscriptions: {
            select: {
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              stripePriceId: true,
              stripeSubscriptionId: true,
              stripeCustomerId: true,
              cancelAtPeriodEnd: true,
              provider: true,
              tier: true,
            },
          },
          platformUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          transactions: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              type: true,
              description: true,
              provider: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
          orders: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Transform data for frontend
      type MemberTransaction = typeof member.transactions[number];
      type MemberOrder = typeof member.orders[number];
      const transformedMember = {
        ...member,
        totalSpent: member.totalSpent.toNumber(),
        lifetimeValue: member.lifetimeValue.toNumber(),
        transactions: member.transactions.map((t: MemberTransaction) => ({
          ...t,
          amount: t.amount.toNumber(),
        })),
        orders: member.orders.map((o: MemberOrder) => ({
          ...o,
          total: o.total.toNumber(),
        })),
      };

      return res.status(200).json(transformedMember);
    } catch (error) {
      console.error('Error fetching member:', error);
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
        const existingMember = await prisma.members.findUnique({
          where: { email },
        });

        if (existingMember && existingMember.id !== id) {
          return res.status(409).json({ message: 'Email already in use by another member' });
        }
      }

      // Validate priorityLevel if provided
      if (priorityLevel && !['Standard', 'High', 'VIP', 'Enterprise'].includes(priorityLevel)) {
        return res.status(400).json({ message: 'Invalid priority level' });
      }

      // Get current member data for audit log
      const currentMember = await prisma.members.findUnique({
        where: { id },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          tags: true,
          internalNotes: true,
          priorityLevel: true,
        },
      });

      if (!currentMember) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Build update data object (only include fields that were provided)
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (tags !== undefined) updateData.tags = tags;
      if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
      if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel;

      // Update member
      const updatedMember = await prisma.members.update({
        where: { id },
        data: updateData,
      });

      // Log the change in audit_logs
      await prisma.audit_logs.create({
        data: {
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
        },
      });

      return res.status(200).json({
        message: 'Member updated successfully',
        member: {
          ...updatedMember,
          totalSpent: updatedMember.totalSpent.toNumber(),
          lifetimeValue: updatedMember.lifetimeValue.toNumber(),
        },
      });
    } catch (error: any) {
      console.error('Error updating member:', error);
      return res.status(500).json({ message: error.message || 'Failed to update member' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete member (cascade will delete subscriptions, transactions, orders)
      await prisma.members.delete({
        where: {
          id: id,
        },
      });

      // Log the deletion in audit_logs
      await prisma.audit_logs.create({
        data: {
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
        },
      });

      return res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
      console.error('Error deleting member:', error);
      return res.status(500).json({ message: 'Failed to delete member' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
