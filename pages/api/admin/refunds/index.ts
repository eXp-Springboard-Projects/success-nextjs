import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

      // Build where clause for filtering
      const where: any = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      if (type && type !== 'all') {
        where.type = type;
      }

      // Search by member name or ID
      if (search && typeof search === 'string' && search.trim() !== '') {
        where.OR = [
          { id: { contains: search, mode: 'insensitive' } },
          { member: { name: { contains: search, mode: 'insensitive' } } },
          { member: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Fetch refund disputes with member info
      const refundDisputes = await prisma.refund_disputes.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100, // Limit to 100 results
      });

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
      const formattedRefunds = refundDisputes.map((dispute) => ({
        id: dispute.id,
        ticketNumber: `RFD-${dispute.id.slice(0, 8).toUpperCase()}`,
        customerName: dispute.member.name || 'Unknown',
        customerEmail: dispute.member.email || '',
        amount: Number(dispute.amount),
        type: dispute.type.charAt(0) + dispute.type.slice(1).toLowerCase().replace('_', ' '),
        status: dispute.status.charAt(0) + dispute.status.slice(1).toLowerCase().replace('_', ' '),
        priority: dispute.priority.charAt(0) + dispute.priority.slice(1).toLowerCase(),
        requestDate: dispute.createdAt.toISOString(),
        slaDeadline: calculateSLA(dispute.createdAt, dispute.priority).toISOString(),
        assignedTo: dispute.assignedTo || undefined,
        reason: dispute.reason || undefined,
      }));

      return res.status(200).json(formattedRefunds);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Refunds API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
