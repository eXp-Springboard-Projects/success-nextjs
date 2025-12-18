import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { hasDepartmentAccess } from '@/lib/departmentAuth';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getSession({ req }) as any;

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check department access
    if (!hasDepartmentAccess(session.user.role, session.user.primaryDepartment, 'CUSTOMER_SERVICE')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.query;

    if (req.method === 'GET') {
      const refund = await prisma.refunds.findUnique({
        where: { id: id as string },
        include: {
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!refund) {
        return res.status(404).json({ error: 'Refund not found' });
      }

      return res.status(200).json({
        refund: {
          id: refund.id,
          customerName: refund.users?.name || 'Unknown',
          customerEmail: refund.users?.email || 'Unknown',
          originalAmount: refund.originalAmount || 0,
          refundAmount: refund.amount || 0,
          reason: refund.reason || 'Not specified',
          status: refund.status || 'pending',
          createdAt: refund.createdAt.toISOString(),
          processedBy: refund.processedBy || 'System',
          paymentId: refund.paymentId,
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
        const existing = await prisma.refunds.findUnique({
          where: { id: id as string },
          select: { notes: true },
        });
        updateData.notes = existing?.notes
          ? `${existing.notes}\n\n[${new Date().toISOString()}] ${notes}`
          : notes;
      }

      const refund = await prisma.refunds.update({
        where: { id: id as string },
        data: updateData,
      });

      // Log activity
      await prisma.staff_activity_feed.create({
        data: {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          userEmail: session.user.email,
          action: status ? 'REFUND_STATUS_UPDATED' : 'REFUND_NOTES_ADDED',
          description: status
            ? `Updated refund status to ${status}`
            : 'Added notes to refund',
          entityType: 'refund',
          entityId: id as string,
          department: 'CUSTOMER_SERVICE',
        },
      });

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
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
