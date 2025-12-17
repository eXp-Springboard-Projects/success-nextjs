import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days = '30' } = req.query;
    const daysAgo = parseInt(String(days));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    // Tickets over time
    const ticketsOverTime = await prisma.$queryRaw<Array<{
      date: string;
      count: bigint;
    }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM tickets
      WHERE "createdAt" >= ${cutoffDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Resolution time over time
    const resolutionTimeOverTime = await prisma.$queryRaw<Array<{
      date: string;
      avg_hours: number;
    }>>`
      SELECT
        DATE("resolvedAt") as date,
        AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) as avg_hours
      FROM tickets
      WHERE "resolvedAt" >= ${cutoffDate}
        AND "resolvedAt" IS NOT NULL
      GROUP BY DATE("resolvedAt")
      ORDER BY date ASC
    `;

    // Tickets by category
    const ticketsByCategory = await prisma.$queryRaw<Array<{
      category: string;
      count: bigint;
    }>>`
      SELECT
        COALESCE(category, 'Uncategorized') as category,
        COUNT(*) as count
      FROM tickets
      WHERE "createdAt" >= ${cutoffDate}
      GROUP BY category
      ORDER BY count DESC
    `;

    // Average resolution time
    const avgResolutionResult = await prisma.$queryRaw<Array<{ avg_hours: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) as avg_hours
      FROM tickets
      WHERE "resolvedAt" >= ${cutoffDate}
        AND "resolvedAt" IS NOT NULL
    `;

    const avgResolutionTime = avgResolutionResult[0]?.avg_hours || 0;

    // Total tickets
    const totalTickets = await prisma.tickets.count({
      where: {
        createdAt: { gte: cutoffDate },
      },
    });

    return res.status(200).json({
      ticketsOverTime: ticketsOverTime.map(t => ({
        date: t.date,
        count: Number(t.count),
      })),
      resolutionTimeOverTime: resolutionTimeOverTime.map(r => ({
        date: r.date,
        avgHours: Number(r.avg_hours),
      })),
      ticketsByCategory: ticketsByCategory.map(t => ({
        category: t.category,
        count: Number(t.count),
      })),
      avgResolutionTime: Number(avgResolutionTime),
      totalTickets,
    });
  } catch (error) {
    console.error('Error fetching ticket reports:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket reports' });
  }
}
