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

    if (req.method === 'GET') {
      const {
        startDate,
        endDate,
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [refunds, total] = await Promise.all([
        prisma.refunds.findMany({
          where,
          include: {
            users: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limitNum,
          skip,
        }),
        prisma.refunds.count({ where })
      ]);

      return res.status(200).json({
        refunds: refunds.map(refund => ({
          id: refund.id,
          customerName: refund.users?.name || 'Unknown',
          customerEmail: refund.users?.email || 'Unknown',
          originalAmount: refund.originalAmount || 0,
          refundAmount: refund.amount || 0,
          reason: refund.reason || 'Not specified',
          processedBy: refund.processedBy || 'System',
          createdAt: refund.createdAt.toISOString(),
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
      const user = await prisma.users.findUnique({
        where: { email: customerEmail }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create refund record
      const refund = await prisma.refunds.create({
        data: {
          id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          paymentId,
          originalAmount: refundType === 'full' ? parseFloat(amount) || 0 : parseFloat(amount),
          amount: refundType === 'full' ? parseFloat(amount) || 0 : parseFloat(amount),
          reason,
          notes,
          status: 'pending',
          processedBy: session.user.email,
        },
      });

      // Log activity
      await prisma.staff_activity_feed.create({
        data: {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          userEmail: session.user.email,
          action: 'REFUND_PROCESSED',
          description: `Processed ${refundType} refund of $${amount} for ${customerEmail}`,
          entityType: 'refund',
          entityId: refund.id,
          department: 'CUSTOMER_SERVICE',
        },
      });

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
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
