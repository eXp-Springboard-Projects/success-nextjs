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

    // Pipeline value over time
    const pipelineOverTime = await prisma.$queryRaw<Array<{
      date: string;
      value: number;
    }>>`
      SELECT
        DATE("createdAt") as date,
        SUM(value) as value
      FROM deals
      WHERE "createdAt" >= ${cutoffDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Win/Loss rate
    const winLossRate = await prisma.$queryRaw<Array<{
      stage: string;
      count: bigint;
    }>>`
      SELECT
        CASE
          WHEN "stageId" IN (SELECT id FROM deal_stages WHERE name = 'Closed Won') THEN 'won'
          WHEN "stageId" IN (SELECT id FROM deal_stages WHERE name = 'Closed Lost') THEN 'lost'
          ELSE 'other'
        END as stage,
        COUNT(*) as count
      FROM deals
      WHERE "closedAt" >= ${cutoffDate}
      GROUP BY stage
    `;

    const wonCount = Number(winLossRate.find(r => r.stage === 'won')?.count || 0);
    const lostCount = Number(winLossRate.find(r => r.stage === 'lost')?.count || 0);

    // Average deal size
    const avgDealSizeResult = await prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(value) as avg
      FROM deals
      WHERE "closedAt" >= ${cutoffDate}
        AND "stageId" IN (SELECT id FROM deal_stages WHERE name = 'Closed Won')
    `;

    const avgDealSize = avgDealSizeResult[0]?.avg || 0;

    // Average sales cycle length
    const avgSalesCycleResult = await prisma.$queryRaw<Array<{ avg: number }>>`
      SELECT AVG(EXTRACT(EPOCH FROM ("closedAt" - "createdAt")) / 86400) as avg
      FROM deals
      WHERE "closedAt" >= ${cutoffDate}
        AND "closedAt" IS NOT NULL
    `;

    const avgSalesCycle = Math.round(avgSalesCycleResult[0]?.avg || 0);

    // Revenue by owner
    const revenueByOwner = await prisma.$queryRaw<Array<{
      owner_id: string;
      owner_name: string;
      revenue: number;
    }>>`
      SELECT
        d."ownerId" as owner_id,
        u.name as owner_name,
        SUM(d.value) as revenue
      FROM deals d
      LEFT JOIN users u ON d."ownerId" = u.id
      WHERE d."closedAt" >= ${cutoffDate}
        AND d."stageId" IN (SELECT id FROM deal_stages WHERE name = 'Closed Won')
      GROUP BY d."ownerId", u.name
      ORDER BY revenue DESC
      LIMIT 10
    `;

    return res.status(200).json({
      pipelineOverTime: pipelineOverTime.map(p => ({
        date: p.date,
        value: Number(p.value),
      })),
      winLossRate: {
        won: wonCount,
        lost: lostCount,
      },
      avgDealSize: Number(avgDealSize),
      avgSalesCycle,
      revenueByOwner: revenueByOwner.map(r => ({
        owner: r.owner_name || 'Unassigned',
        revenue: Number(r.revenue),
      })),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch deal reports' });
  }
}
